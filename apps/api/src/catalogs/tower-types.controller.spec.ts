import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTowerTypeDto } from './dto/create-tower-type.dto';
import { CreateTowerTypeVersionDto } from './dto/create-tower-type-version.dto';
import { TowerTypesController } from './tower-types.controller';
import { TowerTypesService } from './tower-types.service';

describe('TowerTypesController', () => {
  const serviceMock = {
    create: jest.fn(),
    createVersion: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    listHistory: jest.fn(),
  };

  let controller: TowerTypesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [TowerTypesController],
      providers: [{ provide: TowerTypesService, useValue: serviceMock }],
    }).compile();
    controller = moduleRef.get(TowerTypesController);
  });

  it('usa "sistema" como autor quando o cabeçalho X-User está ausente', async () => {
    await controller.create(5, {
      code: 'SA1',
      function: 'SUSPENSION',
    } as CreateTowerTypeDto);
    expect(serviceMock.create.mock.calls[0][2]).toBe('sistema');
  });

  it('repassa o autor do cabeçalho X-User e o id da série', async () => {
    await controller.create(
      5,
      { code: 'SA1', function: 'SUSPENSION' } as CreateTowerTypeDto,
      'carla',
    );
    expect(serviceMock.create.mock.calls[0][0]).toBe(5);
    expect(serviceMock.create.mock.calls[0][2]).toBe('carla');
  });

  it('rejeita data de referência fora do formato AAAA-MM-DD', () => {
    expect(() => controller.list(5, '24/08/2026')).toThrow(BadRequestException);
  });

  it('rejeita data de referência de calendário inexistente', () => {
    expect(() => controller.list(5, '2026-02-30')).toThrow(BadRequestException);
  });

  it('repassa a data de referência válida e o id da série para o serviço', () => {
    controller.list(5, '2026-03-15');
    expect(serviceMock.list.mock.calls[0][0]).toBe(5);
    expect(serviceMock.list.mock.calls[0][1]).toEqual(
      new Date('2026-03-15T00:00:00.000Z'),
    );
  });

  it('usa a data civil de hoje como referência quando effectiveOn está ausente', () => {
    controller.list(5, undefined);
    const usedDate = serviceMock.list.mock.calls[0][1] as Date;
    expect(usedDate.toISOString()).toMatch(/T00:00:00\.000Z$/);
  });

  it('repassa os dois ids da rota para o histórico', () => {
    controller.listHistory(5, 42);
    expect(serviceMock.listHistory).toHaveBeenCalledWith(5, 42);
  });

  it('rejeita alteração direta de versão por PUT e por PATCH', () => {
    expect(() => controller.replaceVersion()).toThrow(
      MethodNotAllowedException,
    );
    expect(() => controller.patchVersion()).toThrow(MethodNotAllowedException);
  });
});

describe('CreateTowerTypeDto (validação)', () => {
  const dto = (data: Record<string, unknown>) =>
    plainToInstance(CreateTowerTypeDto, data);

  it('aceita tipo com função, zero estais e tabela de pesos válida', async () => {
    const errors = await validate(
      dto({
        code: 'SA1',
        function: 'SUSPENSION',
        guyCount: 0,
        weights: [
          { heightM: '24', weightKg: '5200.5' },
          { heightM: '27', weightKg: '5800' },
        ],
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita sigla ausente e função fora do domínio com mensagem em português', async () => {
    const noCode = await validate(dto({ function: 'SUSPENSION' }));
    const badFunction = await validate(dto({ code: 'SA1', function: 'GUYED' }));

    expect(noCode.some((e) => e.property === 'code')).toBe(true);
    const messages = badFunction.flatMap((e) =>
      Object.values(e.constraints ?? {}),
    );
    expect(messages.some((m) => m.includes('suspensão'))).toBe(true);
  });

  it('rejeita ponto com altura ou peso zero, negativo ou não numérico', async () => {
    const errors = await validate(
      dto({
        code: 'SA1',
        function: 'SUSPENSION',
        weights: [
          { heightM: '0', weightKg: '5200' },
          { heightM: '24', weightKg: '-5' },
          { heightM: 'abc', weightKg: '5200' },
        ],
      }),
    );

    const nested = errors
      .filter((e) => e.property === 'weights')
      .flatMap((e) => e.children ?? [])
      .flatMap((e) => e.children ?? [])
      .flatMap((e) => Object.values(e.constraints ?? {}));
    expect(nested.some((m) => m.includes('altura (m)'))).toBe(true);
    expect(nested.some((m) => m.includes('peso (kg)'))).toBe(true);
  });

  it('rejeita alturas duplicadas, inclusive com zeros à direita', async () => {
    const errors = await validate(
      dto({
        code: 'SA1',
        function: 'SUSPENSION',
        weights: [
          { heightM: '24', weightKg: '5200' },
          { heightM: '24.000', weightKg: '5300' },
        ],
      }),
    );

    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('alturas duplicadas'))).toBe(true);
  });

  it('rejeita quantidade de estais fracionária ou negativa, aceitando zero', async () => {
    const frac = await validate(
      dto({ code: 'SA1', function: 'SUSPENSION', guyCount: 1.5 }),
    );
    const negative = await validate(
      dto({ code: 'SA1', function: 'SUSPENSION', guyCount: -2 }),
    );
    const zero = await validate(
      dto({ code: 'SA1', function: 'SUSPENSION', guyCount: 0 }),
    );

    const bad = [...frac, ...negative].flatMap((e) =>
      Object.values(e.constraints ?? {}),
    );
    expect(bad.some((m) => m.includes('quantidade de estais'))).toBe(true);
    expect(bad.every((m) => m.includes('maior ou igual a zero'))).toBe(true);
    expect(zero).toHaveLength(0);
  });
});

describe('CreateTowerTypeVersionDto (validação)', () => {
  const dto = (data: Record<string, unknown>) =>
    plainToInstance(CreateTowerTypeVersionDto, data);

  it('aceita nova versão com data de vigência obrigatória', async () => {
    const errors = await validate(
      dto({
        effectiveFrom: '2026-10-01',
        guyCount: 4,
        weights: [{ heightM: '24', weightKg: '5300' }],
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita nova versão sem data de vigência', async () => {
    const errors = await validate(dto({ guyCount: 4 }));
    expect(errors.some((e) => e.property === 'effectiveFrom')).toBe(true);
  });

  it('rejeita troca de função em nova versão com mensagem em português', async () => {
    const errors = await validate(
      dto({ effectiveFrom: '2026-10-01', function: 'ANCHOR' }),
    );

    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(
      messages.some((m) => m.includes('função é fixa desde a criação')),
    ).toBe(true);
  });
});
