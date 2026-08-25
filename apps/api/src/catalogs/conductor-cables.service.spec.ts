import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { ConductorCablesService } from './conductor-cables.service';

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
  effectiveFrom: new Date('2026-01-01'),
  createdBy: 'ana',
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  ...overrides,
});

describe('ConductorCablesService', () => {
  const today = new Date('2026-08-23T00:00:00.000Z');

  const prismaMock = {
    conductorCable: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    conductorCableVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: ConductorCablesService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ConductorCablesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(ConductorCablesService);
  });

  describe('create', () => {
    it('cria item com primeira versão quando o código é inédito', async () => {
      prismaMock.conductorCable.create.mockResolvedValue({
        id: 1,
        code: 'CAA-636',
        versions: [versionRow({ weightTonPerKm: '1.2' })],
      });

      await service.create(
        { code: 'CAA-636', weightTonPerKm: '1.2' },
        'ana',
        today,
      );

      const data = prismaMock.conductorCable.create.mock.calls[0][0].data;
      expect(data.code).toBe('CAA-636');
      expect(data.versions.create.effectiveFrom).toEqual(today);
      expect(data.versions.create.createdBy).toBe('ana');
      expect(data.versions.create.utsKn).toBeNull();
    });

    it('mapeia violação de unicidade do banco para conflito (409)', async () => {
      prismaMock.conductorCable.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.create({ code: 'CAA-636' }, 'ana', today),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita data de vigência de calendário inválida sem gravar', async () => {
      await expect(
        service.create(
          { code: 'CAA-636', effectiveFrom: '2026-02-30' },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.conductorCable.create).not.toHaveBeenCalled();
    });
  });

  describe('createVersion', () => {
    it('cria nova versão sem alterar as existentes', async () => {
      prismaMock.conductorCable.findUnique.mockResolvedValue({
        id: 1,
        code: 'CAA-636',
        versions: [versionRow()],
      });
      prismaMock.conductorCableVersion.create.mockResolvedValue(
        versionRow({ id: 2, effectiveFrom: new Date('2026-09-01') }),
      );

      await service.createVersion(
        1,
        { effectiveFrom: '2026-09-01', weightTonPerKm: '1.3' },
        'bruno',
      );

      expect(prismaMock.conductorCableVersion.create).toHaveBeenCalled();
      expect(prismaMock.conductorCableVersion.update).not.toHaveBeenCalled();
    });

    it('rejeita segunda versão com a mesma data de vigência (unicidade do banco)', async () => {
      prismaMock.conductorCable.findUnique.mockResolvedValue({
        id: 1,
        versions: [],
      });
      prismaMock.conductorCableVersion.create.mockRejectedValue(
        uniqueViolation(),
      );

      await expect(
        service.createVersion(1, { effectiveFrom: '2026-09-01' }, 'bruno'),
      ).rejects.toThrow(ConflictException);
    });

    it('falha com item inexistente', async () => {
      prismaMock.conductorCable.findUnique.mockResolvedValue(null);

      await expect(
        service.createVersion(99, { effectiveFrom: '2026-09-01' }, 'bruno'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('get', () => {
    it('retorna a versão vigente na data de referência passada', async () => {
      prismaMock.conductorCable.findUnique.mockResolvedValue({
        id: 1,
        code: 'CAA-636',
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            // Decimal real do Prisma: o mapper deve devolver a string exata
            weightTonPerKm: new Prisma.Decimal('1.2'),
            description: 'v1',
            reelLengthM: '2000',
            diameterMm: '25',
            utsKn: '120',
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            weightTonPerKm: '1.3',
            description: 'v2',
            reelLengthM: '2000',
            diameterMm: '25',
            utsKn: '125',
          }),
        ],
      });

      const result = await service.get(1, new Date('2026-03-15'));

      expect(result.effectiveVersion?.weightTonPerKm).toBe('1.2');
      expect(typeof result.effectiveVersion?.weightTonPerKm).toBe('string');
    });

    it('responde que não há versão vigente para data anterior à primeira', async () => {
      prismaMock.conductorCable.findUnique.mockResolvedValue({
        id: 1,
        code: 'CAA-636',
        versions: [versionRow()],
      });

      await expect(service.get(1, new Date('2025-06-01'))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('list', () => {
    it('busca por código e descrição repassando o termo', async () => {
      prismaMock.conductorCable.findMany.mockResolvedValue([]);

      await service.list('CAA', new Date('2026-03-15'));

      const where = prismaMock.conductorCable.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { code: { contains: 'CAA', mode: 'insensitive' } },
        {
          versions: {
            some: { description: { contains: 'CAA', mode: 'insensitive' } },
          },
        },
      ]);
    });

    it('sinaliza campos pendentes da versão vigente com rótulos pt-BR', async () => {
      prismaMock.conductorCable.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'CAA-636',
          versions: [
            versionRow({
              description: 'CAA 636 MCM',
              weightTonPerKm: '1.2',
              reelLengthM: null,
              diameterMm: '25.15',
              utsKn: null,
            }),
          ],
        },
      ]);

      const [item] = await service.list(undefined, today);

      expect(item.pendingFields).toEqual(['bobina (m)', 'UTS (kN)']);
    });
  });

  describe('listHistory', () => {
    it('ordena as versões da vigência mais recente para a mais antiga', async () => {
      prismaMock.conductorCable.findUnique.mockResolvedValue({
        id: 1,
        code: 'CAA-636',
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
