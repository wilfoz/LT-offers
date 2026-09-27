import {
  BadRequestException,
  ConflictException,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_RAINFALL_PARAMETERS,
  DEFAULT_WORK_CALENDAR,
} from '@lt-offers/domain';
import { ScheduleParametersController } from './schedule-parameters.controller';
import {
  CreateRainfallParametersVersionUseCase,
  CreateWorkCalendarVersionUseCase,
  GetEffectiveRainfallParametersUseCase,
  GetEffectiveWorkCalendarUseCase,
} from '../../application/usecases';
import {
  DuplicateScheduleParametersDateException,
  ScheduleParametersPort,
} from '../../domain';

describe('ScheduleParametersController (catálogos de configuração do M07)', () => {
  let controller: ScheduleParametersController;
  let mockPort: ScheduleParametersPort;

  const rainfallRecord = {
    id: 1,
    effectiveFrom: '2020-01-01',
    createdBy: 'sistema',
    createdAt: '2020-01-01T00:00:00.000Z',
    parameters: DEFAULT_RAINFALL_PARAMETERS,
  };

  const calendarRecord = {
    id: 1,
    effectiveFrom: '2020-01-01',
    createdBy: 'sistema',
    createdAt: '2020-01-01T00:00:00.000Z',
    calendar: DEFAULT_WORK_CALENDAR,
  };

  beforeEach(() => {
    mockPort = {
      findEffectiveRainfall: jest.fn().mockResolvedValue(rainfallRecord),
      createRainfallVersion: jest.fn().mockResolvedValue(rainfallRecord),
      findEffectiveWorkCalendar: jest.fn().mockResolvedValue(calendarRecord),
      createWorkCalendarVersion: jest.fn().mockResolvedValue(calendarRecord),
    };

    controller = new ScheduleParametersController(
      new GetEffectiveRainfallParametersUseCase(mockPort),
      new CreateRainfallParametersVersionUseCase(mockPort),
      new GetEffectiveWorkCalendarUseCase(mockPort),
      new CreateWorkCalendarVersionUseCase(mockPort),
    );
  });

  describe('GET /schedule-parameters/rainfall', () => {
    it('deve resolver a versão vigente pela data de referência informada', async () => {
      const result = await controller.getRainfall('2026-03-25');

      expect(mockPort.findEffectiveRainfall).toHaveBeenCalledWith('2026-03-25');
      expect(result).toEqual(rainfallRecord);
    });

    it('deve responder 404 com mensagem em português quando não há versão vigente', async () => {
      jest.spyOn(mockPort, 'findEffectiveRainfall').mockResolvedValue(null);

      await expect(controller.getRainfall('2019-01-01')).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.getRainfall('2019-01-01')).rejects.toThrow(
        'Não há versão de parâmetros de chuva vigente em 2019-01-01.',
      );
    });

    it('deve rejeitar data de referência de calendário inexistente com 400', async () => {
      await expect(controller.getRainfall('2027-02-30')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('POST /schedule-parameters/rainfall', () => {
    const validDto = {
      effectiveFrom: '2026-10-01',
      bands: DEFAULT_RAINFALL_PARAMETERS.bands.map((b) => ({ ...b })),
      ufSeries: DEFAULT_RAINFALL_PARAMETERS.ufSeries.map((s) => ({
        uf: s.uf,
        monthlyMm: [...s.monthlyMm],
      })),
    };

    it('deve criar nova versão com autor do header X-User', async () => {
      await controller.createRainfallVersion(validDto, 'ana@empresa.com');

      expect(mockPort.createRainfallVersion).toHaveBeenCalledWith({
        effectiveFrom: '2026-10-01',
        createdBy: 'ana@empresa.com',
        parameters: { bands: validDto.bands, ufSeries: validDto.ufSeries },
      });
    });

    it('deve usar o autor padrão "sistema" sem o header X-User', async () => {
      await controller.createRainfallVersion(validDto, undefined);

      expect(mockPort.createRainfallVersion).toHaveBeenCalledWith(
        expect.objectContaining({ createdBy: 'sistema' }),
      );
    });

    it('deve rejeitar matriz sem uma UF com 400 identificando a UF ausente (RNF-09)', async () => {
      const dto = {
        ...validDto,
        ufSeries: validDto.ufSeries.filter((s) => s.uf !== 'BA'),
      };

      await expect(
        controller.createRainfallVersion(dto, undefined),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.createRainfallVersion(dto, undefined),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          message: [
            'A matriz de precipitação está incompleta: falta a série da UF BA.',
          ],
        }),
      });
      expect(mockPort.createRainfallVersion).not.toHaveBeenCalled();
    });

    it('deve rejeitar vigência com data de calendário inexistente (2027-02-30) com 400', async () => {
      const dto = { ...validDto, effectiveFrom: '2027-02-30' };

      await expect(
        controller.createRainfallVersion(dto, undefined),
      ).rejects.toThrow(BadRequestException);
      expect(mockPort.createRainfallVersion).not.toHaveBeenCalled();
    });

    it('deve responder 409 quando já existe versão na mesma vigência (P2002)', async () => {
      jest
        .spyOn(mockPort, 'createRainfallVersion')
        .mockRejectedValue(
          new DuplicateScheduleParametersDateException('chuva', '2026-10-01'),
        );

      await expect(
        controller.createRainfallVersion(validDto, undefined),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('imutabilidade das versões (RNF-05)', () => {
    it('PUT e PATCH devem responder 405 com mensagem em português', () => {
      for (const call of [
        () => controller.updateRainfall(),
        () => controller.patchRainfall(),
        () => controller.updateWorkCalendar(),
        () => controller.patchWorkCalendar(),
      ]) {
        expect(call).toThrow(MethodNotAllowedException);
        expect(call).toThrow(
          'Versões são imutáveis; para alterar valores, crie uma nova versão com data de vigência',
        );
      }
    });
  });

  describe('GET /schedule-parameters/work-calendar', () => {
    it('deve resolver a versão vigente pela data de referência informada', async () => {
      const result = await controller.getWorkCalendar('2026-03-25');

      expect(mockPort.findEffectiveWorkCalendar).toHaveBeenCalledWith(
        '2026-03-25',
      );
      expect(result).toEqual(calendarRecord);
    });

    it('deve responder 404 quando não há calendário vigente', async () => {
      jest.spyOn(mockPort, 'findEffectiveWorkCalendar').mockResolvedValue(null);

      await expect(controller.getWorkCalendar('2019-01-01')).rejects.toThrow(
        'Não há versão de calendário de trabalho vigente em 2019-01-01.',
      );
    });
  });

  describe('POST /schedule-parameters/work-calendar', () => {
    const validDto = {
      effectiveFrom: '2027-01-01',
      standardWorkingDaysPerMonth: '21.00',
      nonWorkingWeekdays: [0, 6],
      holidays: [
        {
          date: '2027-02-09',
          name: 'Carnaval',
          recurring: false,
          uf: null,
        },
      ],
    };

    it('deve criar nova versão do calendário com autor do header X-User', async () => {
      await controller.createWorkCalendarVersion(validDto, 'ana@empresa.com');

      expect(mockPort.createWorkCalendarVersion).toHaveBeenCalledWith({
        effectiveFrom: '2027-01-01',
        createdBy: 'ana@empresa.com',
        calendar: {
          standardWorkingDaysPerMonth: '21.00',
          nonWorkingWeekdays: [0, 6],
          holidays: validDto.holidays,
        },
      });
    });

    it('deve rejeitar feriado com data de calendário inexistente com 400', async () => {
      const dto = {
        ...validDto,
        holidays: [
          {
            date: '2027-02-30',
            name: 'Data impossível',
            recurring: false,
            uf: null,
          },
        ],
      };

      await expect(
        controller.createWorkCalendarVersion(dto, undefined),
      ).rejects.toThrow(BadRequestException);
      expect(mockPort.createWorkCalendarVersion).not.toHaveBeenCalled();
    });

    it('deve responder 409 quando já existe calendário na mesma vigência', async () => {
      jest
        .spyOn(mockPort, 'createWorkCalendarVersion')
        .mockRejectedValue(
          new DuplicateScheduleParametersDateException(
            'calendário',
            '2027-01-01',
          ),
        );

      await expect(
        controller.createWorkCalendarVersion(validDto, undefined),
      ).rejects.toThrow(ConflictException);
    });
  });
});
