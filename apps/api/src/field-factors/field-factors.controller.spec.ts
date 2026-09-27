import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DEFAULT_RAINFALL_PARAMETERS } from '@lt-offers/domain';
import { FieldFactorsController } from './field-factors.controller';
import { FieldFactorsService } from './field-factors.service';
import { ScheduleFacadeService } from '../contexts/schedule/application/services';
import { NoEffectiveScheduleParametersException } from '../contexts/schedule/domain';
import { RolesGuard } from '../auth/roles.guard';

describe('FieldFactorsController', () => {
  let controller: FieldFactorsController;
  let scheduleFacade: { getEffectiveRainfallParameters: jest.Mock };

  beforeEach(async () => {
    scheduleFacade = {
      getEffectiveRainfallParameters: jest.fn().mockResolvedValue({
        id: 1,
        effectiveFrom: '2020-01-01',
        createdBy: 'sistema',
        createdAt: '2020-01-01T00:00:00.000Z',
        parameters: DEFAULT_RAINFALL_PARAMETERS,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FieldFactorsController],
      providers: [
        FieldFactorsService,
        { provide: ScheduleFacadeService, useValue: scheduleFacade },
      ],
    })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<FieldFactorsController>(FieldFactorsController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('deve retornar os pesos de severidade de acesso', () => {
    const weights = controller.getAccessWeights();
    expect(weights.NORMAL).toBe(1.0);
    expect(weights.DIFFICULT).toBe(1.25);
    expect(weights.CROSSING).toBe(1.6);
  });

  it('deve calcular o fator ponderado de acesso', () => {
    const result = controller.calculateWeightedAccess({
      distribution: [
        { difficulty: 'NORMAL', count: 80 },
        { difficulty: 'DIFFICULT', count: 20 },
      ],
    });
    // 80 * 1.0 + 20 * 1.25 = 80 + 25 = 105 / 100 = 1.05
    expect(result.weightedAccessFactor).toBe(1.05);
  });

  it('deve listar as 27 UFs de precipitação da versão vigente', async () => {
    const ufs = await controller.getAllPrecipitationUfs();
    expect(ufs.length).toBe(27);
    expect(scheduleFacade.getEffectiveRainfallParameters).toHaveBeenCalledTimes(
      1,
    );
  });

  it('deve resolver a versão vigente pela data de referência informada', async () => {
    await controller.getAllPrecipitationUfs('2026-03-25');
    expect(scheduleFacade.getEffectiveRainfallParameters).toHaveBeenCalledWith(
      '2026-03-25',
    );
  });

  it('deve retornar a série de precipitação de uma UF específica', async () => {
    const mg = await controller.getPrecipitationByUf('MG');
    expect(mg.uf).toBe('MG');
    expect(mg.name).toBe('Minas Gerais');
    expect(mg.monthlyData.length).toBe(12);
  });

  it('deve rejeitar UF desconhecida com erro', async () => {
    await expect(controller.getPrecipitationByUf('XX')).rejects.toThrow(
      "UF 'XX' não encontrada no catálogo de precipitação.",
    );
  });

  it('deve responder 400 para data de referência de calendário inexistente', async () => {
    await expect(
      controller.getAllPrecipitationUfs('2027-02-30'),
    ).rejects.toThrow(BadRequestException);
  });

  it('deve responder 404 quando não há versão de parâmetros vigente na data', async () => {
    scheduleFacade.getEffectiveRainfallParameters.mockRejectedValue(
      new NoEffectiveScheduleParametersException('chuva', '2019-01-01'),
    );

    await expect(
      controller.getAllPrecipitationUfs('2019-01-01'),
    ).rejects.toThrow(NotFoundException);
  });
});
