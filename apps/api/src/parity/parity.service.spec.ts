import { Test, TestingModule } from '@nestjs/testing';
import { ParityService } from './parity.service';
import { NotFoundException } from '@nestjs/common';

describe('ParityService', () => {
  let service: ParityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParityService],
    }).compile();

    service = module.get<ParityService>(ParityService);
  });

  it('deve ser instanciado com sucesso', () => {
    expect(service).toBeDefined();
  });

  it('deve listar os perfis históricos disponíveis', () => {
    const profiles = service.getAvailableProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(4);
    expect(profiles.some((p) => p.key === 'solaris')).toBe(true);
    expect(profiles.some((p) => p.key === 'tucano')).toBe(true);
    expect(profiles.some((p) => p.key === 'reidi')).toBe(true);
    expect(profiles.some((p) => p.key === 'celeo')).toBe(true);
  });

  it('deve avaliar a paridade do perfil solaris com aprovação', () => {
    const report = service.evaluateProfile('solaris');
    expect(report.isApproved).toBe(true);
    expect(report.offerCode).toBe('OF-2025-029-SOLARIS');
    expect(report.desvioCount).toBe(0);
  });

  it('deve avaliar a paridade do perfil celeo lote 04 com aprovação', () => {
    const report = service.evaluateProfile('celeo');
    expect(report.isApproved).toBe(true);
    expect(report.offerCode).toBe('OF-2026-CELEO-LOTE-04');
    expect(report.desvioCount).toBe(0);
  });

  it('deve avaliar todos os perfis simultaneamente', () => {
    const reports = service.evaluateAllProfiles();
    expect(reports.length).toBe(4);
    expect(reports.every((r) => r.isApproved)).toBe(true);
  });

  it('deve gerar o relatório em markdown', () => {
    const md = service.getProfileMarkdownReport('solaris');
    expect(md).toContain(
      '# Relatório de Paridade Numérica e Conformidade Técnica (§14)',
    );
    expect(md).toContain('OF-2025-029-SOLARIS');
  });

  it('deve lançar NotFoundException para perfil inexistente', () => {
    expect(() => service.evaluateProfile('inexistente')).toThrow(
      NotFoundException,
    );
  });
});
