import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { AuthService } from './auth.service';
import { CANONICAL_USERS } from '@lt-offers/domain';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let authService: AuthService;

  beforeEach(() => {
    reflector = new Reflector();
    authService = new AuthService();
    guard = new RolesGuard(reflector, authService);
  });

  function createMockContext(
    headers: Record<string, string>,
  ): ExecutionContext {
    const request = {
      headers,
      user: undefined,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('permite acesso quando nenhuma restrição for configurada', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext({});
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite acesso irrestrito para usuário ADMIN', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'roles') return ['COMMERCIAL'];
      return undefined;
    });

    const ctx = createMockContext({ 'x-user-role': 'ADMIN' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('permite acesso quando o usuário possui o papel exigido', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'roles') return ['ENGINEERING', 'ADMIN'];
      return undefined;
    });

    const ctx = createMockContext({ 'x-user-role': 'ENGINEERING' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('lança ForbiddenException quando o usuário não possui o papel exigido', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'roles') return ['COMMERCIAL'];
      return undefined;
    });

    const ctx = createMockContext({ 'x-user-role': 'ENGINEERING' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('permite acesso quando o usuário possui os escopos requeridos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'scopes') return ['PRICING_WRITE'];
      return undefined;
    });

    const ctx = createMockContext({ 'x-user-role': 'PROCUREMENT' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('lança ForbiddenException quando o usuário não possui todos os escopos requeridos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'scopes') return ['COMMERCIAL_READ_SENSITIVE'];
      return undefined;
    });

    const ctx = createMockContext({ 'x-user-role': 'PLANNING' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
