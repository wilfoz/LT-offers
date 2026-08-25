import { FOUNDATION_VOLUME_QUANTITY_FIELDS } from '@lt-offers/domain';
import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { CreateFoundationVolumeDto } from './dto/create-foundation-volume.dto';
import { CreateFoundationVolumeVersionDto } from './dto/create-foundation-volume-version.dto';
import { FoundationVolumesController } from './foundation-volumes.controller';
import { FoundationVolumesService } from './foundation-volumes.service';

describe('FoundationVolumesController', () => {
  const serviceMock = {
    create: jest.fn(),
    createVersion: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    listHistory: jest.fn(),
  };

  let controller: FoundationVolumesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [FoundationVolumesController],
      providers: [{ provide: FoundationVolumesService, useValue: serviceMock }],
    }).compile();
    controller = moduleRef.get(FoundationVolumesController);
  });

  it('usa "sistema" como autor quando o cabeçalho X-User está ausente', async () => {
    await controller.create({
      towerTypeId: 5,
      soilTypeId: 2,
      foundationTypeId: 3,
    } as CreateFoundationVolumeDto);
    expect(serviceMock.create.mock.calls[0][1]).toBe('sistema');
  });

  it('repassa o autor do cabeçalho X-User', async () => {
    await controller.create(
      {
        towerTypeId: 5,
        soilTypeId: 2,
        foundationTypeId: 3,
      } as CreateFoundationVolumeDto,
      'carla',
    );
    expect(serviceMock.create.mock.calls[0][1]).toBe('carla');
  });

  it('repassa os filtros da combinação convertidos para número', () => {
    controller.list('5', '2', '3', '2026-03-15');
    expect(serviceMock.list.mock.calls[0][0]).toEqual({
      towerTypeId: 5,
      soilTypeId: 2,
      foundationTypeId: 3,
    });
    expect(serviceMock.list.mock.calls[0][1]).toEqual(
      new Date('2026-03-15T00:00:00.000Z'),
    );
  });

  it('trata filtros ausentes ou vazios como sem filtro', () => {
    controller.list(undefined, '', undefined);
    expect(serviceMock.list.mock.calls[0][0]).toEqual({
      towerTypeId: undefined,
      soilTypeId: undefined,
      foundationTypeId: undefined,
    });
  });

  it.each([
    ['abc', undefined, undefined],
    [undefined, '1.5', undefined],
    [undefined, undefined, '-3'],
  ])(
    'rejeita filtro não numérico com mensagem em português (%s, %s, %s)',
    (towerTypeId, soilTypeId, foundationTypeId) => {
      expect(() =>
        controller.list(towerTypeId, soilTypeId, foundationTypeId),
      ).toThrow('deve ser um identificador numérico');
    },
  );

  it('rejeita data de referência fora do formato AAAA-MM-DD', () => {
    expect(() =>
      controller.list(undefined, undefined, undefined, '25/08/2026'),
    ).toThrow(BadRequestException);
  });

  it('rejeita data de referência de calendário inexistente', () => {
    expect(() =>
      controller.list(undefined, undefined, undefined, '2026-02-30'),
    ).toThrow(BadRequestException);
  });

  it('usa a data civil de hoje como referência quando effectiveOn está ausente', () => {
    controller.list(undefined, undefined, undefined, undefined);
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

describe('CreateFoundationVolumeDto (validação)', () => {
  const dto = (data: Partial<CreateFoundationVolumeDto>) =>
    Object.assign(new CreateFoundationVolumeDto(), data);

  it('aceita a tripla com quantidades como string e null como não informado', async () => {
    const errors = await validate(
      dto({
        towerTypeId: 5,
        soilTypeId: 2,
        foundationTypeId: 3,
        excavationHardPrecastM3: '20',
        steelPrecastKg: '486',
        concretePrecastM3: '3.71',
        groutM3: null,
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('aceita quantidade zero como valor, distinta de não informada (RNF-09)', async () => {
    const errors = await validate(
      dto({
        towerTypeId: 5,
        soilTypeId: 2,
        foundationTypeId: 3,
        excavationPierM3: '0',
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it.each(['towerTypeId', 'soilTypeId', 'foundationTypeId'] as const)(
    'rejeita a tripla sem %s',
    async (missing) => {
      const data = {
        towerTypeId: 5,
        soilTypeId: 2,
        foundationTypeId: 3,
      } as Record<string, unknown>;
      delete data[missing];

      const errors = await validate(dto(data));
      expect(errors.some((e) => e.property === missing)).toBe(true);
    },
  );

  it('rejeita quantidade negativa ou não numérica com mensagem em português', async () => {
    const errors = await validate(
      dto({
        towerTypeId: 5,
        soilTypeId: 2,
        foundationTypeId: 3,
        steelRockKg: '-1',
        regenerationM3: 'abc',
      }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('aço rocha (kg)'))).toBe(true);
    expect(messages.some((m) => m.includes('regeneração (m³)'))).toBe(true);
  });

  it('rejeita casas decimais além da precisão da coluna com mensagem em português', async () => {
    const errors = await validate(
      dto({
        towerTypeId: 5,
        soilTypeId: 2,
        foundationTypeId: 3,
        backfillSoilM3: '5.4321',
      }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(
      messages.some(
        (m) => m.includes('reaterro solo (m³)') && m.includes('3 casas'),
      ),
    ).toBe(true);
  });

  // Paridade DTO ↔ contrato da domain: o ValidationPipe (whitelist) descarta
  // em silêncio propriedade sem decorator — se uma quantidade nova entrar na
  // domain e faltar aqui, este teste acusa (MIN-1 da review dos grupos 4-5).
  it('valida todas as quantidades da lista da domain (paridade DTO ↔ contrato)', async () => {
    const allInvalid = Object.fromEntries(
      FOUNDATION_VOLUME_QUANTITY_FIELDS.map((field) => [field, 'abc']),
    );
    const errors = await validate(
      dto({
        towerTypeId: 5,
        soilTypeId: 2,
        foundationTypeId: 3,
        ...allInvalid,
      }),
    );
    expect(errors.map((e) => e.property).sort()).toEqual(
      [...FOUNDATION_VOLUME_QUANTITY_FIELDS].sort(),
    );
  });
});

describe('CreateFoundationVolumeVersionDto (validação)', () => {
  const dto = (data: Partial<CreateFoundationVolumeVersionDto>) =>
    Object.assign(new CreateFoundationVolumeVersionDto(), data);

  it('aceita nova versão com data de vigência obrigatória', async () => {
    const errors = await validate(
      dto({ effectiveFrom: '2026-10-01', groutM3: '1.5' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita nova versão sem data de vigência', async () => {
    const errors = await validate(dto({ groutM3: '1.5' }));
    expect(errors.some((e) => e.property === 'effectiveFrom')).toBe(true);
  });

  it('rejeita troca da combinação em nova versão com mensagem em português', async () => {
    const errors = await validate(
      dto({
        effectiveFrom: '2026-10-01',
        towerTypeId: 9,
        soilTypeId: 8,
        foundationTypeId: 7,
      } as Partial<CreateFoundationVolumeVersionDto>),
    );
    const properties = errors.map((e) => e.property);
    expect(properties).toEqual(
      expect.arrayContaining(['towerTypeId', 'soilTypeId', 'foundationTypeId']),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.every((m) => m.includes('não pode ser alterada'))).toBe(
      true,
    );
  });
});
