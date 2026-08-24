import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { CreateGuyWireDto } from './dto/create-guy-wire.dto';
import { CreateGuyWireVersionDto } from './dto/create-guy-wire-version.dto';
import { GuyWiresController } from './guy-wires.controller';
import { GuyWiresService } from './guy-wires.service';

describe('GuyWiresController', () => {
  const serviceMock = {
    create: jest.fn(),
    createVersion: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    listHistory: jest.fn(),
  };

  let controller: GuyWiresController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [GuyWiresController],
      providers: [{ provide: GuyWiresService, useValue: serviceMock }],
    }).compile();
    controller = moduleRef.get(GuyWiresController);
  });

  it('usa "sistema" como autor quando o cabeçalho X-User está ausente', async () => {
    await controller.create({ code: 'CT-HS-5/16' } as CreateGuyWireDto);
    expect(serviceMock.create.mock.calls[0][1]).toBe('sistema');
  });

  it('repassa o autor do cabeçalho X-User', async () => {
    await controller.create(
      { code: 'CT-HS-5/16' } as CreateGuyWireDto,
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

  it('repassa a data de referência válida para o serviço', () => {
    controller.list('CT', '2026-03-15');
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

describe('CreateGuyWireDto (validação)', () => {
  const dto = (data: Partial<CreateGuyWireDto>) =>
    Object.assign(new CreateGuyWireDto(), data);

  it('aceita decimais como string e null como não informado', async () => {
    const errors = await validate(
      dto({
        code: 'CT-HS-5/16',
        weightTonPerKm: '0.31',
        utsKn: null,
        wireCount: 7,
        strengthGrade: 'HS',
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita código ausente', async () => {
    const errors = await validate(dto({ weightTonPerKm: '0.31' }));
    expect(errors.some((e) => e.property === 'code')).toBe(true);
  });

  it('rejeita valor numérico negativo ou não numérico com mensagem em português', async () => {
    const errors = await validate(
      dto({ code: 'CT-X', weightTonPerKm: '-1', utsKn: 'abc' }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('peso (ton/km)'))).toBe(true);
    expect(messages.some((m) => m.includes('UTS (kN)'))).toBe(true);
  });

  it('rejeita número de fios fracionário, zero ou negativo com mensagem em português', async () => {
    const fracErrors = await validate(dto({ code: 'CT-X', wireCount: 2.5 }));
    const zeroErrors = await validate(dto({ code: 'CT-X', wireCount: 0 }));
    const negativeErrors = await validate(dto({ code: 'CT-X', wireCount: -7 }));

    const all = [...fracErrors, ...zeroErrors, ...negativeErrors].flatMap((e) =>
      Object.values(e.constraints ?? {}),
    );
    expect(all.some((m) => m.includes('número de fios'))).toBe(true);
    expect(all.every((m) => m.includes('inteiro positivo'))).toBe(true);
  });
});

describe('CreateGuyWireVersionDto (validação)', () => {
  const dto = (data: Partial<CreateGuyWireVersionDto>) =>
    Object.assign(new CreateGuyWireVersionDto(), data);

  it('aceita nova versão com data de vigência obrigatória', async () => {
    const errors = await validate(
      dto({ effectiveFrom: '2026-10-01', strengthGrade: 'EHS' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita nova versão sem data de vigência', async () => {
    const errors = await validate(dto({ strengthGrade: 'EHS' }));
    expect(errors.some((e) => e.property === 'effectiveFrom')).toBe(true);
  });
});
