import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { TowerTypesService } from './tower-types.service';

const uniqueViolation = () =>
  Object.assign(new Error('unique'), { code: 'P2002' });

// Linha completa de versão como o Prisma devolve, com a tabela peso × altura
// carregada junto (o service mapeia para o contrato da domain)
const versionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  guyCount: null,
  weights: [],
  effectiveFrom: new Date('2026-01-01'),
  createdBy: 'ana',
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  ...overrides,
});

const weightRow = (heightM: string, weightKg: string) => ({
  id: 1,
  heightM: new Prisma.Decimal(heightM),
  weightKg: new Prisma.Decimal(weightKg),
});

describe('TowerTypesService', () => {
  const today = new Date('2026-08-24T00:00:00.000Z');

  const prismaMock = {
    structureSeries: {
      findUnique: jest.fn(),
    },
    towerType: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    towerTypeVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: TowerTypesService;

  beforeEach(async () => {
    jest.resetAllMocks();
    prismaMock.structureSeries.findUnique.mockResolvedValue({
      id: 5,
      name: 'Raptor 500',
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        TowerTypesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(TowerTypesService);
  });

  describe('create', () => {
    it('cria tipo de torre na série com primeira versão e tabela de pesos', async () => {
      prismaMock.towerType.create.mockResolvedValue({
        id: 1,
        code: 'SA1',
        function: 'SUSPENSION',
        versions: [versionRow({ guyCount: 0 })],
      });

      await service.create(
        5,
        {
          code: 'SA1',
          function: 'SUSPENSION',
          guyCount: 0,
          weights: [
            { heightM: '24', weightKg: '5200.5' },
            { heightM: '27', weightKg: '5800' },
          ],
        },
        'ana',
        today,
      );

      const data = prismaMock.towerType.create.mock.calls[0][0].data;
      expect(data.structureSeriesId).toBe(5);
      expect(data.code).toBe('SA1');
      expect(data.function).toBe('SUSPENSION');
      expect(data.versions.create.guyCount).toBe(0);
      expect(data.versions.create.weights.create).toHaveLength(2);
      expect(data.versions.create.effectiveFrom).toEqual(today);
      expect(data.versions.create.createdBy).toBe('ana');
    });

    it('grava a criação sempre no contexto da série informada (sigla única por série)', async () => {
      prismaMock.towerType.create.mockResolvedValue({
        id: 2,
        code: 'SA1',
        function: 'ANCHOR',
        versions: [versionRow()],
      });

      await service.create(
        7,
        { code: 'SA1', function: 'ANCHOR' },
        'ana',
        today,
      );

      expect(
        prismaMock.towerType.create.mock.calls[0][0].data.structureSeriesId,
      ).toBe(7);
    });

    it('mapeia sigla duplicada na série para conflito (409)', async () => {
      prismaMock.towerType.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.create(
          5,
          { code: 'SA1', function: 'SUSPENSION' },
          'ana',
          today,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('falha com série inexistente sem gravar', async () => {
      prismaMock.structureSeries.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          99,
          { code: 'SA1', function: 'SUSPENSION' },
          'ana',
          today,
        ),
      ).rejects.toThrow(NotFoundException);
      expect(prismaMock.towerType.create).not.toHaveBeenCalled();
    });

    it('rejeita data de vigência de calendário inválida sem gravar', async () => {
      await expect(
        service.create(
          5,
          { code: 'SA1', function: 'SUSPENSION', effectiveFrom: '2026-02-30' },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.towerType.create).not.toHaveBeenCalled();
    });

    it('converte os pesos Decimal do banco para string ordenados no contrato', async () => {
      prismaMock.towerType.create.mockResolvedValue({
        id: 1,
        code: 'SA1',
        function: 'SUSPENSION',
        versions: [
          versionRow({
            weights: [weightRow('24', '5200.5'), weightRow('27', '5800')],
          }),
        ],
      });

      const result = await service.create(
        5,
        { code: 'SA1', function: 'SUSPENSION' },
        'ana',
        today,
      );

      expect(result.effectiveVersion?.weights).toEqual([
        { heightM: '24', weightKg: '5200.5' },
        { heightM: '27', weightKg: '5800' },
      ]);
    });
  });

  describe('createVersion', () => {
    it('cria nova versão com a tabela completa sem alterar as versões existentes', async () => {
      prismaMock.towerType.findFirst.mockResolvedValue({
        id: 1,
        code: 'SA1',
        function: 'SUSPENSION',
        versions: [versionRow({ weights: [weightRow('24', '5200.5')] })],
      });
      prismaMock.towerTypeVersion.create.mockResolvedValue(
        versionRow({
          id: 2,
          effectiveFrom: new Date('2026-10-01'),
          weights: [weightRow('24', '5300')],
        }),
      );

      await service.createVersion(
        5,
        1,
        {
          effectiveFrom: '2026-10-01',
          weights: [{ heightM: '24', weightKg: '5300' }],
        },
        'bruno',
      );

      const data = prismaMock.towerTypeVersion.create.mock.calls[0][0].data;
      expect(data.towerTypeId).toBe(1);
      expect(data.weights.create).toEqual([
        { heightM: '24', weightKg: '5300' },
      ]);
      expect(prismaMock.towerTypeVersion.update).not.toHaveBeenCalled();
    });

    it('rejeita segunda versão com a mesma data de vigência (unicidade do banco)', async () => {
      prismaMock.towerType.findFirst.mockResolvedValue({
        id: 1,
        code: 'SA1',
        function: 'SUSPENSION',
        versions: [],
      });
      prismaMock.towerTypeVersion.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.createVersion(5, 1, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(ConflictException);
    });

    it('responde 404 para tipo que não pertence à série informada', async () => {
      prismaMock.towerType.findFirst.mockResolvedValue(null);

      await expect(
        service.createVersion(5, 42, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(NotFoundException);
      const where = prismaMock.towerType.findFirst.mock.calls[0][0].where;
      expect(where).toEqual({ id: 42, structureSeriesId: 5 });
    });
  });

  describe('list', () => {
    it('lista somente os tipos da série, ordenados por sigla', async () => {
      prismaMock.towerType.findMany.mockResolvedValue([]);

      await service.list(5, today);

      const args = prismaMock.towerType.findMany.mock.calls[0][0];
      expect(args.where).toEqual({ structureSeriesId: 5 });
      expect(args.orderBy).toEqual({ code: 'asc' });
    });

    it('falha com série inexistente', async () => {
      prismaMock.structureSeries.findUnique.mockResolvedValue(null);

      await expect(service.list(99, today)).rejects.toThrow(NotFoundException);
    });

    it('não sinaliza pendência para zero estais com tabela preenchida', async () => {
      prismaMock.towerType.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'SA1',
          function: 'SUSPENSION',
          versions: [
            versionRow({ guyCount: 0, weights: [weightRow('24', '5200.5')] }),
          ],
        },
      ]);

      const [item] = await service.list(5, today);

      expect(item.pendingFields).toEqual([]);
    });

    it('sinaliza estais não informados e tabela peso × altura vazia', async () => {
      prismaMock.towerType.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'SA1',
          function: 'SUSPENSION',
          versions: [versionRow({ guyCount: null, weights: [] })],
        },
      ]);

      const [item] = await service.list(5, today);

      expect(item.pendingFields).toEqual([
        'quantidade de estais',
        'tabela peso × altura',
      ]);
    });
  });

  describe('get', () => {
    it('retorna a versão vigente na data de referência passada', async () => {
      prismaMock.towerType.findFirst.mockResolvedValue({
        id: 1,
        code: 'SA1',
        function: 'SUSPENSION',
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            guyCount: 4,
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            guyCount: 6,
          }),
        ],
      });

      const result = await service.get(5, 1, new Date('2026-03-15'));

      expect(result.effectiveVersion?.guyCount).toBe(4);
    });

    it('responde que não há versão vigente para data anterior à primeira', async () => {
      prismaMock.towerType.findFirst.mockResolvedValue({
        id: 1,
        code: 'SA1',
        function: 'SUSPENSION',
        versions: [versionRow()],
      });

      await expect(service.get(5, 1, new Date('2025-06-01'))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listHistory', () => {
    it('preserva a tabela de cada versão: a anterior mantém os pontos da época', async () => {
      prismaMock.towerType.findFirst.mockResolvedValue({
        id: 1,
        code: 'SA1',
        function: 'SUSPENSION',
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            createdBy: 'ana',
            weights: [weightRow('24', '5200.5')],
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            createdBy: 'bruno',
            weights: [weightRow('24', '5300'), weightRow('27', '5900')],
          }),
        ],
      });

      const history = await service.listHistory(5, 1);

      expect(history.versions.map((v) => v.createdBy)).toEqual([
        'bruno',
        'ana',
      ]);
      expect(history.versions[1].weights).toEqual([
        { heightM: '24', weightKg: '5200.5' },
      ]);
      expect(history.versions[0].weights).toHaveLength(2);
    });
  });
});
