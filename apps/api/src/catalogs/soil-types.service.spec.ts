import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { SoilTypesService } from './soil-types.service';

const uniqueViolation = () =>
  Object.assign(new Error('unique'), { code: 'P2002' });

// Linha completa de versão como o Prisma devolve (o service mapeia para o
// contrato da domain, então os mocks precisam dos campos de autoria/datas)
const versionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  description: null,
  submerged: null,
  allowableCompressionStressKgfCm2: null,
  specificWeightKgfM3: null,
  internalFrictionAngleDeg: null,
  cohesionKgCm2: null,
  nsptMin: null,
  nsptMax: null,
  effectiveFrom: new Date('2026-01-01'),
  createdBy: 'ana',
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  ...overrides,
});

describe('SoilTypesService', () => {
  const today = new Date('2026-08-25T00:00:00.000Z');

  const prismaMock = {
    soilType: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    soilTypeVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: SoilTypesService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SoilTypesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(SoilTypesService);
  });

  describe('create', () => {
    it('cria tipo de solo com primeira versão e todos os atributos', async () => {
      prismaMock.soilType.create.mockResolvedValue({
        id: 1,
        code: 'I',
        versions: [versionRow({ description: 'Duro', submerged: false })],
      });

      await service.create(
        {
          code: 'I',
          description: 'Duro',
          submerged: false,
          allowableCompressionStressKgfCm2: '3',
          specificWeightKgfM3: '1600',
          internalFrictionAngleDeg: '25',
          cohesionKgCm2: '0.3',
          nsptMin: 12,
          nsptMax: 16,
        },
        'ana',
        today,
      );

      const data = prismaMock.soilType.create.mock.calls[0][0].data;
      expect(data.code).toBe('I');
      expect(data.versions.create.description).toBe('Duro');
      expect(data.versions.create.submerged).toBe(false);
      expect(data.versions.create.nsptMin).toBe(12);
      expect(data.versions.create.nsptMax).toBe(16);
      expect(data.versions.create.effectiveFrom).toEqual(today);
      expect(data.versions.create.createdBy).toBe('ana');
    });

    it('grava faixa de NSPT não informada como null, sem converter em zero (RNF-09)', async () => {
      prismaMock.soilType.create.mockResolvedValue({
        id: 1,
        code: 'R',
        versions: [versionRow({ description: 'Rocha' })],
      });

      await service.create({ code: 'R', description: 'Rocha' }, 'ana', today);

      const created =
        prismaMock.soilType.create.mock.calls[0][0].data.versions.create;
      expect(created.nsptMin).toBeNull();
      expect(created.nsptMax).toBeNull();
      expect(created.cohesionKgCm2).toBeNull();
    });

    it('mapeia código duplicado para conflito (409)', async () => {
      prismaMock.soilType.create.mockRejectedValue(uniqueViolation());

      await expect(service.create({ code: 'I' }, 'ana', today)).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejeita data de vigência de calendário inválida sem gravar', async () => {
      await expect(
        service.create(
          { code: 'I', effectiveFrom: '2026-02-30' },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.soilType.create).not.toHaveBeenCalled();
    });

    it('converte Decimal do banco para string no contrato de retorno', async () => {
      prismaMock.soilType.create.mockResolvedValue({
        id: 1,
        code: 'I',
        versions: [
          versionRow({
            allowableCompressionStressKgfCm2: new Prisma.Decimal('3'),
            cohesionKgCm2: new Prisma.Decimal('0.3'),
          }),
        ],
      });

      const result = await service.create({ code: 'I' }, 'ana', today);

      expect(result.effectiveVersion?.allowableCompressionStressKgfCm2).toBe(
        '3',
      );
      expect(result.effectiveVersion?.cohesionKgCm2).toBe('0.3');
      expect(typeof result.effectiveVersion?.cohesionKgCm2).toBe('string');
    });
  });

  describe('createVersion', () => {
    it('cria nova versão sem alterar as existentes', async () => {
      prismaMock.soilType.findUnique.mockResolvedValue({
        id: 1,
        code: 'I',
        versions: [versionRow()],
      });
      prismaMock.soilTypeVersion.create.mockResolvedValue(
        versionRow({ id: 2, effectiveFrom: new Date('2026-10-01') }),
      );

      await service.createVersion(
        1,
        { effectiveFrom: '2026-10-01', description: 'Duro revisado' },
        'bruno',
      );

      expect(prismaMock.soilTypeVersion.create).toHaveBeenCalled();
      expect(prismaMock.soilTypeVersion.update).not.toHaveBeenCalled();
    });

    it('rejeita segunda versão com a mesma data de vigência (unicidade do banco)', async () => {
      prismaMock.soilType.findUnique.mockResolvedValue({
        id: 1,
        versions: [],
      });
      prismaMock.soilTypeVersion.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.createVersion(1, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(ConflictException);
    });

    it('falha com item inexistente', async () => {
      prismaMock.soilType.findUnique.mockResolvedValue(null);

      await expect(
        service.createVersion(99, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('repassa o termo de busca para código e descrição', async () => {
      prismaMock.soilType.findMany.mockResolvedValue([]);

      await service.list('roc', today);

      const where = prismaMock.soilType.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { code: { contains: 'roc', mode: 'insensitive' } },
        {
          versions: {
            some: { description: { contains: 'roc', mode: 'insensitive' } },
          },
        },
      ]);
    });

    it('sinaliza pendências com rótulos pt-BR, distinguindo false e zero de não informado', async () => {
      prismaMock.soilType.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'IVS',
          versions: [
            versionRow({
              description: 'Malo con agua',
              // false informado é valor, não pendência (RNF-09)
              submerged: false,
              // Zero informado é valor, não pendência (RNF-09)
              allowableCompressionStressKgfCm2: new Prisma.Decimal('0'),
              specificWeightKgfM3: null,
              internalFrictionAngleDeg: new Prisma.Decimal('14'),
            }),
          ],
        },
      ]);

      const [item] = await service.list(undefined, today);

      expect(item.pendingFields).toEqual(['peso específico (kgf/m³)']);
    });

    it('não sinaliza pendência de coesão nem de NSPT para rocha completa', async () => {
      prismaMock.soilType.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'R',
          versions: [
            versionRow({
              description: 'Rocha',
              submerged: false,
              allowableCompressionStressKgfCm2: new Prisma.Decimal('2400'),
              specificWeightKgfM3: new Prisma.Decimal('2400'),
              internalFrictionAngleDeg: new Prisma.Decimal('45'),
              cohesionKgCm2: null,
              nsptMin: null,
              nsptMax: null,
            }),
          ],
        },
      ]);

      const [item] = await service.list(undefined, today);

      expect(item.pendingFields).toEqual([]);
    });
  });

  describe('get', () => {
    it('retorna a versão vigente na data de referência passada', async () => {
      prismaMock.soilType.findUnique.mockResolvedValue({
        id: 1,
        code: 'I',
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            description: 'Duro',
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            description: 'Duro revisado',
          }),
        ],
      });

      const result = await service.get(1, new Date('2026-03-15'));

      expect(result.effectiveVersion?.description).toBe('Duro');
    });

    it('responde que não há versão vigente para data anterior à primeira', async () => {
      prismaMock.soilType.findUnique.mockResolvedValue({
        id: 1,
        code: 'I',
        versions: [versionRow()],
      });

      await expect(service.get(1, new Date('2025-06-01'))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listHistory', () => {
    it('ordena as versões da vigência mais recente para a mais antiga', async () => {
      prismaMock.soilType.findUnique.mockResolvedValue({
        id: 1,
        code: 'I',
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
