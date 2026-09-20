/**
 * Papéis de usuário canônicos do sistema (RF-64).
 */
export type UserRole =
  'ENGINEERING' | 'PROCUREMENT' | 'PLANNING' | 'COMMERCIAL' | 'ADMIN';

/**
 * Escopos granulares de permissão de acesso (RF-64, RNF-17).
 */
export type PermissionScope =
  | 'OFFER_READ'
  | 'OFFER_WRITE'
  | 'ENGINEERING_READ'
  | 'ENGINEERING_WRITE'
  | 'PRICING_READ'
  | 'PRICING_WRITE'
  | 'SCHEDULE_READ'
  | 'SCHEDULE_WRITE'
  | 'COMMERCIAL_READ'
  | 'COMMERCIAL_WRITE'
  | 'COMMERCIAL_READ_SENSITIVE'
  | 'CATALOG_READ'
  | 'CATALOG_WRITE'
  | 'AUDIT_READ'
  | 'ADMIN';

/**
 * Perfil de usuário autenticado.
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  scopes: PermissionScope[];
}

/**
 * Mapeamento padrão de papéis para escopos de permissão (RF-64, RNF-17).
 */
export const ROLE_PERMISSIONS_MAP: Record<UserRole, PermissionScope[]> = {
  ENGINEERING: [
    'OFFER_READ',
    'ENGINEERING_READ',
    'ENGINEERING_WRITE',
    'PRICING_READ',
    'SCHEDULE_READ',
    'COMMERCIAL_READ',
    'CATALOG_READ',
    'AUDIT_READ',
  ],
  PROCUREMENT: [
    'OFFER_READ',
    'ENGINEERING_READ',
    'PRICING_READ',
    'PRICING_WRITE',
    'SCHEDULE_READ',
    'COMMERCIAL_READ',
    'CATALOG_READ',
    'AUDIT_READ',
  ],
  PLANNING: [
    'OFFER_READ',
    'ENGINEERING_READ',
    'PRICING_READ',
    'SCHEDULE_READ',
    'SCHEDULE_WRITE',
    'COMMERCIAL_READ',
    'CATALOG_READ',
    'AUDIT_READ',
  ],
  COMMERCIAL: [
    'OFFER_READ',
    'OFFER_WRITE',
    'ENGINEERING_READ',
    'PRICING_READ',
    'SCHEDULE_READ',
    'COMMERCIAL_READ',
    'COMMERCIAL_WRITE',
    'COMMERCIAL_READ_SENSITIVE',
    'CATALOG_READ',
    'AUDIT_READ',
  ],
  ADMIN: [
    'OFFER_READ',
    'OFFER_WRITE',
    'ENGINEERING_READ',
    'ENGINEERING_WRITE',
    'PRICING_READ',
    'PRICING_WRITE',
    'SCHEDULE_READ',
    'SCHEDULE_WRITE',
    'COMMERCIAL_READ',
    'COMMERCIAL_WRITE',
    'COMMERCIAL_READ_SENSITIVE',
    'CATALOG_READ',
    'CATALOG_WRITE',
    'AUDIT_READ',
    'ADMIN',
  ],
};

/**
 * Verifica se um usuário possui determinado escopo de permissão.
 */
export function hasScope(user: UserProfile, scope: PermissionScope): boolean {
  if (user.role === 'ADMIN' || user.scopes.includes('ADMIN')) {
    return true;
  }
  return user.scopes.includes(scope);
}

/**
 * Verifica se o usuário tem permissão para visualizar dados confidenciais de margem (RNF-17).
 */
export function canViewSensitiveCommercialData(user: UserProfile): boolean {
  return hasScope(user, 'COMMERCIAL_READ_SENSITIVE');
}

/**
 * Usuários canônicos para simulação e testes de papéis (RF-64).
 */
export const CANONICAL_USERS: UserProfile[] = [
  {
    id: 'user-eng-01',
    name: 'Carlos Engenharia',
    email: 'carlos.engenharia@orcamento-lt.com.br',
    role: 'ENGINEERING',
    scopes: ROLE_PERMISSIONS_MAP.ENGINEERING,
  },
  {
    id: 'user-proc-01',
    name: 'Ana Suprimentos',
    email: 'ana.suprimentos@orcamento-lt.com.br',
    role: 'PROCUREMENT',
    scopes: ROLE_PERMISSIONS_MAP.PROCUREMENT,
  },
  {
    id: 'user-plan-01',
    name: 'Roberto Planejamento',
    email: 'roberto.planejamento@orcamento-lt.com.br',
    role: 'PLANNING',
    scopes: ROLE_PERMISSIONS_MAP.PLANNING,
  },
  {
    id: 'user-comm-01',
    name: 'Marcos Comercial',
    email: 'marcos.comercial@orcamento-lt.com.br',
    role: 'COMMERCIAL',
    scopes: ROLE_PERMISSIONS_MAP.COMMERCIAL,
  },
  {
    id: 'user-admin-01',
    name: 'Lucas Administrador',
    email: 'lucas.admin@orcamento-lt.com.br',
    role: 'ADMIN',
    scopes: ROLE_PERMISSIONS_MAP.ADMIN,
  },
];
