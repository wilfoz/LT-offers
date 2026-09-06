import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { CreateLaborRoleDto } from './dto/create-labor-role.dto';
import { CreateLaborRoleVersionDto } from './dto/create-labor-role-version.dto';
import { LaborRolesController } from './labor-roles.controller';
import { LaborRolesService } from './labor-roles.service';

describe('LaborRolesController', () => {
  const serviceMock = {
    create: jest.fn(),
    createVersion: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    listHistory: jest.fn(),
  };

  let controller: LaborRolesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [LaborRolesController],
      providers: [{ provide: LaborRolesService, useValue: serviceMock }],
    }).compile();
    controller = moduleRef.get(LaborRolesController);
  });

  it('usa "sistema" como autor quando o cabeçalho X-User está ausente', async () => {
    await controller.create({ code: 'ENC01', name: 'Encarregado' } as CreateLaborRoleDto);
    expect(serviceMock.create.mock.calls[0][1]).toBe('sistema');
  });

  it('repassa o autor do cabeçalho X-User', async () => {
    await controller.create(
      { code: 'ENC01', name: 'Encarregado' } as CreateLaborRoleDto,
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
    controller.list('ENC', '2026-03-15');
    expect(serviceMock.list.mock.calls[0][0]).toBe('ENC');
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

describe('CreateLaborRoleDto (validação)', () => {
  const dto = (data: Partial<CreateLaborRoleDto>) =>
    Object.assign(new CreateLaborRoleDto(), data);

  it('aceita decimais como string, textos e null como não informado', async () => {
    const errors = await validate(
      dto({
        code: 'ENC01',
        name: 'Encarregado',
        baseSalary: '5500.00',
        hazardPayPercent: '30.0000',
        housingMonthly: null,
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('aceita zero informado como valor, distinto de não informado (RNF-09)', async () => {
    const errors = await validate(
      dto({ code: 'ENC01', name: 'Encarregado', baseSalary: '0' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita código ausente', async () => {
    const errors = await validate(dto({ name: 'Encarregado', baseSalary: '5000' }));
    expect(errors.some((e) => e.property === 'code')).toBe(true);
  });

  it('rejeita nome ausente', async () => {
    const errors = await validate(dto({ code: 'ENC01', baseSalary: '5000' }));
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });

  it('rejeita valor numérico negativo com mensagem em português', async () => {
    const errors = await validate(
      dto({ code: 'ENC01', name: 'Encarregado', baseSalary: '-1' }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages.some((m) => m.includes('salário base (R$)'))).toBe(true);
  });

  it('rejeita casas decimais além da precisão da coluna com mensagem em português', async () => {
    const errors = await validate(
      dto({
        code: 'ENC01',
        name: 'Encarregado',
        baseSalary: '5500.505',
        hazardPayPercent: '30.00001',
      }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(
      messages.some(
        (m) => m.includes('salário base (R$)') && m.includes('2 casas'),
      ),
    ).toBe(true);
    expect(
      messages.some(
        (m) => m.includes('adicional de periculosidade (%)') && m.includes('4 casas'),
      ),
    ).toBe(true);
  });
});

describe('CreateLaborRoleVersionDto (validação)', () => {
  const dto = (data: Partial<CreateLaborRoleVersionDto>) =>
    Object.assign(new CreateLaborRoleVersionDto(), data);

  it('aceita nova versão com data de vigência obrigatória', async () => {
    const errors = await validate(
      dto({ effectiveFrom: '2026-10-01', baseSalary: '6000.00' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita nova versão sem data de vigência', async () => {
    const errors = await validate(dto({ baseSalary: '6000.00' }));
    expect(errors.some((e) => e.property === 'effectiveFrom')).toBe(true);
  });
});
