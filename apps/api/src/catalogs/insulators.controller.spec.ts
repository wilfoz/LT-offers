import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { CreateInsulatorDto } from './dto/create-insulator.dto';
import { CreateInsulatorVersionDto } from './dto/create-insulator-version.dto';
import { InsulatorsController } from './insulators.controller';
import { InsulatorsService } from './insulators.service';

describe('InsulatorsController', () => {
  const serviceMock = {
    create: jest.fn(),
    createVersion: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    listHistory: jest.fn(),
  };

  let controller: InsulatorsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [InsulatorsController],
      providers: [{ provide: InsulatorsService, useValue: serviceMock }],
    }).compile();
    controller = moduleRef.get(InsulatorsController);
  });

  it('usa "sistema" como autor quando o cabeçalho X-User está ausente', async () => {
    await controller.create({ code: 'ISO-V-120' } as CreateInsulatorDto);
    expect(serviceMock.create.mock.calls[0][1]).toBe('sistema');
  });

  it('repassa o autor do cabeçalho X-User', async () => {
    await controller.create(
      { code: 'ISO-V-120' } as CreateInsulatorDto,
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
    controller.list('ISO', '2026-03-15');
    expect(serviceMock.list.mock.calls[0][0]).toBe('ISO');
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

describe('CreateInsulatorDto (validação)', () => {
  const dto = (data: Partial<CreateInsulatorDto>) =>
    Object.assign(new CreateInsulatorDto(), data);

  it('aceita decimais como string, textos livres e null como não informado', async () => {
    const errors = await validate(
      dto({
        code: 'ISO-V-120',
        type: 'vidro',
        profile: 'antipoluição',
        ruptureStrengthKn: '120.5',
        diameterMm: '255',
        spacingMm: null,
        creepageDistanceMm: '320.125',
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('aceita zero informado como valor, distinto de não informado (RNF-09)', async () => {
    const errors = await validate(
      dto({ code: 'ISO-X', ruptureStrengthKn: '0' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita código ausente', async () => {
    const errors = await validate(dto({ ruptureStrengthKn: '120' }));
    expect(errors.some((e) => e.property === 'code')).toBe(true);
  });

  it('rejeita valor numérico negativo ou não numérico com mensagem em português', async () => {
    const errors = await validate(
      dto({ code: 'ISO-X', ruptureStrengthKn: '-1', diameterMm: 'abc' }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('carga de ruptura (kN)'))).toBe(
      true,
    );
    expect(messages.some((m) => m.includes('diâmetro (mm)'))).toBe(true);
  });

  it('rejeita casas decimais além da precisão da coluna com mensagem em português', async () => {
    const errors = await validate(
      dto({
        code: 'ISO-X',
        ruptureStrengthKn: '120.505',
        spacingMm: '146.0005',
      }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(
      messages.some(
        (m) => m.includes('carga de ruptura (kN)') && m.includes('2 casas'),
      ),
    ).toBe(true);
    expect(
      messages.some((m) => m.includes('passo (mm)') && m.includes('3 casas')),
    ).toBe(true);
  });
});

describe('CreateInsulatorVersionDto (validação)', () => {
  const dto = (data: Partial<CreateInsulatorVersionDto>) =>
    Object.assign(new CreateInsulatorVersionDto(), data);

  it('aceita nova versão com data de vigência obrigatória', async () => {
    const errors = await validate(
      dto({ effectiveFrom: '2026-10-01', type: 'porcelana' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita nova versão sem data de vigência', async () => {
    const errors = await validate(dto({ type: 'porcelana' }));
    expect(errors.some((e) => e.property === 'effectiveFrom')).toBe(true);
  });
});
