import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { StructureSeriesService } from './structure-series.service';

const uniqueViolation = () =>
  Object.assign(new Error('unique'), { code: 'P2002' });

// Linha completa de versão como o Prisma devolve (o service mapeia para o
// contrato da domain, então os mocks precisam dos campos de autoria/datas)
const versionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  designer: null,
  voltageKv: null,
  circuitCount: null,
  cablesPerPhase: null,
  designWindSpeedMs: null,
  insulatorType: null,
  silMw: null,
  effectiveFrom: new Date('2026-01-01'),
  createdBy: 'ana',
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  ...overrides,
});

describe('StructureSeriesService', () => {
  const today = new Date('2026-08-24T00:00:00.000Z');

  const prismaMock = {
    structureSeries: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    structureSeriesVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: StructureSeriesService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        StructureSeriesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(StructureSeriesService);
  });

  describe('create', () => {
    it('cria série com primeira versão e todos os atributos', async () => {
      prismaMock.structureSeries.create.mockResolvedValue({
        id: 1,
        name: 'Raptor 500',
        versions: [versionRow({ designer: 'SAE Towers', circuitCount: 2 })],
      });

      await service.create(
        {
          name: 'Raptor 500',
          designer: 'SAE Towers',
          voltageKv: '500',
          circuitCount: 2,
          cablesPerPhase: 4,
        },
        'ana',
        today,
      );

      const data = prismaMock.structureSeries.create.mock.calls[0][0].data;
      expect(data.name).toBe('Raptor 500');
      expect(data.versions.create.designer).toBe('SAE Towers');
      expect(data.versions.create.circuitCount).toBe(2);
      expect(data.versions.create.silMw).toBeNull();
      expect(data.versions.create.effectiveFrom).toEqual(today);
      expect(data.versions.create.createdBy).toBe('ana');
    });

    it('devolve o resumo com zero tipos de torre para série recém-criada', async () => {
      prismaMock.structureSeries.create.mockResolvedValue({
        id: 1,
        name: 'Raptor 500',
        versions: [versionRow()],
      });

      const result = await service.create({ name: 'Raptor 500' }, 'ana', today);

      expect(result.towerTypeCount).toBe(0);
    });

    it('mapeia nome duplicado para conflito (409)', async () => {
      prismaMock.structureSeries.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.create({ name: 'Raptor 500' }, 'ana', today),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita data de vigência de calendário inválida sem gravar', async () => {
      await expect(
        service.create(
          { name: 'Raptor 500', effectiveFrom: '2026-02-30' },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.structureSeries.create).not.toHaveBeenCalled();
    });

    it('converte Decimal do banco para string no contrato de retorno', async () => {
      prismaMock.structureSeries.create.mockResolvedValue({
        id: 1,
        name: 'Raptor 500',
        versions: [versionRow({ silMw: new Prisma.Decimal('1150.5') })],
      });

      const result = await service.create({ name: 'Raptor 500' }, 'ana', today);

      expect(result.effectiveVersion?.silMw).toBe('1150.5');
      expect(typeof result.effectiveVersion?.silMw).toBe('string');
    });
  });

  describe('createVersion', () => {
    it('cria nova versão sem alterar as existentes', async () => {
      prismaMock.structureSeries.findUnique.mockResolvedValue({
        id: 1,
        name: 'Raptor 500',
        versions: [versionRow()],
        _count: { towerTypes: 0 },
      });
      prismaMock.structureSeriesVersion.create.mockResolvedValue(
        versionRow({ id: 2, effectiveFrom: new Date('2026-10-01') }),
      );

      await service.createVersion(
        1,
        { effectiveFrom: '2026-10-01', designer: 'Sediver' },
        'bruno',
      );

      expect(prismaMock.structureSeriesVersion.create).toHaveBeenCalled();
      expect(prismaMock.structureSeriesVersion.update).not.toHaveBeenCalled();
    });

    it('rejeita segunda versão com a mesma data de vigência (unicidade do banco)', async () => {
      prismaMock.structureSeries.findUnique.mockResolvedValue({
        id: 1,
        versions: [],
        _count: { towerTypes: 0 },
      });
      prismaMock.structureSeriesVersion.create.mockRejectedValue(
        uniqueViolation(),
      );

      await expect(
        service.createVersion(1, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(ConflictException);
    });

    it('falha com série inexistente', async () => {
      prismaMock.structureSeries.findUnique.mockResolvedValue(null);

      await expect(
        service.createVersion(99, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('repassa o termo de busca para os filtros de nome e projetista', async () => {
      prismaMock.structureSeries.findMany.mockResolvedValue([]);

      await service.list('Raptor', today);

      const where = prismaMock.structureSeries.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { name: { contains: 'Raptor', mode: 'insensitive' } },
        {
          versions: {
            some: { designer: { contains: 'Raptor', mode: 'insensitive' } },
          },
        },
      ]);
    });

    it('inclui a quantidade de tipos de torre de cada série', async () => {
      prismaMock.structureSeries.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Raptor 500',
          versions: [versionRow()],
          _count: { towerTypes: 3 },
        },
      ]);

      const [item] = await service.list(undefined, today);

      expect(item.towerTypeCount).toBe(3);
    });

    it('sinaliza pendências com rótulos pt-BR (série sem SIL)', async () => {
      prismaMock.structureSeries.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Raptor 500',
          versions: [
            versionRow({
              designer: 'SAE Towers',
              voltageKv: '500',
              circuitCount: 2,
              cablesPerPhase: 4,
              designWindSpeedMs: '25',
              insulatorType: 'vidro temperado',
              silMw: null,
            }),
          ],
          _count: { towerTypes: 0 },
        },
      ]);

      const [item] = await service.list(undefined, today);

      expect(item.pendingFields).toEqual(['SIL (MW)']);
    });
  });

  describe('get', () => {
    it('retorna a versão vigente na data de referência passada', async () => {
      prismaMock.structureSeries.findUnique.mockResolvedValue({
        id: 1,
        name: 'Raptor 500',
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            designer: 'SAE Towers',
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            designer: 'Sediver',
          }),
        ],
        _count: { towerTypes: 2 },
      });

      const result = await service.get(1, new Date('2026-03-15'));

      expect(result.effectiveVersion?.designer).toBe('SAE Towers');
    });

    it('responde que não há versão vigente para data anterior à primeira', async () => {
      prismaMock.structureSeries.findUnique.mockResolvedValue({
        id: 1,
        name: 'Raptor 500',
        versions: [versionRow()],
        _count: { towerTypes: 0 },
      });

      await expect(service.get(1, new Date('2025-06-01'))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listHistory', () => {
    it('ordena as versões da vigência mais recente para a mais antiga', async () => {
      prismaMock.structureSeries.findUnique.mockResolvedValue({
        id: 1,
        name: 'Raptor 500',
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
        _count: { towerTypes: 0 },
      });

      const history = await service.listHistory(1);

      expect(history.versions.map((v) => v.createdBy)).toEqual([
        'bruno',
        'ana',
      ]);
    });
  });
});
