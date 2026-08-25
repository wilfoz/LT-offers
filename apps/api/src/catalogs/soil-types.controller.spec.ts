import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { CreateSoilTypeDto } from './dto/create-soil-type.dto';
import { CreateSoilTypeVersionDto } from './dto/create-soil-type-version.dto';
import { SoilTypesController } from './soil-types.controller';
import { SoilTypesService } from './soil-types.service';

describe('SoilTypesController', () => {
  const serviceMock = {
    create: jest.fn(),
    createVersion: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    listHistory: jest.fn(),
  };

  let controller: SoilTypesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [SoilTypesController],
      providers: [{ provide: SoilTypesService, useValue: serviceMock }],
    }).compile();
    controller = moduleRef.get(SoilTypesController);
  });

  it('usa "sistema" como autor quando o cabeçalho X-User está ausente', async () => {
    await controller.create({ code: 'I' } as CreateSoilTypeDto);
    expect(serviceMock.create.mock.calls[0][1]).toBe('sistema');
  });

  it('repassa o autor do cabeçalho X-User', async () => {
    await controller.create({ code: 'I' } as CreateSoilTypeDto, 'carla');
    expect(serviceMock.create.mock.calls[0][1]).toBe('carla');
  });

  it('rejeita data de referência fora do formato AAAA-MM-DD', () => {
    expect(() => controller.list(undefined, '25/08/2026')).toThrow(
      BadRequestException,
    );
  });

  it('rejeita data de referência de calendário inexistente', () => {
    expect(() => controller.list(undefined, '2026-02-30')).toThrow(
      BadRequestException,
    );
  });

  it('repassa o termo de busca e a data de referência válida para o serviço', () => {
    controller.list('roc', '2026-03-15');
    expect(serviceMock.list.mock.calls[0][0]).toBe('roc');
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

describe('CreateSoilTypeDto (validação)', () => {
  const dto = (data: Partial<CreateSoilTypeDto>) =>
    Object.assign(new CreateSoilTypeDto(), data);

  it('aceita decimais como string, faixa de NSPT e null como não informado', async () => {
    const errors = await validate(
      dto({
        code: 'I',
        description: 'Duro',
        submerged: false,
        allowableCompressionStressKgfCm2: '3',
        specificWeightKgfM3: '1600',
        internalFrictionAngleDeg: '25',
        cohesionKgCm2: '0.3',
        nsptMin: 12,
        nsptMax: 16,
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('aceita solo sem faixa de NSPT nem coesão (caso rocha)', async () => {
    const errors = await validate(
      dto({ code: 'R', description: 'Rocha', cohesionKgCm2: null }),
    );
    expect(errors).toHaveLength(0);
  });

  it('aceita zero informado como valor, distinto de não informado (RNF-09)', async () => {
    const errors = await validate(
      dto({
        code: 'E',
        allowableCompressionStressKgfCm2: '0',
        nsptMin: 0,
        nsptMax: 4,
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita código ausente', async () => {
    const errors = await validate(dto({ description: 'Duro' }));
    expect(errors.some((e) => e.property === 'code')).toBe(true);
  });

  it('rejeita valor numérico negativo ou não numérico com mensagem em português', async () => {
    const errors = await validate(
      dto({
        code: 'I',
        specificWeightKgfM3: '-1',
        internalFrictionAngleDeg: 'abc',
      }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('peso específico (kgf/m³)'))).toBe(
      true,
    );
    expect(
      messages.some((m) => m.includes('ângulo de atrito interno (°)')),
    ).toBe(true);
  });

  it('rejeita casas decimais além da precisão da coluna com mensagem em português', async () => {
    const errors = await validate(
      dto({
        code: 'I',
        allowableCompressionStressKgfCm2: '3.005',
        cohesionKgCm2: '0.0005',
      }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(
      messages.some(
        (m) =>
          m.includes('tensão admissível à compressão (kgf/cm²)') &&
          m.includes('2 casas'),
      ),
    ).toBe(true);
    expect(
      messages.some(
        (m) => m.includes('coesão (kg/cm²)') && m.includes('3 casas'),
      ),
    ).toBe(true);
  });

  it('rejeita limites de NSPT fracionários ou negativos', async () => {
    const errors = await validate(
      dto({ code: 'I', nsptMin: 1.5, nsptMax: -2 }),
    );
    expect(errors.some((e) => e.property === 'nsptMin')).toBe(true);
    expect(errors.some((e) => e.property === 'nsptMax')).toBe(true);
  });

  it('rejeita faixa de NSPT invertida com mensagem em português', async () => {
    const errors = await validate(dto({ code: 'I', nsptMin: 16, nsptMax: 12 }));
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(
      messages.some(
        (m) => m === 'O NSPT mínimo deve ser menor que o NSPT máximo',
      ),
    ).toBe(true);
  });

  it('rejeita faixa de NSPT com mínimo igual ao máximo', async () => {
    const errors = await validate(dto({ code: 'I', nsptMin: 8, nsptMax: 8 }));
    expect(errors.some((e) => e.property === 'nsptMax')).toBe(true);
  });

  it('rejeita faixa de NSPT informada pela metade com mensagem em português', async () => {
    const onlyMin = await validate(dto({ code: 'I', nsptMin: 4 }));
    const onlyMax = await validate(dto({ code: 'I', nsptMax: 6 }));
    const messages = [...onlyMin, ...onlyMax].flatMap((e) =>
      Object.values(e.constraints ?? {}),
    );
    expect(onlyMin.some((e) => e.property === 'nsptMin')).toBe(true);
    expect(onlyMax.some((e) => e.property === 'nsptMax')).toBe(true);
    expect(
      messages.every((m) =>
        m.includes('faixa de NSPT completa (mínimo e máximo)'),
      ),
    ).toBe(true);
  });

  it('rejeita submerso não booleano com mensagem em português', async () => {
    const errors = await validate(
      dto({ code: 'I', submerged: 'sim' as unknown as boolean }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('submerso'))).toBe(true);
  });
});

describe('CreateSoilTypeVersionDto (validação)', () => {
  const dto = (data: Partial<CreateSoilTypeVersionDto>) =>
    Object.assign(new CreateSoilTypeVersionDto(), data);

  it('aceita nova versão com data de vigência obrigatória', async () => {
    const errors = await validate(
      dto({ effectiveFrom: '2026-10-01', description: 'Duro revisado' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita nova versão sem data de vigência', async () => {
    const errors = await validate(dto({ description: 'Duro revisado' }));
    expect(errors.some((e) => e.property === 'effectiveFrom')).toBe(true);
  });
});
