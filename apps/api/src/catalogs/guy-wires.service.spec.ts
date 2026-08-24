import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { GuyWiresService } from './guy-wires.service';

const uniqueViolation = () =>
  Object.assign(new Error('unique'), { code: 'P2002' });

// Linha completa de versão como o Prisma devolve (o service mapeia para o
// contrato da domain, então os mocks precisam dos campos de autoria/datas)
const versionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  description: null,
  weightTonPerKm: null,
  reelLengthM: null,
  diameterMm: null,
  utsKn: null,
  galvanizationClass: null,
  strengthGrade: null,
  wireCount: null,
  effectiveFrom: new Date('2026-01-01'),
  createdBy: 'ana',
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  ...overrides,
});

describe('GuyWiresService', () => {
  const today = new Date('2026-08-24T00:00:00.000Z');

  const prismaMock = {
    guyWire: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    guyWireVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: GuyWiresService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        GuyWiresService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(GuyWiresService);
  });

  describe('create', () => {
    it('cria cabo de tirante com primeira versão e todos os atributos', async () => {
      prismaMock.guyWire.create.mockResolvedValue({
        id: 1,
        code: 'CT-HS-5/16',
        versions: [versionRow({ strengthGrade: 'HS', wireCount: 7 })],
      });

      await service.create(
        {
          code: 'CT-HS-5/16',
          galvanizationClass: 'B',
          strengthGrade: 'HS',
          wireCount: 7,
          weightTonPerKm: '0.31',
        },
        'ana',
        today,
      );

      const data = prismaMock.guyWire.create.mock.calls[0][0].data;
      expect(data.code).toBe('CT-HS-5/16');
      expect(data.versions.create.strengthGrade).toBe('HS');
      expect(data.versions.create.wireCount).toBe(7);
      expect(data.versions.create.utsKn).toBeNull();
      expect(data.versions.create.effectiveFrom).toEqual(today);
      expect(data.versions.create.createdBy).toBe('ana');
    });

    it('mapeia código duplicado para conflito (409)', async () => {
      prismaMock.guyWire.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.create({ code: 'CT-HS-5/16' }, 'ana', today),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita data de vigência de calendário inválida sem gravar', async () => {
      await expect(
        service.create(
          { code: 'CT-HS-5/16', effectiveFrom: '2026-02-30' },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.guyWire.create).not.toHaveBeenCalled();
    });

    it('converte Decimal do banco para string no contrato de retorno', async () => {
      prismaMock.guyWire.create.mockResolvedValue({
        id: 1,
        code: 'CT-HS-5/16',
        versions: [versionRow({ utsKn: new Prisma.Decimal('48.2') })],
      });

      const result = await service.create({ code: 'CT-HS-5/16' }, 'ana', today);

      expect(result.effectiveVersion?.utsKn).toBe('48.2');
      expect(typeof result.effectiveVersion?.utsKn).toBe('string');
    });
  });

  describe('createVersion', () => {
    it('cria nova versão sem alterar as existentes', async () => {
      prismaMock.guyWire.findUnique.mockResolvedValue({
        id: 1,
        code: 'CT-HS-5/16',
        versions: [versionRow()],
      });
      prismaMock.guyWireVersion.create.mockResolvedValue(
        versionRow({ id: 2, effectiveFrom: new Date('2026-10-01') }),
      );

      await service.createVersion(
        1,
        { effectiveFrom: '2026-10-01', strengthGrade: 'EHS' },
        'bruno',
      );

      expect(prismaMock.guyWireVersion.create).toHaveBeenCalled();
      expect(prismaMock.guyWireVersion.update).not.toHaveBeenCalled();
    });

    it('rejeita segunda versão com a mesma data de vigência (unicidade do banco)', async () => {
      prismaMock.guyWire.findUnique.mockResolvedValue({
        id: 1,
        versions: [],
      });
      prismaMock.guyWireVersion.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.createVersion(1, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(ConflictException);
    });

    it('falha com item inexistente', async () => {
      prismaMock.guyWire.findUnique.mockResolvedValue(null);

      await expect(
        service.createVersion(99, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('busca por código e descrição', async () => {
      prismaMock.guyWire.findMany.mockResolvedValue([]);

      await service.list('CT', today);

      const where = prismaMock.guyWire.findMany.mock.calls[0][0].where;
      expect(where.OR).toBeDefined();
    });

    it('sinaliza pendências com rótulos pt-BR, sem cobrar descrição', async () => {
      prismaMock.guyWire.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'CT-HS-5/16',
          versions: [
            versionRow({
              description: null,
              weightTonPerKm: '0.31',
              reelLengthM: '1500',
              diameterMm: '7.9',
              utsKn: '48.2',
              galvanizationClass: 'B',
              strengthGrade: null,
              wireCount: 7,
            }),
          ],
        },
      ]);

      const [item] = await service.list(undefined, today);

      expect(item.pendingFields).toEqual(['grau de resistência']);
    });
  });

  describe('get', () => {
    it('retorna a versão vigente na data de referência passada', async () => {
      prismaMock.guyWire.findUnique.mockResolvedValue({
        id: 1,
        code: 'CT-HS-5/16',
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            strengthGrade: 'HS',
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            strengthGrade: 'EHS',
          }),
        ],
      });

      const result = await service.get(1, new Date('2026-03-15'));

      expect(result.effectiveVersion?.strengthGrade).toBe('HS');
    });

    it('responde que não há versão vigente para data anterior à primeira', async () => {
      prismaMock.guyWire.findUnique.mockResolvedValue({
        id: 1,
        code: 'CT-HS-5/16',
        versions: [versionRow()],
      });

      await expect(service.get(1, new Date('2025-06-01'))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listHistory', () => {
    it('ordena as versões da vigência mais recente para a mais antiga', async () => {
      prismaMock.guyWire.findUnique.mockResolvedValue({
        id: 1,
        code: 'CT-HS-5/16',
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
