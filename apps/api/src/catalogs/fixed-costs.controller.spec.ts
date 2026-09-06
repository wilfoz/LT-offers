import { MethodNotAllowedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { CreateFixedCostDto } from './dto/create-fixed-cost.dto';
import { CreateFixedCostVersionDto } from './dto/create-fixed-cost-version.dto';
import { FixedCostsController } from './fixed-costs.controller';
import { FixedCostsService } from './fixed-costs.service';

describe('FixedCostsController', () => {
  const serviceMock = {
    create: jest.fn(),
    createVersion: jest.fn(),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn(),
    listHistory: jest.fn(),
  };

  let controller: FixedCostsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [FixedCostsController],
      providers: [{ provide: FixedCostsService, useValue: serviceMock }],
    }).compile();
    controller = moduleRef.get(FixedCostsController);
  });

  it('usa "sistema" como autor quando o cabeçalho X-User está ausente', async () => {
    await controller.create({ code: 'EPI01', description: 'Capacete', category: 'EPI' } as CreateFixedCostDto);
    expect(serviceMock.create.mock.calls[0][1]).toBe('sistema');
  });

  it('repassa busca, categoria e data de referência para o serviço', () => {
    controller.list('CAPACETE', 'EPI', '2026-03-15');
    expect(serviceMock.list.mock.calls[0][0]).toBe('CAPACETE');
    expect(serviceMock.list.mock.calls[0][1]).toBe('EPI');
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

describe('CreateFixedCostDto (validação)', () => {
  const dto = (data: Partial<CreateFixedCostDto>) =>
    Object.assign(new CreateFixedCostDto(), data);

  it('aceita valores monetários válidos e categoria válida', async () => {
    const errors = await validate(
      dto({
        code: 'EPI01',
        description: 'Capacete',
        category: 'EPI',
        unitCost: '45.00',
        unit: 'unid',
      }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita código ausente', async () => {
    const errors = await validate(dto({ description: 'Capacete', category: 'EPI' }));
    expect(errors.some((e) => e.property === 'code')).toBe(true);
  });

  it('rejeita categoria inválida', async () => {
    const errors = await validate(
      dto({ code: 'EPI01', description: 'Capacete', category: 'INVALIDA' as unknown as FixedCostCategory }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(
      messages.some((m) => m.includes('categoria deve ser uma das opções válidas')),
    ).toBe(true);
  });

  it('rejeita casas decimais além da precisão', async () => {
    const errors = await validate(
      dto({
        code: 'EPI01',
        description: 'Capacete',
        category: 'EPI',
        unitCost: '45.555',
      }),
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(
      messages.some(
        (m) => m.includes('custo unitário (R$)') && m.includes('2 casas'),
      ),
    ).toBe(true);
  });
});

describe('CreateFixedCostVersionDto (validação)', () => {
  const dto = (data: Partial<CreateFixedCostVersionDto>) =>
    Object.assign(new CreateFixedCostVersionDto(), data);

  it('aceita nova versão com data de vigência obrigatória', async () => {
    const errors = await validate(
      dto({ effectiveFrom: '2026-10-01', unitCost: '50.00' }),
    );
    expect(errors).toHaveLength(0);
  });

  it('rejeita nova versão sem data de vigência', async () => {
    const errors = await validate(dto({ unitCost: '50.00' }));
    expect(errors.some((e) => e.property === 'effectiveFrom')).toBe(true);
  });
});
