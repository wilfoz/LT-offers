import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HistogramController } from './histogram.controller';
import {
  GetLineHistogramUseCase,
  GetOfferConsolidatedHistogramUseCase,
} from '../../application/usecases';
import { OfferHistogramNotFoundException } from '../../domain';
import { LineScheduleNotFoundException } from '../../../schedule';

describe('HistogramController (M08, RF-42..RF-45, RN-17)', () => {
  let controller: HistogramController;
  let getLineHistogramUseCase: jest.Mocked<GetLineHistogramUseCase>;
  let getOfferConsolidatedHistogramUseCase: jest.Mocked<GetOfferConsolidatedHistogramUseCase>;

  beforeEach(async () => {
    getLineHistogramUseCase = {
      execute: jest.fn().mockResolvedValue({
        lineId: 1,
        totalMonths: 18,
        manpowerItems: [{ laborRoleId: 1 }],
        equipmentItems: [{ equipmentId: 101 }],
        peakManpower: { total: 20, month: 6, drivingActivities: [] },
        monthlyTimeline: [],
      }),
    } as any;

    getOfferConsolidatedHistogramUseCase = {
      execute: jest.fn().mockResolvedValue({
        totalMonths: 18,
        manpowerItems: [{ laborRoleId: 1 }],
        equipmentItems: [{ equipmentId: 101 }],
        peakManpower: { total: 30, month: 6, drivingActivities: [] },
        monthlyTimeline: [],
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HistogramController],
      providers: [
        {
          provide: GetLineHistogramUseCase,
          useValue: getLineHistogramUseCase,
        },
        {
          provide: GetOfferConsolidatedHistogramUseCase,
          useValue: getOfferConsolidatedHistogramUseCase,
        },
      ],
    }).compile();

    controller = module.get<HistogramController>(HistogramController);
  });

  it('deve retornar o histograma de recursos para uma linha', async () => {
    const result = await controller.getLineHistogram(1);
    expect(result.lineId).toBe(1);
    expect(getLineHistogramUseCase.execute).toHaveBeenCalledWith(1);
  });

  it('deve repassar NotFoundException caso a linha não exista', async () => {
    getLineHistogramUseCase.execute.mockRejectedValueOnce(
      new LineScheduleNotFoundException(999),
    );

    await expect(controller.getLineHistogram(999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deve retornar o histograma consolidado da oferta', async () => {
    const result = await controller.getOfferConsolidatedHistogram(10);
    expect(result.totalMonths).toBe(18);
    expect(getOfferConsolidatedHistogramUseCase.execute).toHaveBeenCalledWith(
      10,
    );
  });

  it('deve repassar NotFoundException caso a oferta não exista', async () => {
    getOfferConsolidatedHistogramUseCase.execute.mockRejectedValueOnce(
      new OfferHistogramNotFoundException(999),
    );

    await expect(controller.getOfferConsolidatedHistogram(999)).rejects.toThrow(
      NotFoundException,
    );
  });
});
