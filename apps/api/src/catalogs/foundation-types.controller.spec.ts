import { FOUNDATION_ELEMENT_COUNT_FIELDS } from '@lt-offers/domain';
import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { CreateFoundationTypeDto } from './dto/create-foundation-type.dto';
import { CreateFoundationTypeVersionDto } from './dto/create-foundation-type-version.dto';
import { FoundationTypesController } from './foundation-types.controller';
import { FoundationTypesService } from './foundation-types.service';

describe('FoundationTypesController', () => {
  const serviceMock = {
    create: jest.fn(),
    createVersion: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    listHistory: jest.fn(),
  };

  let controller: FoundationTypesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [FoundationTypesController],
      providers: [{ provide: FoundationTypesService, useValue: serviceMock }],
    }).compile();
    controller = moduleRef.get(FoundationTypesController);
  });

  it('usa "sistema" como autor quando o cabeçalho X-User está ausente', async () => {
    await controller.create({
      code: '4FZ',
      application: 'SELF_SUPPORTING',
    } as CreateFoundationTypeDto);
    expect(serviceMock.create.mock.calls[0][1]).toBe('sistema');
  });

  it('repassa o autor do cabeçalho X-User', async () => {
    await controller.create(
      {
        code: '4FZ',
        application: 'SELF_SUPPORTING',
      } as CreateFoundationTypeDto,
      'carla',
    );
    expect(serviceMock.create.mock.calls[0][1]).toBe('carla');
  });

  it('repassa busca e filtro de aplicação juntos para o serviço', () => {
    controller.list('pila', 'GUYED', '2026-03-15');
    expect(serviceMock.list.mock.calls[0][0]).toBe('pila');
    expect(serviceMock.list.mock.calls[0][1]).toBe('GUYED');
    expect(serviceMock.list.mock.calls[0][2]).toEqual(
      new Date('2026-03-15T00:00:00.000Z'),
    );
  });

  it('rejeita filtro de aplicação fora do enum com mensagem em português', () => {
    expect(() => controller.list(undefined, 'ESTAIADA')).toThrow(
      'A aplicação deve ser SELF_SUPPORTING (autoportante), GUYED (estaiada) ou CROSS_ROPE quando informada',
    );
  });

  it('trata aplicação vazia como ausência de filtro', () => {
    controller.list(undefined, '');
    expect(serviceMock.list.mock.calls[0][1]).toBeUndefined();
  });

  it('rejeita data de referência fora do formato AAAA-MM-DD', () => {
    expect(() => controller.list(undefined, undefined, '25/08/2026')).toThrow(
      BadRequestException,
    );
  });

  it('rejeita data de referência de calendário inexistente', () => {
    expect(() => controller.list(undefined, undefined, '2026-02-30')).toThrow(
      BadRequestException,
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

describe('CreateFoundationTypeDto (validação)', () => {
  const dto = (data: Partial<CreateFoundationTypeDto>) =>
    Object.assign(new CreateFoundationTypeDto(), data);

  it('aceita sigla, aplicação e contagens válidas com null como não informado', async () => {
    const errors = await validate(
      dto({
        code: '1PR - 4P',
        application: 'GUYED',
        description: '1 x Mastro preformado 4 x Tirantes pilas',
        precastMastCount: 1,
        straightPierGuyCount: 4,
        triconeCount: null,
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('aceita contagem zero como valor, distinta de não informada (RNF-09)', async () => {
    const errors = await validate(
      dto({
        code: '4FZ',
        application: 'SELF_SUPPORTING',
        spreadFootingCount: 0,
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita sigla ausente', async () => {
    const errors = await validate(dto({ application: 'SELF_SUPPORTING' }));
    expect(errors.some((e) => e.property === 'code')).toBe(true);
  });

  it('rejeita aplicação fora do enum com mensagem em português', async () => {
    const errors = await validate(
      dto({
        code: '4FZ',
        application: 'AUTOPORTANTE' as CreateFoundationTypeDto['application'],
      }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('autoportante'))).toBe(true);
  });

  it('rejeita aplicação ausente', async () => {
    const errors = await validate(dto({ code: '4FZ' }));
    expect(errors.some((e) => e.property === 'application')).toBe(true);
  });

  it('rejeita contagem fracionária, negativa ou não numérica com mensagem em português', async () => {
    const errors = await validate(
      dto({
        code: '4FZ',
        application: 'SELF_SUPPORTING',
        spreadFootingCount: 1.5,
        helicalGuyCount: -4,
        triconeCount: 'x' as unknown as number,
      }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('fuste sapata'))).toBe(true);
    expect(messages.some((m) => m.includes('helicoidal tirante'))).toBe(true);
    expect(messages.some((m) => m.includes('tricone'))).toBe(true);
  });

  // Paridade DTO ↔ contrato da domain: o ValidationPipe (whitelist) descarta
  // em silêncio propriedade sem decorator — se uma contagem nova entrar na
  // domain e faltar aqui, este teste acusa (MIN-1 da review dos grupos 4-5).
  it('valida todas as contagens da lista da domain (paridade DTO ↔ contrato)', async () => {
    const allInvalid = Object.fromEntries(
      FOUNDATION_ELEMENT_COUNT_FIELDS.map((field) => [field, 1.5]),
    );
    const errors = await validate(
      dto({ code: '4FZ', application: 'SELF_SUPPORTING', ...allInvalid }),
    );
    expect(errors.map((e) => e.property).sort()).toEqual(
      [...FOUNDATION_ELEMENT_COUNT_FIELDS].sort(),
    );
  });
});

describe('CreateFoundationTypeVersionDto (validação)', () => {
  const dto = (data: Partial<CreateFoundationTypeVersionDto>) =>
    Object.assign(new CreateFoundationTypeVersionDto(), data);

  it('aceita nova versão com data de vigência obrigatória', async () => {
    const errors = await validate(
      dto({ effectiveFrom: '2026-10-01', spreadFootingCount: 4 }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita nova versão sem data de vigência', async () => {
    const errors = await validate(dto({ spreadFootingCount: 4 }));
    expect(errors.some((e) => e.property === 'effectiveFrom')).toBe(true);
  });

  it('rejeita troca de aplicação em nova versão com mensagem em português', async () => {
    const errors = await validate(
      dto({
        effectiveFrom: '2026-10-01',
        application: 'GUYED',
      } as Partial<CreateFoundationTypeVersionDto>),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('não pode ser alterada'))).toBe(
      true,
    );
  });
});
