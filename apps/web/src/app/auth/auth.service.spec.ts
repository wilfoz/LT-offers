import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { CANONICAL_USERS } from '@lt-offers/domain';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
  });

  it('inicializa com o perfil de Administrador por padrão', () => {
    expect(service.currentUser().role).toBe('ADMIN');
    expect(service.isAdmin()).toBe(true);
    expect(service.canViewCommercial()).toBe(true);
  });

  it('permite alternar para perfil de Engenharia e atualiza escopos', () => {
    service.switchRole('ENGINEERING');
    expect(service.currentUser().role).toBe('ENGINEERING');
    expect(service.canEditEngineering()).toBe(true);
    expect(service.canViewCommercial()).toBe(false);
    expect(service.canEditCommercial()).toBe(false);
  });

  it('permite alternar para perfil Comercial e habilita visualização confidencial', () => {
    service.switchRole('COMMERCIAL');
    expect(service.currentUser().role).toBe('COMMERCIAL');
    expect(service.canViewCommercial()).toBe(true);
    expect(service.canEditCommercial()).toBe(true);
    expect(service.canEditPricing()).toBe(false);
  });

  it('permite selecionar um usuário canônico específico', () => {
    const userProc = CANONICAL_USERS.find((u) => u.role === 'PROCUREMENT')!;
    service.switchUser(userProc);
    expect(service.currentUser().id).toBe(userProc.id);
    expect(service.activeRole()).toBe('PROCUREMENT');
    expect(service.canEditPricing()).toBe(true);
  });
});
