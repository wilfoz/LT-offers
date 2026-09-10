import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateWorkCrewVersionDto } from './dto/create-work-crew-version.dto';
import { CreateWorkCrewDto } from './dto/create-work-crew.dto';
import { WorkCrewsController } from './work-crews.controller';
import { WorkCrewsService } from './work-crews.service';

describe('WorkCrewsController', () => {
  const serviceMock = {
    create: jest.fn(),
    createVersion: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    listHistory: jest.fn(),
  };

  let controller: WorkCrewsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [WorkCrewsController],
      providers: [{ provide: WorkCrewsService, useValue: serviceMock }],
    }).compile();
    controller = moduleRef.get(WorkCrewsController);
  });

  it('usa "sistema" como autor quando o cabeçalho X-User está ausente', async () => {
    await controller.create({
      code: 'EQ-CIV-01',
      name: 'Equipe de Escavação',
    } as CreateWorkCrewDto);
    expect(serviceMock.create.mock.calls[0][1]).toBe('sistema');
  });

  it('repassa o autor do cabeçalho X-User', async () => {
    await controller.create(
      { code: 'EQ-CIV-01', name: 'Equipe de Escavação' } as CreateWorkCrewDto,
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
    controller.list('CIV', '2026-03-15');
    expect(serviceMock.list.mock.calls[0][0]).toBe('CIV');
    expect(serviceMock.list.mock.calls[0][1]).toEqual(
      new Date('2026-03-15T00:00:00.000Z'),
    );
  });

  it('rejeita alteração direta de versão por PUT e por PATCH', () => {
    expect(() => controller.replaceVersion()).toThrow(
      MethodNotAllowedException,
    );
    expect(() => controller.patchVersion()).toThrow(MethodNotAllowedException);
  });
});

describe('CreateWorkCrewDto (validação)', () => {
  const dto = (data: Record<string, unknown>) =>
    plainToInstance(CreateWorkCrewDto, data);

  it('aceita equipe com parâmetros de produção e composição válidos', async () => {
    const errors = await validate(
      dto({
        code: 'EQ-CIV-01',
        name: 'Equipe de Escavação',
        standardProductionRate: '15.0000',
        productionUnit: 'm3',
        productionPeriod: 'DAY',
        laborRoles: [{ laborRoleId: 1, quantity: '2.00' }],
        equipments: [{ equipmentId: 10, quantity: '1.00' }],
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita código ausente', async () => {
    const errors = await validate(dto({ name: 'Equipe de Escavação' }));
    expect(errors.some((e) => e.property === 'code')).toBe(true);
  });

  it('rejeita nome ausente', async () => {
    const errors = await validate(dto({ code: 'EQ-CIV-01' }));
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejeita quantidade menor ou igual a zero na composição de mão de obra', async () => {
    const errors = await validate(
      dto({
        code: 'EQ-CIV-01',
        name: 'Equipe de Escavação',
        laborRoles: [{ laborRoleId: 1, quantity: '0' }],
      }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita quantidade menor ou igual a zero na composição de equipamentos', async () => {
    const errors = await validate(
      dto({
        code: 'EQ-CIV-01',
        name: 'Equipe de Escavação',
        equipments: [{ equipmentId: 1, quantity: '-1.00' }],
      }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejeita cargos duplicados na composição', async () => {
    const errors = await validate(
      dto({
        code: 'EQ-CIV-01',
        name: 'Equipe de Escavação',
        laborRoles: [
          { laborRoleId: 1, quantity: '1.00' },
          { laborRoleId: 1, quantity: '2.00' },
        ],
      }),
    );
    expect(errors.some((e) => e.property === 'laborRoles')).toBe(true);
  });

  it('rejeita equipamentos duplicados na composição', async () => {
    const errors = await validate(
      dto({
        code: 'EQ-CIV-01',
        name: 'Equipe de Escavação',
        equipments: [
          { equipmentId: 1, quantity: '1.00' },
          { equipmentId: 1, quantity: '2.00' },
        ],
      }),
    );
    expect(errors.some((e) => e.property === 'equipments')).toBe(true);
  });
});

describe('CreateWorkCrewVersionDto (validação)', () => {
  const dto = (data: Record<string, unknown>) =>
    plainToInstance(CreateWorkCrewVersionDto, data);

  it('aceita nova versão com data de vigência obrigatória', async () => {
    const errors = await validate(
      dto({
        effectiveFrom: '2026-10-01',
        standardProductionRate: '20.0000',
        productionUnit: 'm3',
        productionPeriod: 'DAY',
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita nova versão sem data de vigência', async () => {
    const errors = await validate(
      dto({
        standardProductionRate: '20.0000',
      }),
    );
    expect(errors.some((e) => e.property === 'effectiveFrom')).toBe(true);
  });
});
