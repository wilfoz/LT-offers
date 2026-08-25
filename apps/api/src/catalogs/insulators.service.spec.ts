import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { InsulatorsService } from './insulators.service';

const uniqueViolation = () =>
  Object.assign(new Error('unique'), { code: 'P2002' });

// Linha completa de versão como o Prisma devolve (o service mapeia para o
// contrato da domain, então os mocks precisam dos campos de autoria/datas)
const versionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  description: null,
  type: null,
  manufacturer: null,
  profile: null,
  ruptureStrengthKn: null,
  diameterMm: null,
  spacingMm: null,
  creepageDistanceMm: null,
  effectiveFrom: new Date('2026-01-01'),
  createdBy: 'ana',
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  ...overrides,
});

describe('InsulatorsService', () => {
  const today = new Date('2026-08-24T00:00:00.000Z');

  const prismaMock = {
    insulator: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    insulatorVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: InsulatorsService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        InsulatorsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(InsulatorsService);
  });

  describe('create', () => {
    it('cria isolador com primeira versão e todos os atributos', async () => {
      prismaMock.insulator.create.mockResolvedValue({
        id: 1,
        code: 'ISO-V-120',
        versions: [versionRow({ type: 'vidro', profile: 'antipoluição' })],
      });

      await service.create(
        {
          code: 'ISO-V-120',
          type: 'vidro',
          manufacturer: 'Sediver',
          profile: 'antipoluição',
          ruptureStrengthKn: '120',
          spacingMm: '146',
        },
        'ana',
        today,
      );

      const data = prismaMock.insulator.create.mock.calls[0][0].data;
      expect(data.code).toBe('ISO-V-120');
      expect(data.versions.create.type).toBe('vidro');
      expect(data.versions.create.profile).toBe('antipoluição');
      expect(data.versions.create.diameterMm).toBeNull();
      expect(data.versions.create.effectiveFrom).toEqual(today);
      expect(data.versions.create.createdBy).toBe('ana');
    });

    it('mapeia código duplicado para conflito (409)', async () => {
      prismaMock.insulator.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.create({ code: 'ISO-V-120' }, 'ana', today),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita data de vigência de calendário inválida sem gravar', async () => {
      await expect(
        service.create(
          { code: 'ISO-V-120', effectiveFrom: '2026-02-30' },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.insulator.create).not.toHaveBeenCalled();
    });

    it('converte Decimal do banco para string no contrato de retorno', async () => {
      prismaMock.insulator.create.mockResolvedValue({
        id: 1,
        code: 'ISO-V-120',
        versions: [
          versionRow({ ruptureStrengthKn: new Prisma.Decimal('120.5') }),
        ],
      });

      const result = await service.create({ code: 'ISO-V-120' }, 'ana', today);

      expect(result.effectiveVersion?.ruptureStrengthKn).toBe('120.5');
      expect(typeof result.effectiveVersion?.ruptureStrengthKn).toBe('string');
    });
  });

  describe('createVersion', () => {
    it('cria nova versão sem alterar as existentes', async () => {
      prismaMock.insulator.findUnique.mockResolvedValue({
        id: 1,
        code: 'ISO-V-120',
        versions: [versionRow()],
      });
      prismaMock.insulatorVersion.create.mockResolvedValue(
        versionRow({ id: 2, effectiveFrom: new Date('2026-10-01') }),
      );

      await service.createVersion(
        1,
        { effectiveFrom: '2026-10-01', type: 'porcelana' },
        'bruno',
      );

      expect(prismaMock.insulatorVersion.create).toHaveBeenCalled();
      expect(prismaMock.insulatorVersion.update).not.toHaveBeenCalled();
    });

    it('rejeita segunda versão com a mesma data de vigência (unicidade do banco)', async () => {
      prismaMock.insulator.findUnique.mockResolvedValue({
        id: 1,
        versions: [],
      });
      prismaMock.insulatorVersion.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.createVersion(1, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(ConflictException);
    });

    it('falha com item inexistente', async () => {
      prismaMock.insulator.findUnique.mockResolvedValue(null);

      await expect(
        service.createVersion(99, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('repassa o termo de busca para código e descrição', async () => {
      prismaMock.insulator.findMany.mockResolvedValue([]);

      await service.list('ISO', today);

      const where = prismaMock.insulator.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { code: { contains: 'ISO', mode: 'insensitive' } },
        {
          versions: {
            some: { description: { contains: 'ISO', mode: 'insensitive' } },
          },
        },
      ]);
    });

    it('sinaliza pendências com rótulos pt-BR, distinguindo zero de não informado', async () => {
      prismaMock.insulator.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'ISO-V-120',
          versions: [
            versionRow({
              description: null,
              manufacturer: null,
              type: 'vidro',
              profile: 'standard',
              ruptureStrengthKn: new Prisma.Decimal('120'),
              diameterMm: new Prisma.Decimal('255'),
              // Zero informado é valor, não pendência (RNF-09)
              spacingMm: new Prisma.Decimal('0'),
              creepageDistanceMm: null,
            }),
          ],
        },
      ]);

      const [item] = await service.list(undefined, today);

      expect(item.pendingFields).toEqual(['linha de fuga (mm)']);
    });
  });

  describe('get', () => {
    it('retorna a versão vigente na data de referência passada', async () => {
      prismaMock.insulator.findUnique.mockResolvedValue({
        id: 1,
        code: 'ISO-V-120',
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            type: 'vidro',
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            type: 'porcelana',
          }),
        ],
      });

      const result = await service.get(1, new Date('2026-03-15'));

      expect(result.effectiveVersion?.type).toBe('vidro');
    });

    it('responde que não há versão vigente para data anterior à primeira', async () => {
      prismaMock.insulator.findUnique.mockResolvedValue({
        id: 1,
        code: 'ISO-V-120',
        versions: [versionRow()],
      });

      await expect(service.get(1, new Date('2025-06-01'))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listHistory', () => {
    it('ordena as versões da vigência mais recente para a mais antiga', async () => {
      prismaMock.insulator.findUnique.mockResolvedValue({
        id: 1,
        code: 'ISO-V-120',
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
