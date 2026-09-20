import { Test, TestingModule } from '@nestjs/testing';
import { FieldFactorsController } from './field-factors.controller';
import { FieldFactorsService } from './field-factors.service';
import { RolesGuard } from '../auth/roles.guard';

describe('FieldFactorsController', () => {
  let controller: FieldFactorsController;
  let service: FieldFactorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FieldFactorsController],
      providers: [FieldFactorsService],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FieldFactorsController>(FieldFactorsController);
    service = module.get<FieldFactorsService>(FieldFactorsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return access weights', () => {
    const weights = controller.getAccessWeights();
    expect(weights.NORMAL).toBe(1.0);
    expect(weights.DIFFICULT).toBe(1.25);
    expect(weights.CROSSING).toBe(1.6);
  });

  it('should calculate weighted access factor', () => {
    const result = controller.calculateWeightedAccess({
      distribution: [
        { difficulty: 'NORMAL', count: 80 },
        { difficulty: 'DIFFICULT', count: 20 },
      ],
    });
    // 80 * 1.0 + 20 * 1.25 = 80 + 25 = 105 / 100 = 1.05
    expect(result.weightedAccessFactor).toBe(1.05);
  });

  it('should list all 27 precipitation UFs', () => {
    const ufs = controller.getAllPrecipitationUfs();
    expect(ufs.length).toBe(27);
  });

  it('should get precipitation data for a specific UF', () => {
    const mg = controller.getPrecipitationByUf('MG');
    expect(mg.uf).toBe('MG');
    expect(mg.name).toBe('Minas Gerais');
    expect(mg.monthlyData.length).toBe(12);
  });

  it('should throw error for unknown UF', () => {
    expect(() => controller.getPrecipitationByUf('XX')).toThrow();
  });
});
