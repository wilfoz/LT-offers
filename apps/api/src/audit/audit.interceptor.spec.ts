import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuthService } from '../auth/auth.service';
import { AuditService } from './audit.service';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let reflector: Reflector;
  let authService: AuthService;
  let auditService: AuditService;

  beforeEach(() => {
    reflector = new Reflector();
    authService = new AuthService();
    auditService = new AuditService();
    interceptor = new AuditInterceptor(reflector, authService, auditService);
  });

  function createMockContext(method: string, body: any, headers: Record<string, string>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method,
          body,
          headers,
          params: { offerId: '10' },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('não registra auditoria para requisições GET', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ resource: 'OFFER' });
    const logSpy = jest.spyOn(auditService, 'logEvent');

    const ctx = createMockContext('GET', {}, {});
    const next: CallHandler = { handle: () => of({ success: true }) };

    interceptor.intercept(ctx, next).subscribe({
      next: () => {
        expect(logSpy).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('registra evento de auditoria após mutação POST bem-sucedida', (done) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({
      resource: 'OFFER',
      action: 'CREATE',
      description: 'Criação de oferta',
    });
    const logSpy = jest.spyOn(auditService, 'logEvent');

    const ctx = createMockContext('POST', { name: 'Oferta Nova' }, { 'x-user-role': 'COMMERCIAL' });
    const next: CallHandler = { handle: () => of({ id: '10', name: 'Oferta Nova' }) };

    interceptor.intercept(ctx, next).subscribe({
      next: () => {
        expect(logSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            resource: 'OFFER',
            action: 'CREATE',
            offerId: '10',
            userRole: 'COMMERCIAL',
          })
        );
        done();
      },
    });
  });
});
