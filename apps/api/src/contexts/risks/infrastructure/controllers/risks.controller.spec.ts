import { Test, TestingModule } from '@nestjs/testing';
import { RisksController } from './risks.controller';
import {
  GetOfferRisksUseCase,
  SaveRiskUseCase,
  DeleteRiskUseCase,
} from '../../application/usecases';

describe('RisksController (M12, RF-61, RF-55)', () => {
  let controller: RisksController;
  let getOfferRisksUseCase: jest.Mocked<GetOfferRisksUseCase>;
  let saveRiskUseCase: jest.Mocked<SaveRiskUseCase>;
  let deleteRiskUseCase: jest.Mocked<DeleteRiskUseCase>;

  const mockSummary = {
    offerId: '1',
    items: [
      {
        id: 'risk-1',
        offerId: '1',
        category: 'LAND_EASEMENT' as const,
        description: 'Negociação de servidão',
        situation: 'Levantamento cartorial',
        mitigationAction: 'Mobilização precoce',
        estimatedImpact: '650000.00',
        probabilityPercent: '30.00',
        weightedSeverity: '195000.00',
        treatment: 'CONTINGENCY_BDI' as const,
      },
    ],
    totalEstimatedImpact: '650000.00',
    totalWeightedSeverity: '195000.00',
    bdiContingencyAmount: '195000.00',
    commercialAssumptionAmount: '0.00',
    categoryBreakdown: [],
  };

  beforeEach(async () => {
    getOfferRisksUseCase = {
      execute: jest.fn().mockResolvedValue(mockSummary),
    } as any;

    saveRiskUseCase = {
      execute: jest.fn().mockResolvedValue(mockSummary),
    } as any;

    deleteRiskUseCase = {
      execute: jest.fn().mockResolvedValue({
        ...mockSummary,
        items: [],
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RisksController],
      providers: [
        {
          provide: GetOfferRisksUseCase,
          useValue: getOfferRisksUseCase,
        },
        {
          provide: SaveRiskUseCase,
          useValue: saveRiskUseCase,
        },
        {
          provide: DeleteRiskUseCase,
          useValue: deleteRiskUseCase,
        },
      ],
    }).compile();

    controller = module.get<RisksController>(RisksController);
  });

  it('deve listar os riscos da oferta', async () => {
    const result = await controller.getRisks('1');
    expect(result.offerId).toBe('1');
    expect(getOfferRisksUseCase.execute).toHaveBeenCalledWith('1', undefined);
  });

  it('deve salvar um item de risco', async () => {
    const item = {
      category: 'LAND_EASEMENT' as const,
      description: 'Negociação de servidão',
      estimatedImpact: '650000.00',
      probabilityPercent: '30.00',
    };

    const result = await controller.saveRisk('1', item);
    expect(result.offerId).toBe('1');
    expect(saveRiskUseCase.execute).toHaveBeenCalledWith('1', item);
  });

  it('deve excluir um item de risco', async () => {
    const result = await controller.deleteRisk('1', 'risk-1');
    expect(result.items.length).toBe(0);
    expect(deleteRiskUseCase.execute).toHaveBeenCalledWith(
      '1',
      'risk-1',
      undefined,
    );
  });
});
