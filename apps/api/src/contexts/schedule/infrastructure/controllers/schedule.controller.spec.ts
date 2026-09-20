import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import {
  GetLineScheduleUseCase,
  GetLineCampsUseCase,
} from '../../application/usecases';
import { LineScheduleNotFoundException } from '../../domain';

describe('ScheduleController (M07, RF-35..RF-41)', () => {
  let controller: ScheduleController;
  let getLineScheduleUseCase: jest.Mocked<GetLineScheduleUseCase>;
  let getLineCampsUseCase: jest.Mocked<GetLineCampsUseCase>;

  beforeEach(async () => {
    getLineScheduleUseCase = {
      execute: jest.fn().mockResolvedValue({
        lineId: 1,
        lineName: 'LT 500 kV Poções III - Padre Paraíso C1',
        startMonth: 1,
        totalDurationMonths: 18,
        activities: [{ id: 'act-1' }],
        milestones: [{ id: 'ms-1' }],
        totalDirectLaborCost: '100000.00',
        totalEquipmentCost: '50000.00',
        totalIndirectCost: '30000.00',
        totalScheduleCost: '180000.00',
        warnings: [],
      }),
    } as any;

    getLineCampsUseCase = {
      execute: jest.fn().mockResolvedValue({
        lineId: 1,
        camps: [{ id: 'camp-1' }],
        totalImplementationCost: '350000.00',
        totalOperatingCost: '1200000.00',
        totalDemobilizationCost: '110000.00',
        totalCampsCost: '1660000.00',
        monthlyDistribution: [{ month: 1, cost: '425000.00' }],
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScheduleController],
      providers: [
        {
          provide: GetLineScheduleUseCase,
          useValue: getLineScheduleUseCase,
        },
        {
          provide: GetLineCampsUseCase,
          useValue: getLineCampsUseCase,
        },
      ],
    }).compile();

    controller = module.get<ScheduleController>(ScheduleController);
  });

  it('deve retornar o resumo do cronograma para a linha', async () => {
    const result = await controller.getSummary(1);
    expect(result.lineId).toBe(1);
    expect(getLineScheduleUseCase.execute).toHaveBeenCalledWith(1);
  });

  it('deve repassar NotFoundException caso o cronograma não exista', async () => {
    getLineScheduleUseCase.execute.mockRejectedValueOnce(
      new LineScheduleNotFoundException(999),
    );

    await expect(controller.getSummary(999)).rejects.toThrow(NotFoundException);
  });

  it('deve retornar a estrutura de canteiros para a linha', async () => {
    const result = await controller.getCamps(1);
    expect(result.lineId).toBe(1);
    expect(getLineCampsUseCase.execute).toHaveBeenCalledWith(1);
  });

  it('deve repassar NotFoundException caso os canteiros da linha não existam', async () => {
    getLineCampsUseCase.execute.mockRejectedValueOnce(
      new LineScheduleNotFoundException(999),
    );

    await expect(controller.getCamps(999)).rejects.toThrow(NotFoundException);
  });
});
