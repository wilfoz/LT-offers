import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from '../../../../../auth/roles.guard';
import { BaselineNotFoundException } from '../../../domain';
import {
  FreezeBaselineUseCase,
  GetActiveBaselineUseCase,
  CreateChangeOrderUseCase,
  UpdateChangeOrderUseCase,
  ListChangeOrdersUseCase,
  GetCurrentWorkingEstimateUseCase,
  RecordMonthlyProgressUseCase,
  GetCurveSUseCase,
  ListProgressRecordsUseCase,
  GenerateErpJsonUseCase,
  GenerateErpXlsxUseCase,
} from '../../../application';
import { BaselineController } from './baseline.controller';

describe('BaselineController (contratos de /api/offers/:offerId/baseline*)', () => {
  let controller: BaselineController;

  const mockGetActive = {
    execute: jest.fn().mockResolvedValue({
      id: 1,
      offerId: 1,
      name: 'Baseline Data 0',
      status: 'ACTIVE',
      totalContractValue: '124850000.00',
    }),
  };
  const mockFreeze = {
    execute: jest.fn().mockResolvedValue({
      id: 2,
      offerId: 1,
      name: 'Nova Baseline',
      status: 'ACTIVE',
      totalContractValue: '124850000.00',
    }),
  };
  const mockCurveS = {
    execute: jest.fn().mockResolvedValue({
      baselineId: 1,
      totalPlannedValue: '124850000.00',
      currentPhysicalProgressPercent: '19.80',
      currentSpi: '1.0500',
      currentCpi: '1.0200',
      statusSummary: 'ON_TRACK',
      monthlySeries: [],
    }),
  };
  const mockCwe = {
    execute: jest.fn().mockResolvedValue({
      baselineId: 1,
      currentWorkingEstimateValue: '126000000.00',
    }),
  };
  const mockErpJson = {
    execute: jest
      .fn()
      .mockResolvedValue({ offerCode: 'OFR-01', targetSystem: 'SAP' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BaselineController],
      providers: [
        { provide: FreezeBaselineUseCase, useValue: mockFreeze },
        { provide: GetActiveBaselineUseCase, useValue: mockGetActive },
        {
          provide: CreateChangeOrderUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({ id: 1, code: 'AD-01' }),
          },
        },
        {
          provide: UpdateChangeOrderUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED' }),
          },
        },
        {
          provide: ListChangeOrdersUseCase,
          useValue: { execute: jest.fn().mockResolvedValue([]) },
        },
        { provide: GetCurrentWorkingEstimateUseCase, useValue: mockCwe },
        {
          provide: RecordMonthlyProgressUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              id: 1,
              monthNumber: 1,
              physicalProgressPercent: '5.00',
            }),
          },
        },
        { provide: GetCurveSUseCase, useValue: mockCurveS },
        {
          provide: ListProgressRecordsUseCase,
          useValue: { execute: jest.fn().mockResolvedValue([]) },
        },
        { provide: GenerateErpJsonUseCase, useValue: mockErpJson },
        {
          provide: GenerateErpXlsxUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue(Buffer.from('xlsx-data')),
          },
        },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BaselineController>(BaselineController);
    jest.clearAllMocks();
  });

  it('deve retornar a baseline ativa da oferta', async () => {
    const baseline = await controller.getBaseline(1);
    expect(baseline).toBeDefined();
    expect(mockGetActive.execute).toHaveBeenCalledWith(1);
  });

  it('deve retornar os dados da curva S com data de referência resolvida na borda', async () => {
    const curveS = await controller.getCurveS(1);
    expect(curveS).toBeDefined();
    expect(mockCurveS.execute).toHaveBeenCalledWith(
      1,
      expect.any(Date),
      undefined,
    );
  });

  it('deve retornar a estimativa corrente (CWE)', async () => {
    const cwe = await controller.getCurrentWorkingEstimate(1);
    expect(cwe.currentWorkingEstimateValue).toBe('126000000.00');
  });

  it('deve congelar a baseline carimbando a data na borda', async () => {
    await controller.freezeBaseline(1, { revisionId: 1 });
    expect(mockFreeze.execute).toHaveBeenCalledWith(
      expect.objectContaining({ offerId: 1, revisionId: 1 }),
      'diretoria.comercial@engevix.com.br',
      expect.any(Date),
    );
  });

  it('deve gerar o pacote ERP JSON usando a baseline ativa como padrão', async () => {
    await controller.generateErpPackageJson(1, {});
    expect(mockErpJson.execute).toHaveBeenCalledWith(
      expect.objectContaining({ baselineId: 1, targetSystem: 'SAP' }),
      'controladoria@engevix.com.br',
      expect.any(Date),
    );
  });

  it('deve converter exceção de domínio em 404 com mensagem em português', async () => {
    mockGetActive.execute.mockRejectedValue(new BaselineNotFoundException(99));

    await expect(controller.getBaseline(99)).rejects.toThrow(NotFoundException);
    await expect(controller.getBaseline(99)).rejects.toThrow(
      'Linha de Base ID 99 não encontrada.',
    );
  });
});
