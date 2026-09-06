import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { FixedCostsService } from './fixed-costs.service';

const uniqueViolation = () =>
  Object.assign(new Error('unique'), { code: 'P2002' });

const versionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  unitCost: null,
  unit: null,
  effectiveFrom: new Date('2026-01-01'),
  createdBy: 'ana',
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  ...overrides,
});

describe('FixedCostsService', () => {
  const today = new Date('2026-08-24T00:00:00.000Z');

  const prismaMock = {
    fixedCost: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    fixedCostVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: FixedCostsService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        FixedCostsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(FixedCostsService);
  });

  describe('create', () => {
    it('cria item de custo fixo com primeira versão e todos os atributos', async () => {
      prismaMock.fixedCost.create.mockResolvedValue({
        id: 1,
        code: 'EPI01',
        description: 'Capacete com jugular',
        category: 'EPI',
        versions: [versionRow({ unitCost: new Prisma.Decimal('45.00'), unit: 'unid' })],
      });

      await service.create(
        {
          code: 'EPI01',
          description: 'Capacete com jugular',
          category: 'EPI',
          unitCost: '45.00',
          unit: 'unid',
        },
        'ana',
        today,
      );

      const data = prismaMock.fixedCost.create.mock.calls[0][0].data;
      expect(data.code).toBe('EPI01');
      expect(data.description).toBe('Capacete com jugular');
      expect(data.category).toBe('EPI');
      expect(data.versions.create.unitCost).toBe('45.00');
      expect(data.versions.create.unit).toBe('unid');
      expect(data.versions.create.effectiveFrom).toEqual(today);
      expect(data.versions.create.createdBy).toBe('ana');
    });

    it('mapeia código duplicado para conflito (409)', async () => {
      prismaMock.fixedCost.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.create(
          { code: 'EPI01', description: 'Capacete', category: 'EPI' },
          'ana',
          today,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita data de vigência de calendário inválida sem gravar', async () => {
      await expect(
        service.create(
          {
            code: 'EPI01',
            description: 'Capacete',
            category: 'EPI',
            effectiveFrom: '2026-02-30',
          },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.fixedCost.create).not.toHaveBeenCalled();
    });

    it('converte Decimal do banco para string no contrato de retorno', async () => {
      prismaMock.fixedCost.create.mockResolvedValue({
        id: 1,
        code: 'EPI01',
        description: 'Capacete',
        category: 'EPI',
        versions: [
          versionRow({ unitCost: new Prisma.Decimal('45.50') }),
        ],
      });

      const result = await service.create(
        { code: 'EPI01', description: 'Capacete', category: 'EPI' },
        'ana',
        today,
      );

      expect(result.effectiveVersion?.unitCost).toBe('45.5');
      expect(typeof result.effectiveVersion?.unitCost).toBe('string');
    });
  });

  describe('createVersion', () => {
    it('cria nova versão sem alterar as existentes', async () => {
      prismaMock.fixedCost.findUnique.mockResolvedValue({
        id: 1,
        code: 'EPI01',
        description: 'Capacete',
        category: 'EPI',
        versions: [versionRow()],
      });
      prismaMock.fixedCostVersion.create.mockResolvedValue(
        versionRow({ id: 2, effectiveFrom: new Date('2026-10-01') }),
      );

      await service.createVersion(
        1,
        { effectiveFrom: '2026-10-01', unitCost: '50.00' },
        'bruno',
      );

      expect(prismaMock.fixedCostVersion.create).toHaveBeenCalled();
      expect(prismaMock.fixedCostVersion.update).not.toHaveBeenCalled();
    });

    it('rejeita segunda versão com a mesma data de vigência', async () => {
      prismaMock.fixedCost.findUnique.mockResolvedValue({
        id: 1,
        versions: [],
      });
      prismaMock.fixedCostVersion.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.createVersion(1, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(ConflictException);
    });

    it('falha com item inexistente', async () => {
      prismaMock.fixedCost.findUnique.mockResolvedValue(null);

      await expect(
        service.createVersion(99, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('repassa busca e filtro por categoria', async () => {
      prismaMock.fixedCost.findMany.mockResolvedValue([]);

      await service.list('CAPACETE', 'EPI', today);

      const where = prismaMock.fixedCost.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { code: { contains: 'CAPACETE', mode: 'insensitive' } },
        { description: { contains: 'CAPACETE', mode: 'insensitive' } },
      ]);
      expect(where.category).toEqual({ equals: 'EPI' });
    });

    it('sinaliza pendências com rótulos pt-BR', async () => {
      prismaMock.fixedCost.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'EPI01',
          description: 'Capacete',
          category: 'EPI',
          versions: [versionRow({ unitCost: null, unit: 'unid' })],
        },
      ]);

      const [item] = await service.list(undefined, undefined, today);

      expect(item.pendingFields).toEqual(['custo unitário (R$)']);
    });
  });

  describe('get', () => {
    it('retorna a versão vigente na data de referência passada', async () => {
      prismaMock.fixedCost.findUnique.mockResolvedValue({
        id: 1,
        code: 'EPI01',
        description: 'Capacete',
        category: 'EPI',
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            unitCost: new Prisma.Decimal('40.00'),
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            unitCost: new Prisma.Decimal('45.00'),
          }),
        ],
      });

      const result = await service.get(1, new Date('2026-03-15'));

      expect(result.effectiveVersion?.unitCost).toBe('40');
    });
  });
});
