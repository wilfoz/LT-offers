import { Test, TestingModule } from '@nestjs/testing';
import { BaselineController } from './baseline.controller';
import { BaselineService } from './baseline.service';
import { ProgressTrackingService } from './progress-tracking.service';
import { ChangeOrderService } from './change-order.service';
import { ErpIntegrationService } from './erp-integration.service';
import { RolesGuard } from '../auth/roles.guard';

describe('BaselineController', () => {
  let controller: BaselineController;

  const mockBaselineService = {
    getActiveBaseline: jest.fn().mockResolvedValue({
      id: 1,
      offerId: 1,
      name: 'Baseline Data 0',
      status: 'ACTIVE',
      totalContractValue: '124850000.00',
    }),
    freezeBaseline: jest.fn().mockResolvedValue({
      id: 2,
      offerId: 1,
      name: 'Nova Baseline',
      status: 'ACTIVE',
      totalContractValue: '124850000.00',
    }),
  };

  const mockProgressTrackingService = {
    getCurveS: jest.fn().mockResolvedValue({
      baselineId: 1,
      totalPlannedValue: '124850000.00',
      currentPhysicalProgressPercent: '19.80',
      currentSpi: '1.0500',
      currentCpi: '1.0200',
      statusSummary: 'ON_TRACK',
      monthlySeries: [],
    }),
    recordMonthlyProgress: jest.fn().mockResolvedValue({
      id: 1,
      monthNumber: 1,
      physicalProgressPercent: '5.00',
    }),
    listProgressRecords: jest.fn().mockResolvedValue([]),
  };

  const mockChangeOrderService = {
    listChangeOrders: jest.fn().mockResolvedValue([]),
    createChangeOrder: jest.fn().mockResolvedValue({ id: 1, code: 'AD-01' }),
    updateChangeOrder: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED' }),
    getCurrentWorkingEstimate: jest.fn().mockResolvedValue({
      baselineId: 1,
      currentWorkingEstimateValue: '126000000.00',
    }),
  };

  const mockErpIntegrationService = {
    generateErpJson: jest.fn().mockResolvedValue({
      offerCode: 'OFR-01',
      targetSystem: 'SAP',
    }),
    generateErpXlsx: jest.fn().mockResolvedValue(Buffer.from('xlsx-data')),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BaselineController],
      providers: [
        { provide: BaselineService, useValue: mockBaselineService },
        { provide: ProgressTrackingService, useValue: mockProgressTrackingService },
        { provide: ChangeOrderService, useValue: mockChangeOrderService },
        { provide: ErpIntegrationService, useValue: mockErpIntegrationService },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BaselineController>(BaselineController);
  });

  it('deve retornar a baseline ativa da oferta', async () => {
    const baseline = await controller.getBaseline(1);
    expect(baseline).toBeDefined();
    expect(mockBaselineService.getActiveBaseline).toHaveBeenCalledWith(1);
  });

  it('deve retornar os dados da curva S', async () => {
    const curveS = await controller.getCurveS(1);
    expect(curveS).toBeDefined();
    expect(mockProgressTrackingService.getCurveS).toHaveBeenCalledWith(1, undefined);
  });

  it('deve retornar a estimativa corrente (CWE)', async () => {
    const cwe = await controller.getCurrentWorkingEstimate(1);
    expect(cwe.currentWorkingEstimateValue).toBe('126000000.00');
  });
});
