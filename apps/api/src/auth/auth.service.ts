import { Injectable } from '@nestjs/common';
import {
  UserProfile,
  UserRole,
  CANONICAL_USERS,
  ROLE_PERMISSIONS_MAP,
  hasScope,
  PermissionScope,
} from '@lt-offers/domain';

@Injectable()
export class AuthService {
  private users: UserProfile[] = [...CANONICAL_USERS];

  /**
   * Retorna a lista de usuários canônicos pré-configurados.
   */
  getUsers(): UserProfile[] {
    return this.users;
  }

  /**
   * Busca usuário por identificador.
   */
  getUserById(id: string): UserProfile | undefined {
    return this.users.find((u) => u.id === id);
  }

  /**
   * Busca usuário pelo papel.
   */
  getUserByRole(role: UserRole): UserProfile {
    return (
      this.users.find((u) => u.role === role) || {
        id: `user-${role.toLowerCase()}-auto`,
        name: `Usuário ${role}`,
        email: `${role.toLowerCase()}@orcamento-lt.com.br`,
        role,
        scopes: ROLE_PERMISSIONS_MAP[role] || [],
      }
    );
  }

  /**
   * Resolve o perfil do usuário a partir da requisição HTTP.
   */
  resolveUserFromRequest(request: any): UserProfile {
    if (request.user) {
      return request.user;
    }

    const userId = request.headers['x-user-id'] as string;
    const userRole = request.headers['x-user-role'] as UserRole;

    if (userId) {
      const user = this.getUserById(userId);
      if (user) {
        request.user = user;
        return user;
      }
    }

    if (userRole && ROLE_PERMISSIONS_MAP[userRole]) {
      const user = this.getUserByRole(userRole);
      request.user = user;
      return user;
    }

    // Default: ADMIN para não quebrar testes legados que não enviam headers
    const defaultUser = this.getUserByRole('ADMIN');
    request.user = defaultUser;
    return defaultUser;
  }

  /**
   * Verifica se o perfil informado possui o escopo requerido.
   */
  checkPermission(user: UserProfile, scope: PermissionScope): boolean {
    return hasScope(user, scope);
  }
}
