import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { ConductorCablesController } from './conductor-cables.controller';
import { ConductorCablesService } from './conductor-cables.service';
import { CreateConductorCableDto } from './dto/create-conductor-cable.dto';

describe('ConductorCablesController', () => {
  const serviceMock = {
    create: jest.fn(),
    createVersion: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    listHistory: jest.fn(),
  };

  let controller: ConductorCablesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [ConductorCablesController],
      providers: [{ provide: ConductorCablesService, useValue: serviceMock }],
    }).compile();
    controller = moduleRef.get(ConductorCablesController);
  });

  it('usa "sistema" como autor quando o cabeçalho X-User está ausente', async () => {
    await controller.create({ code: 'CAA-636' } as CreateConductorCableDto);
    expect(serviceMock.create.mock.calls[0][1]).toBe('sistema');
  });

  it('repassa o autor do cabeçalho X-User', async () => {
    await controller.create(
      { code: 'CAA-636' } as CreateConductorCableDto,
      'carla',
    );
    expect(serviceMock.create.mock.calls[0][1]).toBe('carla');
  });

  it('rejeita data de referência fora do formato AAAA-MM-DD', () => {
    expect(() => controller.list(undefined, '23/08/2026')).toThrow(
      BadRequestException,
    );
  });

  it('rejeita data de referência de calendário inexistente', () => {
    expect(() => controller.list(undefined, '2026-02-30')).toThrow(
      BadRequestException,
    );
  });

  it('repassa a data de referência válida para o serviço', () => {
    controller.list('CAA', '2026-03-15');
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

describe('CreateConductorCableDto (validação)', () => {
  const dto = (data: Partial<CreateConductorCableDto>) =>
    Object.assign(new CreateConductorCableDto(), data);

  it('aceita numéricos como string decimal positiva e null como não informado', async () => {
    const errors = await validate(
      dto({ code: 'CAA-636', weightTonPerKm: '1.25', utsKn: null }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita valor numérico negativo ou não numérico com mensagem em português', async () => {
    const errors = await validate(
      dto({ code: 'CAA-636', weightTonPerKm: '-1', utsKn: 'abc' }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('peso (ton/km)'))).toBe(true);
    expect(messages.some((m) => m.includes('UTS (kN)'))).toBe(true);
  });

  it('rejeita código ausente', async () => {
    const errors = await validate(dto({ weightTonPerKm: '1.2' }));
    expect(errors.some((e) => e.property === 'code')).toBe(true);
  });
});
