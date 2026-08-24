import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { CreateGroundWireDto } from './dto/create-ground-wire.dto';
import { CreateGroundWireVersionDto } from './dto/create-ground-wire-version.dto';
import { GroundWiresController } from './ground-wires.controller';
import { GroundWiresService } from './ground-wires.service';

describe('GroundWiresController', () => {
  const serviceMock = {
    create: jest.fn(),
    createVersion: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    listHistory: jest.fn(),
  };

  let controller: GroundWiresController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [GroundWiresController],
      providers: [{ provide: GroundWiresService, useValue: serviceMock }],
    }).compile();
    controller = moduleRef.get(GroundWiresController);
  });

  it('usa "sistema" como autor quando o cabeçalho X-User está ausente', async () => {
    await controller.create({
      code: 'CG-EHS-3/8',
      type: 'STEEL',
    } as CreateGroundWireDto);
    expect(serviceMock.create.mock.calls[0][1]).toBe('sistema');
  });

  it('repassa o autor do cabeçalho X-User', async () => {
    await controller.create(
      { code: 'CG-EHS-3/8', type: 'STEEL' } as CreateGroundWireDto,
      'carla',
    );
    expect(serviceMock.create.mock.calls[0][1]).toBe('carla');
  });

  it('repassa o filtro de tipo válido para o serviço', () => {
    controller.list('CG', 'OPGW', '2026-03-15');
    expect(serviceMock.list.mock.calls[0][1]).toBe('OPGW');
  });

  it('não filtra por tipo quando o parâmetro está ausente', () => {
    controller.list(undefined, undefined, undefined);
    expect(serviceMock.list.mock.calls[0][1]).toBeUndefined();
  });

  it('rejeita filtro de tipo desconhecido com mensagem em português', () => {
    expect(() => controller.list(undefined, 'ACSR', undefined)).toThrow(
      BadRequestException,
    );
    expect(() => controller.list(undefined, 'ACSR', undefined)).toThrow(
      /STEEL.*OPGW/,
    );
  });

  it('rejeita data de referência fora do formato AAAA-MM-DD', () => {
    expect(() => controller.list(undefined, undefined, '23/08/2026')).toThrow(
      BadRequestException,
    );
  });

  it('rejeita data de referência de calendário inexistente', () => {
    expect(() => controller.list(undefined, undefined, '2026-02-30')).toThrow(
      BadRequestException,
    );
  });

  it('repassa a data de referência válida para o serviço', () => {
    controller.list('CG', undefined, '2026-03-15');
    expect(serviceMock.list.mock.calls[0][2]).toEqual(
      new Date('2026-03-15T00:00:00.000Z'),
    );
  });

  it('usa a data civil de hoje como referência quando effectiveOn está ausente', () => {
    controller.list(undefined, undefined, undefined);
    const usedDate = serviceMock.list.mock.calls[0][2] as Date;
    expect(usedDate.toISOString()).toMatch(/T00:00:00\.000Z$/);
  });

  it('rejeita alteração direta de versão por PUT e por PATCH', () => {
    expect(() => controller.replaceVersion()).toThrow(
      MethodNotAllowedException,
    );
    expect(() => controller.patchVersion()).toThrow(MethodNotAllowedException);
  });
});

describe('CreateGroundWireDto (validação)', () => {
  const dto = (data: Partial<CreateGroundWireDto>) =>
    Object.assign(new CreateGroundWireDto(), data);

  it('aceita cabo de aço com decimais como string e null como não informado', async () => {
    const errors = await validate(
      dto({
        code: 'CG-EHS-3/8',
        type: 'STEEL',
        weightTonPerKm: '0.406',
        utsKn: null,
        wireCount: 7,
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita tipo fora de STEEL|OPGW com mensagem em português', async () => {
    const errors = await validate(dto({ code: 'CG-X', type: 'ACO' as never }));
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('STEEL (aço) ou OPGW'))).toBe(true);
  });

  it('rejeita tipo ausente', async () => {
    const errors = await validate(dto({ code: 'CG-X' }));
    expect(errors.some((e) => e.property === 'type')).toBe(true);
  });

  it('rejeita contagens fracionárias, zero ou negativas com mensagem em português', async () => {
    const errors = await validate(
      dto({ code: 'OPGW-X', type: 'OPGW', fiberCount: 2.5 }),
    );
    const zeroErrors = await validate(
      dto({ code: 'CG-X', type: 'STEEL', wireCount: 0 }),
    );
    const negativeErrors = await validate(
      dto({ code: 'CG-X', type: 'STEEL', wireCount: -7 }),
    );

    const all = [...errors, ...zeroErrors, ...negativeErrors].flatMap((e) =>
      Object.values(e.constraints ?? {}),
    );
    expect(all.some((m) => m.includes('número de fibras'))).toBe(true);
    expect(all.some((m) => m.includes('número de fios'))).toBe(true);
    expect(all.every((m) => m.includes('inteiro positivo'))).toBe(true);
  });

  it('rejeita valor numérico negativo ou não numérico com mensagem em português', async () => {
    const errors = await validate(
      dto({ code: 'CG-X', type: 'STEEL', utsKn: '-10', i2tKa2s: 'abc' }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('UTS (kN)'))).toBe(true);
    expect(messages.some((m) => m.includes('I²t (kA²·s)'))).toBe(true);
  });
});

describe('CreateGroundWireVersionDto (validação)', () => {
  const dto = (data: Partial<CreateGroundWireVersionDto>) =>
    Object.assign(new CreateGroundWireVersionDto(), data);

  it('rejeita tentativa de alterar o tipo em nova versão', async () => {
    const errors = await validate(
      dto({ effectiveFrom: '2026-09-01', type: 'OPGW' }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('fixo desde a criação'))).toBe(true);
  });

  it('aceita nova versão sem tipo, com data de vigência obrigatória', async () => {
    const errors = await validate(
      dto({ effectiveFrom: '2026-09-01', strengthGrade: 'EHS' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita nova versão sem data de vigência', async () => {
    const errors = await validate(dto({ strengthGrade: 'EHS' }));
    expect(errors.some((e) => e.property === 'effectiveFrom')).toBe(true);
  });
});
