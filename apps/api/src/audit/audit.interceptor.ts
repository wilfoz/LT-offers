import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditAction, AuditResource, AuditDiff } from '@lt-offers/domain';
import { AUDITED_KEY, AuditedOptions } from '../auth/auth.decorators';
import { AuthService } from '../auth/auth.service';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly auditService: AuditService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditedOptions = this.reflector.getAllAndOverride<AuditedOptions>(
      AUDITED_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!auditedOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method?.toUpperCase();

    // Registra mutações (POST, PUT, PATCH, DELETE)
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (!isMutation) {
      return next.handle();
    }

    const user = this.authService.resolveUserFromRequest(request);
    const offerId = request.params?.offerId || request.body?.offerId;
    const resourceId = request.params?.id || request.params?.lineId || request.params?.riskId;

    let defaultAction: AuditAction = 'UPDATE';
    if (method === 'POST') defaultAction = 'CREATE';
    if (method === 'DELETE') defaultAction = 'DELETE';

    const action = auditedOptions.action || defaultAction;
    const resource: AuditResource = auditedOptions.resource;

    const body = request.body || {};
    const diffs: AuditDiff[] = Object.keys(body).map((key) => ({
      field: key,
      previousValue: undefined,
      newValue: body[key],
    }));

    return next.handle().pipe(
      tap(() => {
        const description =
          auditedOptions.description ||
          `Operação ${action} em ${resource} realizada por ${user.name} (${user.role})`;

        this.auditService.logEvent({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          resource,
          resourceId: resourceId ? String(resourceId) : undefined,
          offerId: offerId ? String(offerId) : undefined,
          action,
          description,
          diffs: diffs.length > 0 ? diffs : undefined,
        });
      })
    );
  }
}
