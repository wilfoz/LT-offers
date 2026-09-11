import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole, PermissionScope, AuditResource, AuditAction, UserProfile, CANONICAL_USERS, ROLE_PERMISSIONS_MAP } from '@lt-offers/domain';

export const ROLES_KEY = 'roles';
export const SCOPES_KEY = 'scopes';
export const AUDITED_KEY = 'audited';

/**
 * Decorador para restringir acesso a rotas por perfis específicos (RF-64).
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorador para restringir acesso a rotas por escopos específicos (RF-64, RNF-17).
 */
export const RequireScopes = (...scopes: PermissionScope[]) => SetMetadata(SCOPES_KEY, scopes);

/**
 * Decorador para marcar endpoints mutantes para auditoria imutável automática (RF-65, RNF-12).
 */
export interface AuditedOptions {
  resource: AuditResource;
  action?: AuditAction;
  description?: string;
}

export const Audited = (options: AuditedOptions) => SetMetadata(AUDITED_KEY, options);

/**
 * Decorador de parâmetro para injetar o usuário atual da requisição.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserProfile => {
    const request = ctx.switchToHttp().getRequest();
    if (request.user) {
      return request.user;
    }

    // Extração por cabeçalhos x-user-id ou x-user-role (simulação e testes)
    const userId = request.headers['x-user-id'] as string;
    const userRole = request.headers['x-user-role'] as UserRole;

    if (userId) {
      const found = CANONICAL_USERS.find((u) => u.id === userId);
      if (found) {
        request.user = found;
        return found;
      }
    }

    if (userRole && ROLE_PERMISSIONS_MAP[userRole]) {
      const found = CANONICAL_USERS.find((u) => u.role === userRole) || {
        id: `user-${userRole.toLowerCase()}-auto`,
        name: `Usuário ${userRole}`,
        email: `${userRole.toLowerCase()}@orcamento-lt.com.br`,
        role: userRole,
        scopes: ROLE_PERMISSIONS_MAP[userRole],
      };
      request.user = found;
      return found;
    }

    // Padrão: Usuário ADMIN para compatibilidade sem cabeçalho explícito
    const defaultUser = CANONICAL_USERS.find((u) => u.role === 'ADMIN') || CANONICAL_USERS[4];
    request.user = defaultUser;
    return defaultUser;
  }
);
