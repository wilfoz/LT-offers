import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../app/prisma.service';
import { ConductorCablesService } from './conductor-cables.service';

const uniqueViolation = () =>
  Object.assign(new Error('unique'), { code: 'P2002' });

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
      prismaMock.conductorCable.create.mockResolvedValue({ id: 1 });

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
        versions: [{ effectiveFrom: new Date('2026-01-01') }],
      });
      prismaMock.conductorCableVersion.create.mockResolvedValue({ id: 2 });

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
          {
            effectiveFrom: new Date('2026-01-01'),
            weightTonPerKm: '1.2',
            description: 'v1',
            reelLengthM: '2000',
            diameterMm: '25',
            utsKn: '120',
          },
          {
            effectiveFrom: new Date('2026-06-01'),
            weightTonPerKm: '1.3',
            description: 'v2',
            reelLengthM: '2000',
            diameterMm: '25',
            utsKn: '125',
          },
        ],
      });

      const result = await service.get(1, new Date('2026-03-15'));

      expect(result.effectiveVersion.weightTonPerKm).toBe('1.2');
    });

    it('responde que não há versão vigente para data anterior à primeira', async () => {
      prismaMock.conductorCable.findUnique.mockResolvedValue({
        id: 1,
        code: 'CAA-636',
        versions: [{ effectiveFrom: new Date('2026-01-01') }],
      });

      await expect(service.get(1, new Date('2025-06-01'))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('list', () => {
    it('sinaliza campos pendentes da versão vigente com rótulos pt-BR', async () => {
      prismaMock.conductorCable.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'CAA-636',
          versions: [
            {
              effectiveFrom: new Date('2026-01-01'),
              description: 'CAA 636 MCM',
              weightTonPerKm: '1.2',
              reelLengthM: null,
              diameterMm: '25.15',
              utsKn: null,
            },
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
          { effectiveFrom: new Date('2026-01-01'), createdBy: 'ana' },
          { effectiveFrom: new Date('2026-06-01'), createdBy: 'bruno' },
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
