import { MethodNotAllowedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { CreateEquipmentVersionDto } from './dto/create-equipment-version.dto';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';

describe('EquipmentController', () => {
  const serviceMock = {
    create: jest.fn(),
    createVersion: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    listHistory: jest.fn(),
  };

  let controller: EquipmentController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [{ provide: EquipmentService, useValue: serviceMock }],
    }).compile();
    controller = moduleRef.get(EquipmentController);
  });

  it('usa "sistema" como autor quando o cabeçalho X-User está ausente', async () => {
    await controller.create({ code: 'TRAT01', description: 'Trator' } as CreateEquipmentDto);
    expect(serviceMock.create.mock.calls[0][1]).toBe('sistema');
  });

  it('repassa o autor do cabeçalho X-User', async () => {
    await controller.create(
      { code: 'TRAT01', description: 'Trator' } as CreateEquipmentDto,
      'carla',
    );
    expect(serviceMock.create.mock.calls[0][1]).toBe('carla');
  });

  it('repassa busca, categoria e data de referência para o serviço', () => {
    controller.list('TRAT', 'TRANSPORTE', '2026-03-15');
    expect(serviceMock.list.mock.calls[0][0]).toBe('TRAT');
    expect(serviceMock.list.mock.calls[0][1]).toBe('TRANSPORTE');
    expect(serviceMock.list.mock.calls[0][2]).toEqual(
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

describe('CreateEquipmentDto (validação)', () => {
  const dto = (data: Partial<CreateEquipmentDto>) =>
    Object.assign(new CreateEquipmentDto(), data);

  it('aceita valores monetários válidos, inteiros e null', async () => {
    const errors = await validate(
      dto({
        code: 'TRAT01',
        description: 'Trator',
        externalRentalMonthly: '18000.00',
        depreciationYears: 5,
        ownedAvailabilityCount: 2,
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita código ausente', async () => {
    const errors = await validate(dto({ description: 'Trator' }));
    expect(errors.some((e) => e.property === 'code')).toBe(true);
  });

  it('rejeita descrição ausente', async () => {
    const errors = await validate(dto({ code: 'TRAT01' }));
    expect(errors.some((e) => e.property === 'description')).toBe(true);
  });

  it('rejeita anos de amortização zero ou negativo', async () => {
    const errors = await validate(
      dto({ code: 'TRAT01', description: 'Trator', depreciationYears: 0 }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(
      messages.some((m) => m.includes('anos de amortização devem ser maiores que zero')),
    ).toBe(true);
  });

  it('rejeita casas decimais além da precisão', async () => {
    const errors = await validate(
      dto({
        code: 'TRAT01',
        description: 'Trator',
        externalRentalMonthly: '18000.555',
      }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(
      messages.some(
        (m) => m.includes('locação externa (R$/mês)') && m.includes('2 casas'),
      ),
    ).toBe(true);
  });
});

describe('CreateEquipmentVersionDto (validação)', () => {
  const dto = (data: Partial<CreateEquipmentVersionDto>) =>
    Object.assign(new CreateEquipmentVersionDto(), data);

  it('aceita nova versão com data de vigência obrigatória', async () => {
    const errors = await validate(
      dto({ effectiveFrom: '2026-10-01', externalRentalMonthly: '19000.00' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita nova versão sem data de vigência', async () => {
    const errors = await validate(dto({ externalRentalMonthly: '19000.00' }));
    expect(errors.some((e) => e.property === 'effectiveFrom')).toBe(true);
  });
});
