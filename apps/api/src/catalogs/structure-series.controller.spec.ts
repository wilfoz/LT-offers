import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { CreateStructureSeriesDto } from './dto/create-structure-series.dto';
import { CreateStructureSeriesVersionDto } from './dto/create-structure-series-version.dto';
import { StructureSeriesController } from './structure-series.controller';
import { StructureSeriesService } from './structure-series.service';

describe('StructureSeriesController', () => {
  const serviceMock = {
    create: jest.fn(),
    createVersion: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    listHistory: jest.fn(),
  };

  let controller: StructureSeriesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [StructureSeriesController],
      providers: [{ provide: StructureSeriesService, useValue: serviceMock }],
    }).compile();
    controller = moduleRef.get(StructureSeriesController);
  });

  it('usa "sistema" como autor quando o cabeçalho X-User está ausente', async () => {
    await controller.create({ name: 'Raptor 500' } as CreateStructureSeriesDto);
    expect(serviceMock.create.mock.calls[0][1]).toBe('sistema');
  });

  it('repassa o autor do cabeçalho X-User', async () => {
    await controller.create(
      { name: 'Raptor 500' } as CreateStructureSeriesDto,
      'carla',
    );
    expect(serviceMock.create.mock.calls[0][1]).toBe('carla');
  });

  it('rejeita data de referência fora do formato AAAA-MM-DD', () => {
    expect(() => controller.list(undefined, '24/08/2026')).toThrow(
      BadRequestException,
    );
  });

  it('rejeita data de referência de calendário inexistente', () => {
    expect(() => controller.list(undefined, '2026-02-30')).toThrow(
      BadRequestException,
    );
  });

  it('repassa o termo de busca e a data de referência válida para o serviço', () => {
    controller.list('Raptor', '2026-03-15');
    expect(serviceMock.list.mock.calls[0][0]).toBe('Raptor');
    expect(serviceMock.list.mock.calls[0][1]).toEqual(
      new Date('2026-03-15T00:00:00.000Z'),
    );
  });

  it('usa a data civil de hoje como referência quando effectiveOn está ausente', () => {
    controller.list(undefined, undefined);
    const usedDate = serviceMock.list.mock.calls[0][1] as Date;
    expect(usedDate.toISOString()).toMatch(/T00:00:00\.000Z$/);
  });

  it('rejeita alteração direta de versão por PUT e por PATCH', () => {
    expect(() => controller.replaceVersion()).toThrow(
      MethodNotAllowedException,
    );
    expect(() => controller.patchVersion()).toThrow(MethodNotAllowedException);
  });
});

describe('CreateStructureSeriesDto (validação)', () => {
  const dto = (data: Partial<CreateStructureSeriesDto>) =>
    Object.assign(new CreateStructureSeriesDto(), data);

  it('aceita decimais como string e null como não informado', async () => {
    const errors = await validate(
      dto({
        name: 'Raptor 500',
        voltageKv: '500',
        designWindSpeedMs: null,
        circuitCount: 2,
        insulatorType: 'vidro temperado',
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita nome ausente', async () => {
    const errors = await validate(dto({ voltageKv: '500' }));
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejeita valor numérico negativo ou não numérico com mensagem em português', async () => {
    const errors = await validate(
      dto({ name: 'S1', voltageKv: '-1', silMw: 'abc' }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('tensão (kV)'))).toBe(true);
    expect(messages.some((m) => m.includes('SIL (MW)'))).toBe(true);
  });

  it('rejeita circuitos e cabos por fase fracionários, zero ou negativos com mensagem em português', async () => {
    const fracErrors = await validate(dto({ name: 'S1', circuitCount: 1.5 }));
    const zeroErrors = await validate(dto({ name: 'S1', cablesPerPhase: 0 }));
    const negativeErrors = await validate(
      dto({ name: 'S1', circuitCount: -2 }),
    );

    const all = [...fracErrors, ...zeroErrors, ...negativeErrors].flatMap((e) =>
      Object.values(e.constraints ?? {}),
    );
    expect(all.some((m) => m.includes('circuitos'))).toBe(true);
    expect(all.some((m) => m.includes('cabos por fase'))).toBe(true);
    expect(all.every((m) => m.includes('inteiro positivo'))).toBe(true);
  });
});

describe('CreateStructureSeriesVersionDto (validação)', () => {
  const dto = (data: Partial<CreateStructureSeriesVersionDto>) =>
    Object.assign(new CreateStructureSeriesVersionDto(), data);

  it('aceita nova versão com data de vigência obrigatória', async () => {
    const errors = await validate(
      dto({ effectiveFrom: '2026-10-01', designer: 'Sediver' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita nova versão sem data de vigência', async () => {
    const errors = await validate(dto({ designer: 'Sediver' }));
    expect(errors.some((e) => e.property === 'effectiveFrom')).toBe(true);
  });
});
