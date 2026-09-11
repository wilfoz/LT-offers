import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, PermissionScope, hasScope } from '@lt-offers/domain';
import { ROLES_KEY, SCOPES_KEY } from './auth.decorators';
import { AuthService } from './auth.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    const requiredScopes = this.reflector.getAllAndOverride<PermissionScope[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Se nenhuma restrição foi declarada, permite acesso
    if (!requiredRoles?.length && !requiredScopes?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = this.authService.resolveUserFromRequest(request);

    // Administrador tem acesso total
    if (user.role === 'ADMIN' || user.scopes.includes('ADMIN')) {
      return true;
    }

    // Validação por papéis explícitos
    if (requiredRoles?.length) {
      const hasRoleMatch = requiredRoles.includes(user.role);
      if (!hasRoleMatch) {
        throw new ForbiddenException(
          `Acesso não autorizado para o perfil '${user.role}'. Papéis permitidos: ${requiredRoles.join(', ')}.`
        );
      }
    }

    // Validação por escopos de permissão
    if (requiredScopes?.length) {
      const hasAllScopes = requiredScopes.every((scope) => hasScope(user, scope));
      if (!hasAllScopes) {
        throw new ForbiddenException(
          `Acesso não autorizado. O usuário '${user.name}' (${user.role}) não possui os escopos necessários: ${requiredScopes.join(', ')}.`
        );
      }
    }

    return true;
  }
}
