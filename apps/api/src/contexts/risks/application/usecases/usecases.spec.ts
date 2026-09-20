import { GetOfferRisksUseCase } from './get-offer-risks.usecase';
import { SaveRiskUseCase } from './save-risk.usecase';
import { DeleteRiskUseCase } from './delete-risk.usecase';
import { RiskItem, RisksRepository } from '../../domain';

class InMemoryRisksRepository implements RisksRepository {
  private store = new Map<string, RiskItem[]>();

  constructor() {
    this.store.set('1', [
      RiskItem.create({
        id: 'risk-1',
        offerId: '1',
        lineId: '1',
        category: 'LAND_EASEMENT',
        description: 'Negociação de servidão',
        situation: 'Levantamento cartorial preliminar',
        mitigationAction: 'Mobilização precoce',
        estimatedImpact: '650000.00',
        probabilityPercent: '30.00',
        treatment: 'CONTINGENCY_BDI',
      }),
      RiskItem.create({
        id: 'risk-2',
        offerId: '1',
        lineId: '1',
        category: 'GEOTECHNICAL_SOIL',
        description: 'Aumento de solo rochoso',
        situation: 'Perfil geológico regional',
        mitigationAction: 'Perfuratrizes rotativas',
        estimatedImpact: '450000.00',
        probabilityPercent: '40.00',
        treatment: 'CONTINGENCY_BDI',
      }),
      RiskItem.create({
        id: 'risk-3',
        offerId: '1',
        category: 'THIRD_PARTY_MARKET',
        description: 'Flutuação de custos logísticos',
        situation: 'Variação do diesel',
        mitigationAction: 'Contrato com teto',
        estimatedImpact: '200000.00',
        probabilityPercent: '25.00',
        treatment: 'COMMERCIAL_ASSUMPTION',
      }),
    ]);
  }

  async findByOffer(offerId: string, lineId?: string): Promise<RiskItem[]> {
    const items = this.store.get(offerId) || [];
    return lineId
      ? items.filter((i) => !i.lineId || i.lineId === lineId)
      : items;
  }

  async findById(offerId: string, riskId: string): Promise<RiskItem | null> {
    const items = this.store.get(offerId) || [];
    return items.find((i) => i.id === riskId) || null;
  }

  async save(offerId: string, risk: RiskItem): Promise<void> {
    const items = this.store.get(offerId) || [];
    const index = items.findIndex((i) => i.id === risk.id);
    if (index >= 0) {
      items[index] = risk;
    } else {
      items.push(risk);
    }
    this.store.set(offerId, items);
  }

  async delete(offerId: string, riskId: string): Promise<void> {
    const items = this.store.get(offerId) || [];
    this.store.set(
      offerId,
      items.filter((i) => i.id !== riskId),
    );
  }
}

describe('Risks Use Cases (M12, RF-61, RF-55)', () => {
  let repository: RisksRepository;
  let getOfferRisksUseCase: GetOfferRisksUseCase;
  let saveRiskUseCase: SaveRiskUseCase;
  let deleteRiskUseCase: DeleteRiskUseCase;

  beforeEach(() => {
    repository = new InMemoryRisksRepository();
    getOfferRisksUseCase = new GetOfferRisksUseCase(repository);
    saveRiskUseCase = new SaveRiskUseCase(repository, getOfferRisksUseCase);
    deleteRiskUseCase = new DeleteRiskUseCase(repository, getOfferRisksUseCase);
  });

  it('deve listar e avaliar os riscos da oferta', async () => {
    const summary = await getOfferRisksUseCase.execute('1');

    expect(summary.offerId).toBe('1');
    expect(summary.items.length).toBe(3);
    expect(Number(summary.totalEstimatedImpact)).toBe(1300000);
    expect(Number(summary.bdiContingencyAmount)).toBe(375000); // 195000 + 180000
    expect(Number(summary.commercialAssumptionAmount)).toBe(50000);
  });

  it('deve salvar um novo risco com cálculo correto de severidade', async () => {
    const created = await saveRiskUseCase.execute('1', {
      category: 'ENVIRONMENTAL',
      description: 'Supressão vegetal com compensação',
      situation: 'Licenciamento ambiental',
      mitigationAction: 'Parceria com viveiros',
      estimatedImpact: '300000.00',
      probabilityPercent: '50.00',
      treatment: 'CONTINGENCY_BDI',
    });

    expect(created.items.some((i) => i.description.includes('Supressão'))).toBe(
      true,
    );
    const envSummary = created.categoryBreakdown.find(
      (c) => c.category === 'ENVIRONMENTAL',
    );
    expect(envSummary?.count).toBe(1);
    expect(envSummary?.totalImpact).toBe('300000.00');
    expect(envSummary?.totalWeightedSeverity).toBe('150000.00');
  });

  it('deve excluir um risco existente e recalcular a matriz', async () => {
    const afterDelete = await deleteRiskUseCase.execute('1', 'risk-1');

    expect(afterDelete.items.find((i) => i.id === 'risk-1')).toBeUndefined();
    expect(afterDelete.items.length).toBe(2);
  });
});
