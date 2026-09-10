import { FOUNDATION_VOLUME_QUANTITY_FIELDS } from '@lt-offers/domain';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { FoundationVolumesService } from './foundation-volumes.service';

const uniqueViolation = () =>
  Object.assign(new Error('unique'), { code: 'P2002' });

// Linha completa de versão como o Prisma devolve: as 34 quantidades vêm da
// lista da domain (mapped type garante que nenhuma coluna fique de fora)
const versionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  ...Object.fromEntries(
    FOUNDATION_VOLUME_QUANTITY_FIELDS.map((field) => [field, null]),
  ),
  effectiveFrom: new Date('2026-01-01'),
  createdBy: 'ana',
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  ...overrides,
});

// Entrada com os rótulos da combinação carregados via include
const itemRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  towerTypeId: 5,
  towerType: {
    id: 5,
    code: 'FIEL',
    structureSeries: { name: '500-1-4-110-ENG-MSG' },
  },
  soilTypeId: 2,
  soilType: { id: 2, code: 'I' },
  foundationTypeId: 3,
  foundationType: { id: 3, code: '1PR - 4PR' },
  versions: [versionRow()],
  ...overrides,
});

describe('FoundationVolumesService', () => {
  const today = new Date('2026-08-25T00:00:00.000Z');

  const prismaMock = {
    foundationVolume: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    foundationVolumeVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
    towerType: { findUnique: jest.fn() },
    soilType: { findUnique: jest.fn() },
    foundationType: { findUnique: jest.fn() },
  };

  const referencesExist = () => {
    prismaMock.towerType.findUnique.mockResolvedValue({ id: 5 });
    prismaMock.soilType.findUnique.mockResolvedValue({ id: 2 });
    prismaMock.foundationType.findUnique.mockResolvedValue({ id: 3 });
  };

  let service: FoundationVolumesService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        FoundationVolumesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(FoundationVolumesService);
  });

  describe('create', () => {
    it('cria entrada da matriz com a tripla e as quantidades', async () => {
      referencesExist();
      prismaMock.foundationVolume.create.mockResolvedValue(
        itemRow({
          versions: [versionRow({ excavationHardPrecastM3: '20' })],
        }),
      );

      await service.create(
        {
          towerTypeId: 5,
          soilTypeId: 2,
          foundationTypeId: 3,
          excavationHardPrecastM3: '20',
          steelPrecastKg: '486',
        },
        'ana',
        today,
      );

      const data = prismaMock.foundationVolume.create.mock.calls[0][0].data;
      expect(data.towerTypeId).toBe(5);
      expect(data.soilTypeId).toBe(2);
      expect(data.foundationTypeId).toBe(3);
      expect(data.versions.create.excavationHardPrecastM3).toBe('20');
      expect(data.versions.create.steelPrecastKg).toBe('486');
      expect(data.versions.create.groutM3).toBeNull();
      expect(data.versions.create.effectiveFrom).toEqual(today);
      expect(data.versions.create.createdBy).toBe('ana');
    });

    it.each([
      ['towerType', 'Tipo de torre não encontrado'],
      ['soilType', 'Tipo de solo não encontrado'],
      ['foundationType', 'Tipo de fundação não encontrado'],
    ] as const)(
      'rejeita referência inexistente nomeando qual falta (%s) sem gravar',
      async (missingRef, message) => {
        referencesExist();
        prismaMock[missingRef].findUnique.mockResolvedValue(null);

        await expect(
          service.create(
            { towerTypeId: 5, soilTypeId: 2, foundationTypeId: 3 },
            'ana',
            today,
          ),
        ).rejects.toThrow(message);
        expect(prismaMock.foundationVolume.create).not.toHaveBeenCalled();
      },
    );

    it('mapeia combinação duplicada para conflito (409) com mensagem própria', async () => {
      referencesExist();
      prismaMock.foundationVolume.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.create(
          { towerTypeId: 5, soilTypeId: 2, foundationTypeId: 3 },
          'ana',
          today,
        ),
      ).rejects.toThrow(
        'Já existe uma entrada da matriz para esta combinação de tipo de torre, solo e fundação',
      );
    });

    it('rejeita data de vigência de calendário inválida sem gravar', async () => {
      referencesExist();
      await expect(
        service.create(
          {
            towerTypeId: 5,
            soilTypeId: 2,
            foundationTypeId: 3,
            effectiveFrom: '2026-02-30',
          },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.foundationVolume.create).not.toHaveBeenCalled();
    });

    it('converte Decimal do banco para string no contrato de retorno', async () => {
      referencesExist();
      prismaMock.foundationVolume.create.mockResolvedValue(
        itemRow({
          versions: [
            versionRow({
              concretePrecastM3: new Prisma.Decimal('3.71'),
              formworkM2: new Prisma.Decimal('21.72'),
            }),
          ],
        }),
      );

      const result = await service.create(
        { towerTypeId: 5, soilTypeId: 2, foundationTypeId: 3 },
        'ana',
        today,
      );

      expect(result.effectiveVersion?.concretePrecastM3).toBe('3.71');
      expect(result.effectiveVersion?.formworkM2).toBe('21.72');
      expect(typeof result.effectiveVersion?.formworkM2).toBe('string');
    });

    it('expõe os rótulos da combinação no summary', async () => {
      referencesExist();
      prismaMock.foundationVolume.create.mockResolvedValue(itemRow());

      const result = await service.create(
        { towerTypeId: 5, soilTypeId: 2, foundationTypeId: 3 },
        'ana',
        today,
      );

      expect(result.combination).toEqual({
        towerTypeId: 5,
        seriesName: '500-1-4-110-ENG-MSG',
        towerCode: 'FIEL',
        soilTypeId: 2,
        soilCode: 'I',
        foundationTypeId: 3,
        foundationCode: '1PR - 4PR',
      });
    });
  });

  describe('createVersion', () => {
    it('cria nova versão apenas de quantidades, sem alterar as existentes', async () => {
      prismaMock.foundationVolume.findUnique.mockResolvedValue(itemRow());
      prismaMock.foundationVolumeVersion.create.mockResolvedValue(
        versionRow({ id: 2, effectiveFrom: new Date('2026-10-01') }),
      );

      await service.createVersion(
        1,
        { effectiveFrom: '2026-10-01', groutM3: '1.5' },
        'bruno',
      );

      const data =
        prismaMock.foundationVolumeVersion.create.mock.calls[0][0].data;
      expect(data.foundationVolumeId).toBe(1);
      expect(data.groutM3).toBe('1.5');
      expect(data).not.toHaveProperty('towerTypeId');
      expect(prismaMock.foundationVolumeVersion.update).not.toHaveBeenCalled();
    });

    it('rejeita segunda versão com a mesma data de vigência com mensagem própria', async () => {
      prismaMock.foundationVolume.findUnique.mockResolvedValue(itemRow());
      prismaMock.foundationVolumeVersion.create.mockRejectedValue(
        uniqueViolation(),
      );

      await expect(
        service.createVersion(1, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(
        'Já existe uma versão com esta data de início de vigência; escolha outra data',
      );
    });

    it('falha com entrada inexistente', async () => {
      prismaMock.foundationVolume.findUnique.mockResolvedValue(null);

      await expect(
        service.createVersion(99, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('repassa os filtros da combinação parcial para o where', async () => {
      prismaMock.foundationVolume.findMany.mockResolvedValue([]);

      await service.list({ soilTypeId: 2, foundationTypeId: 3 }, today);

      const where = prismaMock.foundationVolume.findMany.mock.calls[0][0].where;
      expect(where).toEqual({ soilTypeId: 2, foundationTypeId: 3 });
    });

    it('lista sem filtros quando nenhum é informado', async () => {
      prismaMock.foundationVolume.findMany.mockResolvedValue([]);

      await service.list({}, today);

      const where = prismaMock.foundationVolume.findMany.mock.calls[0][0].where;
      expect(where).toEqual({});
    });

    it('sinaliza pendência quando nenhuma quantidade foi informada', async () => {
      prismaMock.foundationVolume.findMany.mockResolvedValue([itemRow()]);

      const [item] = await service.list({}, today);

      expect(item.pendingFields).toEqual(['quantidades']);
    });

    it('não sinaliza pendência com quantidade zero informada (RNF-09)', async () => {
      prismaMock.foundationVolume.findMany.mockResolvedValue([
        itemRow({
          versions: [versionRow({ excavationPierM3: new Prisma.Decimal('0') })],
        }),
      ]);

      const [item] = await service.list({}, today);

      expect(item.pendingFields).toEqual([]);
      expect(item.effectiveVersion?.excavationPierM3).toBe('0');
      expect(item.effectiveVersion?.groutM3).toBeNull();
    });
  });

  describe('get', () => {
    it('retorna a versão vigente na data de referência passada', async () => {
      prismaMock.foundationVolume.findUnique.mockResolvedValue(
        itemRow({
          versions: [
            versionRow({
              effectiveFrom: new Date('2026-01-01'),
              steelPrecastKg: new Prisma.Decimal('486'),
            }),
            versionRow({
              id: 11,
              effectiveFrom: new Date('2026-06-01'),
              steelPrecastKg: new Prisma.Decimal('527'),
            }),
          ],
        }),
      );

      const result = await service.get(1, new Date('2026-03-15'));

      expect(result.effectiveVersion?.steelPrecastKg).toBe('486');
    });

    it('responde que não há versão vigente para data anterior à primeira', async () => {
      prismaMock.foundationVolume.findUnique.mockResolvedValue(itemRow());

      await expect(service.get(1, new Date('2025-06-01'))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listHistory', () => {
    it('ordena as versões da vigência mais recente para a mais antiga, com a combinação', async () => {
      prismaMock.foundationVolume.findUnique.mockResolvedValue(
        itemRow({
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
        }),
      );

      const history = await service.listHistory(1);

      expect(history.combination.towerCode).toBe('FIEL');
      expect(history.versions.map((v) => v.createdBy)).toEqual([
        'bruno',
        'ana',
      ]);
    });
  });
});
