import { Test, TestingModule } from '@nestjs/testing';
import { RisksService } from './risks.service';

describe('RisksService', () => {
  let service: RisksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RisksService],
    }).compile();

    service = module.get<RisksService>(RisksService);
  });

  it('deve inicializar e listar os riscos padrão de uma oferta', () => {
    const summary = service.getOfferRisks('1');
    expect(summary.offerId).toBe('1');
    expect(summary.items.length).toBeGreaterThanOrEqual(3);
    expect(Number(summary.totalEstimatedImpact)).toBeGreaterThan(0);
    expect(Number(summary.bdiContingencyAmount)).toBeGreaterThan(0);
  });

  it('deve adicionar um novo risco e recalcular a matriz de riscos', () => {
    const created = service.saveRisk('1', {
      category: 'ENVIRONMENTAL',
      description: 'Supressão de vegetação nativa com compensação',
      situation: 'Licenciamento ambiental exige plantio compensatório',
      mitigationAction: 'Parceria com viveiros locais',
      estimatedImpact: '300000.00',
      probabilityPercent: '50.00',
      treatment: 'CONTINGENCY_BDI',
    });

    expect(created.items.some((i) => i.description.includes('vegetação'))).toBe(
      true,
    );
    const envSummary = created.categoryBreakdown.find(
      (c) => c.category === 'ENVIRONMENTAL',
    );
    expect(envSummary?.count).toBe(1);
    expect(envSummary?.totalImpact).toBe('300000.00');
    expect(envSummary?.totalWeightedSeverity).toBe('150000.00');
  });

  it('deve excluir um risco existente', () => {
    const initial = service.getOfferRisks('2');
    const firstId = initial.items[0].id;

    const afterDelete = service.deleteRisk('2', firstId);
    expect(afterDelete.items.find((i) => i.id === firstId)).toBeUndefined();
  });
});
