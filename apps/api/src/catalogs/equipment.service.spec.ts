import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { EquipmentService } from './equipment.service';

const uniqueViolation = () =>
  Object.assign(new Error('unique'), { code: 'P2002' });

const versionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  externalRentalMonthly: null,
  internalRentalMonthly: null,
  purchasePrice: null,
  depreciationYears: null,
  ownedAvailabilityCount: null,
  fuelMaintenanceMonthly: null,
  effectiveFrom: new Date('2026-01-01'),
  createdBy: 'ana',
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  ...overrides,
});

describe('EquipmentService', () => {
  const today = new Date('2026-08-24T00:00:00.000Z');

  const prismaMock = {
    equipment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    equipmentVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: EquipmentService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        EquipmentService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(EquipmentService);
  });

  describe('create', () => {
    it('cria equipamento com primeira versão e todos os atributos', async () => {
      prismaMock.equipment.create.mockResolvedValue({
        id: 1,
        code: 'TRAT01',
        description: 'Trator de Esteiras',
        category: 'TERRAPLANAGEM',
        versions: [
          versionRow({ externalRentalMonthly: new Prisma.Decimal('18000.00') }),
        ],
      });

      await service.create(
        {
          code: 'TRAT01',
          description: 'Trator de Esteiras',
          category: 'TERRAPLANAGEM',
          externalRentalMonthly: '18000.00',
          internalRentalMonthly: '15000.00',
          depreciationYears: 5,
          ownedAvailabilityCount: 2,
        },
        'ana',
        today,
      );

      const data = prismaMock.equipment.create.mock.calls[0][0].data;
      expect(data.code).toBe('TRAT01');
      expect(data.description).toBe('Trator de Esteiras');
      expect(data.category).toBe('TERRAPLANAGEM');
      expect(data.versions.create.externalRentalMonthly).toBe('18000.00');
      expect(data.versions.create.depreciationYears).toBe(5);
      expect(data.versions.create.ownedAvailabilityCount).toBe(2);
      expect(data.versions.create.effectiveFrom).toEqual(today);
      expect(data.versions.create.createdBy).toBe('ana');
    });

    it('mapeia código duplicado para conflito (409)', async () => {
      prismaMock.equipment.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.create({ code: 'TRAT01', description: 'Trator' }, 'ana', today),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita data de vigência de calendário inválida sem gravar', async () => {
      await expect(
        service.create(
          {
            code: 'TRAT01',
            description: 'Trator',
            effectiveFrom: '2026-02-30',
          },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.equipment.create).not.toHaveBeenCalled();
    });

    it('converte Decimal do banco para string no contrato de retorno', async () => {
      prismaMock.equipment.create.mockResolvedValue({
        id: 1,
        code: 'TRAT01',
        description: 'Trator',
        category: null,
        versions: [
          versionRow({ externalRentalMonthly: new Prisma.Decimal('18000.50') }),
        ],
      });

      const result = await service.create(
        { code: 'TRAT01', description: 'Trator' },
        'ana',
        today,
      );

      expect(result.effectiveVersion?.externalRentalMonthly).toBe('18000.5');
      expect(typeof result.effectiveVersion?.externalRentalMonthly).toBe(
        'string',
      );
    });
  });

  describe('createVersion', () => {
    it('cria nova versão sem alterar as existentes', async () => {
      prismaMock.equipment.findUnique.mockResolvedValue({
        id: 1,
        code: 'TRAT01',
        description: 'Trator',
        versions: [versionRow()],
      });
      prismaMock.equipmentVersion.create.mockResolvedValue(
        versionRow({ id: 2, effectiveFrom: new Date('2026-10-01') }),
      );

      await service.createVersion(
        1,
        { effectiveFrom: '2026-10-01', externalRentalMonthly: '20000.00' },
        'bruno',
      );

      expect(prismaMock.equipmentVersion.create).toHaveBeenCalled();
      expect(prismaMock.equipmentVersion.update).not.toHaveBeenCalled();
    });

    it('rejeita segunda versão com a mesma data de vigência', async () => {
      prismaMock.equipment.findUnique.mockResolvedValue({
        id: 1,
        versions: [],
      });
      prismaMock.equipmentVersion.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.createVersion(1, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(ConflictException);
    });

    it('falha com item inexistente', async () => {
      prismaMock.equipment.findUnique.mockResolvedValue(null);

      await expect(
        service.createVersion(99, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('repassa busca e filtro por categoria', async () => {
      prismaMock.equipment.findMany.mockResolvedValue([]);

      await service.list('TRAT', 'TRANSPORTE', today);

      const where = prismaMock.equipment.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { code: { contains: 'TRAT', mode: 'insensitive' } },
        { description: { contains: 'TRAT', mode: 'insensitive' } },
      ]);
      expect(where.category).toEqual({
        equals: 'TRANSPORTE',
        mode: 'insensitive',
      });
    });

    it('sinaliza pendência quando nenhuma estratégia de custo for informada', async () => {
      prismaMock.equipment.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'TRAT01',
          description: 'Trator',
          category: null,
          versions: [versionRow()],
        },
      ]);

      const [item] = await service.list(undefined, undefined, today);

      expect(item.pendingFields).toEqual([
        'nenhuma estratégia de custo informada',
      ]);
    });

    it('não sinaliza pendência se houver locação externa informada', async () => {
      prismaMock.equipment.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'TRAT01',
          description: 'Trator',
          category: null,
          versions: [
            versionRow({
              externalRentalMonthly: new Prisma.Decimal('18000.00'),
            }),
          ],
        },
      ]);

      const [item] = await service.list(undefined, undefined, today);

      expect(item.pendingFields).toEqual([]);
    });
  });

  describe('get', () => {
    it('retorna a versão vigente na data de referência passada', async () => {
      prismaMock.equipment.findUnique.mockResolvedValue({
        id: 1,
        code: 'TRAT01',
        description: 'Trator',
        category: null,
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            externalRentalMonthly: new Prisma.Decimal('15000.00'),
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            externalRentalMonthly: new Prisma.Decimal('18000.00'),
          }),
        ],
      });

      const result = await service.get(1, new Date('2026-03-15'));

      expect(result.effectiveVersion?.externalRentalMonthly).toBe('15000');
    });
  });
});
