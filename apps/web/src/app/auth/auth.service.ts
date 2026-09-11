import { Injectable, computed, signal } from '@angular/core';
import {
  UserProfile,
  UserRole,
  PermissionScope,
  CANONICAL_USERS,
  hasScope,
  canViewSensitiveCommercialData,
  ROLE_PERMISSIONS_MAP,
} from '@lt-offers/domain';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  readonly availableUsers = CANONICAL_USERS;

  // Usuário ativo inicial padrão: ADMIN (para acesso total em desenvolvimento)
  readonly currentUser = signal<UserProfile>(CANONICAL_USERS[4]);

  readonly activeRole = computed(() => this.currentUser().role);
  readonly activeUserName = computed(() => this.currentUser().name);
  readonly activeUserEmail = computed(() => this.currentUser().email);

  readonly canViewCommercial = computed(() =>
    canViewSensitiveCommercialData(this.currentUser())
  );

  readonly canEditEngineering = computed(() =>
    this.hasPermission('ENGINEERING_WRITE')
  );

  readonly canEditPricing = computed(() =>
    this.hasPermission('PRICING_WRITE')
  );

  readonly canEditSchedule = computed(() =>
    this.hasPermission('SCHEDULE_WRITE')
  );

  readonly canEditCommercial = computed(() =>
    this.hasPermission('COMMERCIAL_WRITE')
  );

  readonly isAdmin = computed(
    () => this.currentUser().role === 'ADMIN' || this.hasPermission('ADMIN')
  );

  switchUser(user: UserProfile): void {
    this.currentUser.set(user);
  }

  switchRole(role: UserRole): void {
    const found = this.availableUsers.find((u) => u.role === role);
    if (found) {
      this.currentUser.set(found);
    } else {
      this.currentUser.set({
        id: `user-${role.toLowerCase()}`,
        name: `Usuário ${role}`,
        email: `${role.toLowerCase()}@orcamento-lt.com.br`,
        role,
        scopes: ROLE_PERMISSIONS_MAP[role] || [],
      });
    }
  }

  hasPermission(scope: PermissionScope): boolean {
    return hasScope(this.currentUser(), scope);
  }

  canViewSensitiveCommercialData(): boolean {
    return canViewSensitiveCommercialData(this.currentUser());
  }
}
