import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { WorkCrewsService } from './work-crews.service';

const uniqueViolation = () =>
  Object.assign(new Error('unique'), { code: 'P2002' });

const versionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  standardProductionRate: null,
  productionUnit: null,
  productionPeriod: null,
  effectiveFrom: new Date('2026-01-01'),
  createdBy: 'ana',
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  laborRoles: [],
  equipments: [],
  ...overrides,
});

describe('WorkCrewsService', () => {
  const today = new Date('2026-09-07T00:00:00.000Z');

  const prismaMock = {
    workCrew: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    workCrewVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
    laborRole: {
      findMany: jest.fn(),
    },
    equipment: {
      findMany: jest.fn(),
    },
  };

  let service: WorkCrewsService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkCrewsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(WorkCrewsService);
  });

  describe('create', () => {
    it('cria equipe com primeira versão, produções e composições de mão de obra e equipamentos', async () => {
      prismaMock.laborRole.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      prismaMock.equipment.findMany.mockResolvedValue([{ id: 10 }]);

      prismaMock.workCrew.create.mockResolvedValue({
        id: 1,
        code: 'EQ-CIV-01',
        name: 'Equipe de Escavação',
        versions: [
          versionRow({
            standardProductionRate: new Prisma.Decimal('15.5000'),
            productionUnit: 'm3',
            productionPeriod: 'DAY',
            laborRoles: [
              {
                laborRoleId: 1,
                quantity: new Prisma.Decimal('1.00'),
                laborRole: { id: 1, code: 'ENC01', name: 'Encarregado' },
              },
              {
                laborRoleId: 2,
                quantity: new Prisma.Decimal('4.00'),
                laborRole: { id: 2, code: 'AJUD01', name: 'Ajudante' },
              },
            ],
            equipments: [
              {
                equipmentId: 10,
                quantity: new Prisma.Decimal('1.00'),
                equipment: {
                  id: 10,
                  code: 'ESC01',
                  description: 'Escavadeira',
                },
              },
            ],
          }),
        ],
      });

      const result = await service.create(
        {
          code: 'EQ-CIV-01',
          name: 'Equipe de Escavação',
          standardProductionRate: '15.5000',
          productionUnit: 'm3',
          productionPeriod: 'DAY',
          laborRoles: [
            { laborRoleId: 1, quantity: '1.00' },
            { laborRoleId: 2, quantity: '4.00' },
          ],
          equipments: [{ equipmentId: 10, quantity: '1.00' }],
        },
        'ana',
        today,
      );

      const data = prismaMock.workCrew.create.mock.calls[0][0].data;
      expect(data.code).toBe('EQ-CIV-01');
      expect(data.name).toBe('Equipe de Escavação');
      expect(data.versions.create.standardProductionRate).toBe('15.5000');
      expect(data.versions.create.productionUnit).toBe('m3');
      expect(data.versions.create.productionPeriod).toBe('DAY');
      expect(data.versions.create.effectiveFrom).toEqual(today);
      expect(data.versions.create.createdBy).toBe('ana');
      expect(data.versions.create.laborRoles.create).toEqual([
        { laborRoleId: 1, quantity: '1.00' },
        { laborRoleId: 2, quantity: '4.00' },
      ]);
      expect(data.versions.create.equipments.create).toEqual([
        { equipmentId: 10, quantity: '1.00' },
      ]);

      expect(result.laborRoleCount).toBe(2);
      expect(result.equipmentCount).toBe(1);
      expect(result.effectiveVersion?.laborRoles[0].laborRoleCode).toBe('ENC01');
    });

    it('rejeita cargo de mão de obra inexistente na composição', async () => {
      prismaMock.laborRole.findMany.mockResolvedValue([]);

      await expect(
        service.create(
          {
            code: 'EQ-CIV-01',
            name: 'Equipe de Escavação',
            laborRoles: [{ laborRoleId: 99, quantity: '1.00' }],
          },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.workCrew.create).not.toHaveBeenCalled();
    });

    it('rejeita equipamento inexistente na composição', async () => {
      prismaMock.equipment.findMany.mockResolvedValue([]);

      await expect(
        service.create(
          {
            code: 'EQ-CIV-01',
            name: 'Equipe de Escavação',
            equipments: [{ equipmentId: 99, quantity: '1.00' }],
          },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.workCrew.create).not.toHaveBeenCalled();
    });

    it('mapeia código duplicado para conflito (409)', async () => {
      prismaMock.workCrew.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.create(
          { code: 'EQ-CIV-01', name: 'Equipe de Escavação' },
          'ana',
          today,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita data de vigência de calendário inválida sem gravar', async () => {
      await expect(
        service.create(
          {
            code: 'EQ-CIV-01',
            name: 'Equipe de Escavação',
            effectiveFrom: '2026-02-30',
          },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.workCrew.create).not.toHaveBeenCalled();
    });
  });

  describe('createVersion', () => {
    it('cria nova versão com nova composição sem alterar as existentes', async () => {
      prismaMock.workCrew.findUnique.mockResolvedValue({
        id: 1,
        code: 'EQ-CIV-01',
        name: 'Equipe',
        versions: [versionRow()],
      });
      prismaMock.laborRole.findMany.mockResolvedValue([{ id: 1 }]);
      prismaMock.equipment.findMany.mockResolvedValue([{ id: 10 }]);

      prismaMock.workCrewVersion.create.mockResolvedValue(
        versionRow({
          id: 2,
          effectiveFrom: new Date('2026-10-01'),
          laborRoles: [
            {
              laborRoleId: 1,
              quantity: new Prisma.Decimal('2.00'),
              laborRole: { id: 1, code: 'ENC01', name: 'Encarregado' },
            },
          ],
          equipments: [
            {
              equipmentId: 10,
              quantity: new Prisma.Decimal('1.00'),
              equipment: { id: 10, code: 'ESC01', description: 'Escavadeira' },
            },
          ],
        }),
      );

      const version = await service.createVersion(
        1,
        {
          effectiveFrom: '2026-10-01',
          standardProductionRate: '20.0000',
          laborRoles: [{ laborRoleId: 1, quantity: '2.00' }],
          equipments: [{ equipmentId: 10, quantity: '1.00' }],
        },
        'bruno',
      );

      expect(prismaMock.workCrewVersion.create).toHaveBeenCalled();
      expect(prismaMock.workCrewVersion.update).not.toHaveBeenCalled();
      expect(version.laborRoles[0].quantity).toBe('2');
    });

    it('rejeita segunda versão com a mesma data de vigência', async () => {
      prismaMock.workCrew.findUnique.mockResolvedValue({
        id: 1,
        versions: [],
      });
      prismaMock.workCrewVersion.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.createVersion(1, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(ConflictException);
    });

    it('falha com equipe inexistente', async () => {
      prismaMock.workCrew.findUnique.mockResolvedValue(null);

      await expect(
        service.createVersion(99, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('repassa o termo de busca para código e nome', async () => {
      prismaMock.workCrew.findMany.mockResolvedValue([]);

      await service.list('CIV', today);

      const where = prismaMock.workCrew.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { code: { contains: 'CIV', mode: 'insensitive' } },
        { name: { contains: 'CIV', mode: 'insensitive' } },
      ]);
    });

    it('sinaliza pendências de composição e de taxa de produção ausentes', async () => {
      prismaMock.workCrew.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'EQ-CIV-01',
          name: 'Equipe',
          versions: [
            versionRow({
              standardProductionRate: null,
              laborRoles: [],
              equipments: [],
            }),
          ],
        },
      ]);

      const [item] = await service.list(undefined, today);

      expect(item.pendingFields).toContain('taxa de produção');
      expect(item.pendingFields).toContain('composição de equipe');
    });
  });

  describe('get', () => {
    it('retorna a versão vigente na data de referência', async () => {
      prismaMock.workCrew.findUnique.mockResolvedValue({
        id: 1,
        code: 'EQ-CIV-01',
        name: 'Equipe',
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            standardProductionRate: new Prisma.Decimal('10.0000'),
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            standardProductionRate: new Prisma.Decimal('15.0000'),
          }),
        ],
      });

      const result = await service.get(1, new Date('2026-03-15'));

      expect(result.effectiveVersion?.standardProductionRate).toBe('10');
    });

    it('responde que não há versão vigente para data anterior à primeira', async () => {
      prismaMock.workCrew.findUnique.mockResolvedValue({
        id: 1,
        code: 'EQ-CIV-01',
        name: 'Equipe',
        versions: [versionRow()],
      });

      await expect(service.get(1, new Date('2025-06-01'))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listHistory', () => {
    it('ordena as versões da vigência mais recente para a mais antiga', async () => {
      prismaMock.workCrew.findUnique.mockResolvedValue({
        id: 1,
        code: 'EQ-CIV-01',
        name: 'Equipe',
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            createdBy: 'ana',
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            createdBy: 'bruno',
          }),
        ],
      });

      const history = await service.listHistory(1);

      expect(history.versions.map((v) => v.createdBy)).toEqual([
        'bruno',
        'ana',
      ]);
    });
  });
});
