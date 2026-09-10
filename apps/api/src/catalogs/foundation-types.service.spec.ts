import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../app/prisma.service';
import { FoundationTypesService } from './foundation-types.service';

const uniqueViolation = () =>
  Object.assign(new Error('unique'), { code: 'P2002' });

// Linha completa de versão como o Prisma devolve (o service mapeia para o
// contrato da domain, então os mocks precisam dos campos de autoria/datas)
const versionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  description: null,
  spreadFootingCount: null,
  precastMastCount: null,
  precastGuyCount: null,
  straightPierCount: null,
  belledPierCount: null,
  slabPierCount: null,
  straightPierGuyCount: null,
  belledPierGuyCount: null,
  rockAnchorCount: null,
  concretePileCount: null,
  steelPileCount: null,
  helicalMastCount: null,
  helicalGuyCount: null,
  triconeCount: null,
  rootPileCount: null,
  micropileCount: null,
  continuousAugerPileCount: null,
  effectiveFrom: new Date('2026-01-01'),
  createdBy: 'ana',
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  ...overrides,
});

describe('FoundationTypesService', () => {
  const today = new Date('2026-08-25T00:00:00.000Z');

  const prismaMock = {
    foundationType: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    foundationTypeVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: FoundationTypesService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        FoundationTypesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(FoundationTypesService);
  });

  describe('create', () => {
    it('cria tipo de fundação com aplicação e composição por elemento', async () => {
      prismaMock.foundationType.create.mockResolvedValue({
        id: 1,
        code: '4FZ',
        application: 'SELF_SUPPORTING',
        versions: [
          versionRow({
            description: '4 x Fuste zapata',
            spreadFootingCount: 4,
          }),
        ],
      });

      await service.create(
        {
          code: '4FZ',
          application: 'SELF_SUPPORTING',
          description: '4 x Fuste zapata',
          spreadFootingCount: 4,
        },
        'ana',
        today,
      );

      const data = prismaMock.foundationType.create.mock.calls[0][0].data;
      expect(data.code).toBe('4FZ');
      expect(data.application).toBe('SELF_SUPPORTING');
      expect(data.versions.create.spreadFootingCount).toBe(4);
      expect(data.versions.create.precastMastCount).toBeNull();
      expect(data.versions.create.effectiveFrom).toEqual(today);
      expect(data.versions.create.createdBy).toBe('ana');
    });

    it('mapeia sigla duplicada para conflito (409)', async () => {
      prismaMock.foundationType.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.create(
          { code: '4FZ', application: 'SELF_SUPPORTING' },
          'ana',
          today,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita data de vigência de calendário inválida sem gravar', async () => {
      await expect(
        service.create(
          {
            code: '4FZ',
            application: 'SELF_SUPPORTING',
            effectiveFrom: '2026-02-30',
          },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.foundationType.create).not.toHaveBeenCalled();
    });
  });

  describe('createVersion', () => {
    it('cria nova versão sem alterar as existentes', async () => {
      prismaMock.foundationType.findUnique.mockResolvedValue({
        id: 1,
        code: '4FZ',
        application: 'SELF_SUPPORTING',
        versions: [versionRow()],
      });
      prismaMock.foundationTypeVersion.create.mockResolvedValue(
        versionRow({ id: 2, effectiveFrom: new Date('2026-10-01') }),
      );

      await service.createVersion(
        1,
        { effectiveFrom: '2026-10-01', spreadFootingCount: 4 },
        'bruno',
      );

      expect(prismaMock.foundationTypeVersion.create).toHaveBeenCalled();
      expect(prismaMock.foundationTypeVersion.update).not.toHaveBeenCalled();
    });

    it('rejeita segunda versão com a mesma data de vigência (unicidade do banco)', async () => {
      prismaMock.foundationType.findUnique.mockResolvedValue({
        id: 1,
        versions: [],
      });
      prismaMock.foundationTypeVersion.create.mockRejectedValue(
        uniqueViolation(),
      );

      await expect(
        service.createVersion(1, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(ConflictException);
    });

    it('falha com item inexistente', async () => {
      prismaMock.foundationType.findUnique.mockResolvedValue(null);

      await expect(
        service.createVersion(99, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('repassa busca e filtro de aplicação combinados', async () => {
      prismaMock.foundationType.findMany.mockResolvedValue([]);

      await service.list('pila', 'GUYED', today);

      const where = prismaMock.foundationType.findMany.mock.calls[0][0].where;
      expect(where).toEqual({
        OR: [
          { code: { contains: 'pila', mode: 'insensitive' } },
          {
            versions: {
              some: { description: { contains: 'pila', mode: 'insensitive' } },
            },
          },
        ],
        application: 'GUYED',
      });
    });

    it('lista sem filtros quando busca e aplicação estão ausentes', async () => {
      prismaMock.foundationType.findMany.mockResolvedValue([]);

      await service.list(undefined, undefined, today);

      const where = prismaMock.foundationType.findMany.mock.calls[0][0].where;
      expect(where).toEqual({});
    });

    it('sinaliza composição ausente quando nenhuma contagem foi informada', async () => {
      prismaMock.foundationType.findMany.mockResolvedValue([
        {
          id: 1,
          code: '4FZ',
          application: 'SELF_SUPPORTING',
          versions: [versionRow({ description: '4 x Fuste zapata' })],
        },
      ]);

      const [item] = await service.list(undefined, undefined, today);

      expect(item.pendingFields).toEqual(['composição por elemento']);
    });

    it('não sinaliza pendência com contagem zero informada (RNF-09)', async () => {
      prismaMock.foundationType.findMany.mockResolvedValue([
        {
          id: 1,
          code: '4FZ',
          application: 'SELF_SUPPORTING',
          versions: [
            versionRow({
              description: '4 x Fuste zapata',
              // Zero informado é valor, não pendência (RNF-09)
              spreadFootingCount: 0,
            }),
          ],
        },
      ]);

      const [item] = await service.list(undefined, undefined, today);

      expect(item.pendingFields).toEqual([]);
    });

    it('sinaliza descrição ausente junto com a composição', async () => {
      prismaMock.foundationType.findMany.mockResolvedValue([
        {
          id: 1,
          code: '4FZ',
          application: 'SELF_SUPPORTING',
          versions: [versionRow()],
        },
      ]);

      const [item] = await service.list(undefined, undefined, today);

      expect(item.pendingFields).toEqual([
        'descrição',
        'composição por elemento',
      ]);
    });
  });

  describe('get', () => {
    it('retorna a versão vigente na data de referência passada', async () => {
      prismaMock.foundationType.findUnique.mockResolvedValue({
        id: 1,
        code: '4FZ',
        application: 'SELF_SUPPORTING',
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            spreadFootingCount: 4,
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            spreadFootingCount: 2,
          }),
        ],
      });

      const result = await service.get(1, new Date('2026-03-15'));

      expect(result.effectiveVersion?.spreadFootingCount).toBe(4);
      expect(result.application).toBe('SELF_SUPPORTING');
    });

    it('responde que não há versão vigente para data anterior à primeira', async () => {
      prismaMock.foundationType.findUnique.mockResolvedValue({
        id: 1,
        code: '4FZ',
        application: 'SELF_SUPPORTING',
        versions: [versionRow()],
      });

      await expect(service.get(1, new Date('2025-06-01'))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listHistory', () => {
    it('ordena as versões da vigência mais recente para a mais antiga, com a composição de cada época', async () => {
      prismaMock.foundationType.findUnique.mockResolvedValue({
        id: 1,
        code: '1PR - 4P',
        application: 'GUYED',
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            createdBy: 'ana',
            precastMastCount: 1,
            straightPierGuyCount: 4,
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            createdBy: 'bruno',
            precastMastCount: 1,
            straightPierGuyCount: 2,
          }),
        ],
      });

      const history = await service.listHistory(1);

      expect(history.application).toBe('GUYED');
      expect(history.versions.map((v) => v.createdBy)).toEqual([
        'bruno',
        'ana',
      ]);
      expect(history.versions.map((v) => v.straightPierGuyCount)).toEqual([
        2, 4,
      ]);
    });
  });
});
