import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { GroundWiresService } from './ground-wires.service';

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
  manufacturer: null,
  i2tKa2s: null,
  fiberCount: null,
  effectiveFrom: new Date('2026-01-01'),
  createdBy: 'ana',
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  ...overrides,
});

describe('GroundWiresService', () => {
  const today = new Date('2026-08-23T00:00:00.000Z');

  const prismaMock = {
    groundWire: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    groundWireVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: GroundWiresService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        GroundWiresService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(GroundWiresService);
  });

  describe('create', () => {
    it('cria cabo de aço com primeira versão e campos específicos do tipo', async () => {
      prismaMock.groundWire.create.mockResolvedValue({
        id: 1,
        code: 'CG-EHS-3/8',
        type: 'STEEL',
        versions: [versionRow({ strengthGrade: 'EHS', wireCount: 7 })],
      });

      await service.create(
        {
          code: 'CG-EHS-3/8',
          type: 'STEEL',
          galvanizationClass: 'B',
          strengthGrade: 'EHS',
          wireCount: 7,
        },
        'ana',
        today,
      );

      const data = prismaMock.groundWire.create.mock.calls[0][0].data;
      expect(data.code).toBe('CG-EHS-3/8');
      expect(data.type).toBe('STEEL');
      expect(data.versions.create.strengthGrade).toBe('EHS');
      expect(data.versions.create.wireCount).toBe(7);
      expect(data.versions.create.fiberCount).toBeNull();
      expect(data.versions.create.effectiveFrom).toEqual(today);
      expect(data.versions.create.createdBy).toBe('ana');
    });

    it('cria cabo OPGW com primeira versão e campos específicos do tipo', async () => {
      prismaMock.groundWire.create.mockResolvedValue({
        id: 2,
        code: 'OPGW-48FO',
        type: 'OPGW',
        versions: [versionRow({ i2tKa2s: '95.5', fiberCount: 48 })],
      });

      await service.create(
        {
          code: 'OPGW-48FO',
          type: 'OPGW',
          manufacturer: 'Prysmian',
          i2tKa2s: '95.5',
          fiberCount: 48,
        },
        'ana',
        today,
      );

      const data = prismaMock.groundWire.create.mock.calls[0][0].data;
      expect(data.type).toBe('OPGW');
      expect(data.versions.create.i2tKa2s).toBe('95.5');
      expect(data.versions.create.fiberCount).toBe(48);
      expect(data.versions.create.wireCount).toBeNull();
    });

    it('mapeia código duplicado para conflito (409) mesmo entre tipos diferentes', async () => {
      prismaMock.groundWire.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.create({ code: 'CG-EHS-3/8', type: 'OPGW' }, 'ana', today),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita campo de OPGW em cabo do tipo aço apontando o campo', async () => {
      await expect(
        service.create(
          { code: 'CG-EHS-3/8', type: 'STEEL', fiberCount: 24, i2tKa2s: '80' },
          'ana',
          today,
        ),
      ).rejects.toThrow(/não se aplicam ao tipo aço.*número de fibras/);
      expect(prismaMock.groundWire.create).not.toHaveBeenCalled();
    });

    it('rejeita campo de aço em cabo do tipo OPGW apontando o campo', async () => {
      await expect(
        service.create(
          { code: 'OPGW-48FO', type: 'OPGW', galvanizationClass: 'B' },
          'ana',
          today,
        ),
      ).rejects.toThrow(/não se aplicam ao tipo OPGW.*classe de galvanização/);
      expect(prismaMock.groundWire.create).not.toHaveBeenCalled();
    });

    it('aceita campo do outro tipo explicitamente null (não informado)', async () => {
      prismaMock.groundWire.create.mockResolvedValue({
        id: 3,
        code: 'CG-HS-5/16',
        type: 'STEEL',
        versions: [versionRow()],
      });

      await service.create(
        { code: 'CG-HS-5/16', type: 'STEEL', fiberCount: null },
        'ana',
        today,
      );

      expect(prismaMock.groundWire.create).toHaveBeenCalled();
    });

    it('rejeita data de vigência de calendário inválida sem gravar', async () => {
      await expect(
        service.create(
          { code: 'CG-EHS-3/8', type: 'STEEL', effectiveFrom: '2026-02-30' },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.groundWire.create).not.toHaveBeenCalled();
    });
  });

  describe('createVersion', () => {
    it('cria nova versão sem alterar as existentes', async () => {
      prismaMock.groundWire.findUnique.mockResolvedValue({
        id: 1,
        code: 'CG-EHS-3/8',
        type: 'STEEL',
        versions: [versionRow()],
      });
      prismaMock.groundWireVersion.create.mockResolvedValue(
        versionRow({ id: 2, effectiveFrom: new Date('2026-09-01') }),
      );

      await service.createVersion(
        1,
        { effectiveFrom: '2026-09-01', strengthGrade: 'HS' },
        'bruno',
      );

      expect(prismaMock.groundWireVersion.create).toHaveBeenCalled();
      expect(prismaMock.groundWireVersion.update).not.toHaveBeenCalled();
    });

    it('valida aplicabilidade contra o tipo do item existente', async () => {
      prismaMock.groundWire.findUnique.mockResolvedValue({
        id: 1,
        code: 'OPGW-48FO',
        type: 'OPGW',
        versions: [],
      });

      await expect(
        service.createVersion(
          1,
          { effectiveFrom: '2026-09-01', wireCount: 7 },
          'bruno',
        ),
      ).rejects.toThrow(/não se aplicam ao tipo OPGW/);
      expect(prismaMock.groundWireVersion.create).not.toHaveBeenCalled();
    });

    it('rejeita segunda versão com a mesma data de vigência (unicidade do banco)', async () => {
      prismaMock.groundWire.findUnique.mockResolvedValue({
        id: 1,
        type: 'STEEL',
        versions: [],
      });
      prismaMock.groundWireVersion.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.createVersion(1, { effectiveFrom: '2026-09-01' }, 'bruno'),
      ).rejects.toThrow(ConflictException);
    });

    it('falha com item inexistente', async () => {
      prismaMock.groundWire.findUnique.mockResolvedValue(null);

      await expect(
        service.createVersion(99, { effectiveFrom: '2026-09-01' }, 'bruno'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('repassa o filtro de tipo e o termo de busca para a consulta', async () => {
      prismaMock.groundWire.findMany.mockResolvedValue([]);

      await service.list('CG', 'OPGW', today);

      const where = prismaMock.groundWire.findMany.mock.calls[0][0].where;
      expect(where.type).toBe('OPGW');
      expect(where.OR).toEqual([
        { code: { contains: 'CG', mode: 'insensitive' } },
        {
          versions: {
            some: { description: { contains: 'CG', mode: 'insensitive' } },
          },
        },
      ]);
    });

    it('não filtra por tipo quando o filtro está ausente', async () => {
      prismaMock.groundWire.findMany.mockResolvedValue([]);

      await service.list(undefined, undefined, today);

      const where = prismaMock.groundWire.findMany.mock.calls[0][0].where;
      expect(where.type).toBeUndefined();
    });

    it('sinaliza pendências do tipo aço com rótulos pt-BR', async () => {
      prismaMock.groundWire.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'CG-EHS-3/8',
          type: 'STEEL',
          versions: [
            versionRow({
              weightTonPerKm: '0.4',
              reelLengthM: '2000',
              diameterMm: '9.52',
              utsKn: '68.4',
              galvanizationClass: null,
              strengthGrade: 'EHS',
              wireCount: null,
            }),
          ],
        },
      ]);

      const [item] = await service.list(undefined, undefined, today);

      expect(item.pendingFields).toEqual([
        'classe de galvanização',
        'número de fios',
      ]);
    });

    it('não trata fabricante ausente como pendência em cabo OPGW completo', async () => {
      prismaMock.groundWire.findMany.mockResolvedValue([
        {
          id: 2,
          code: 'OPGW-48FO',
          type: 'OPGW',
          versions: [
            versionRow({
              weightTonPerKm: '0.55',
              reelLengthM: '4000',
              diameterMm: '12.1',
              utsKn: '75',
              manufacturer: null,
              i2tKa2s: '95.5',
              fiberCount: 48,
            }),
          ],
        },
      ]);

      const [item] = await service.list(undefined, undefined, today);

      expect(item.pendingFields).toEqual([]);
    });

    it('não cobra campos de aço de um cabo OPGW incompleto', async () => {
      prismaMock.groundWire.findMany.mockResolvedValue([
        {
          id: 2,
          code: 'OPGW-24FO',
          type: 'OPGW',
          versions: [
            versionRow({
              weightTonPerKm: null,
              reelLengthM: '4000',
              diameterMm: '12.1',
              utsKn: '75',
              galvanizationClass: null,
              i2tKa2s: null,
              fiberCount: 24,
            }),
          ],
        },
      ]);

      const [item] = await service.list(undefined, undefined, today);

      expect(item.pendingFields).toEqual(['peso (ton/km)', 'I²t (kA²·s)']);
    });
  });

  describe('get', () => {
    it('retorna a versão vigente com o tipo do item', async () => {
      prismaMock.groundWire.findUnique.mockResolvedValue({
        id: 1,
        code: 'CG-EHS-3/8',
        type: 'STEEL',
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            strengthGrade: 'HS',
            // Decimal real do Prisma: o mapper deve devolver a string exata
            utsKn: new Prisma.Decimal('68.4'),
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            strengthGrade: 'EHS',
          }),
        ],
      });

      const result = await service.get(1, new Date('2026-03-15'));

      expect(result.type).toBe('STEEL');
      expect(result.effectiveVersion?.strengthGrade).toBe('HS');
      expect(result.effectiveVersion?.utsKn).toBe('68.4');
    });

    it('responde que não há versão vigente para data anterior à primeira', async () => {
      prismaMock.groundWire.findUnique.mockResolvedValue({
        id: 1,
        code: 'CG-EHS-3/8',
        type: 'STEEL',
        versions: [versionRow()],
      });

      await expect(service.get(1, new Date('2025-06-01'))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listHistory', () => {
    it('ordena as versões da vigência mais recente para a mais antiga, com o tipo', async () => {
      prismaMock.groundWire.findUnique.mockResolvedValue({
        id: 1,
        code: 'OPGW-48FO',
        type: 'OPGW',
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

      expect(history.type).toBe('OPGW');
      expect(history.versions.map((v) => v.createdBy)).toEqual([
        'bruno',
        'ana',
      ]);
    });
  });
});
