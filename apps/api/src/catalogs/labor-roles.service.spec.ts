import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { LaborRolesService } from './labor-roles.service';

const uniqueViolation = () =>
  Object.assign(new Error('unique'), { code: 'P2002' });

const versionRow = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  baseSalary: null,
  hazardPayPercent: null,
  overtimePercent: null,
  dsrOvertimePercent: null,
  socialChargesPercent: null,
  foodAllowanceMonthly: null,
  housingMonthly: null,
  homeLeaveTravelMonthly: null,
  healthInsuranceMonthly: null,
  lifeInsuranceMonthly: null,
  effectiveFrom: new Date('2026-01-01'),
  createdBy: 'ana',
  createdAt: new Date('2026-01-01T12:00:00.000Z'),
  ...overrides,
});

describe('LaborRolesService', () => {
  const today = new Date('2026-08-24T00:00:00.000Z');

  const prismaMock = {
    laborRole: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    laborRoleVersion: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: LaborRolesService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        LaborRolesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(LaborRolesService);
  });

  describe('create', () => {
    it('cria cargo com primeira versão e todos os atributos', async () => {
      prismaMock.laborRole.create.mockResolvedValue({
        id: 1,
        code: 'ENC01',
        name: 'Encarregado de Linha',
        versions: [versionRow({ baseSalary: new Prisma.Decimal('5500.00') })],
      });

      await service.create(
        {
          code: 'ENC01',
          name: 'Encarregado de Linha',
          baseSalary: '5500.00',
          hazardPayPercent: '30.0000',
          socialChargesPercent: '68.5000',
        },
        'ana',
        today,
      );

      const data = prismaMock.laborRole.create.mock.calls[0][0].data;
      expect(data.code).toBe('ENC01');
      expect(data.name).toBe('Encarregado de Linha');
      expect(data.versions.create.baseSalary).toBe('5500.00');
      expect(data.versions.create.hazardPayPercent).toBe('30.0000');
      expect(data.versions.create.housingMonthly).toBeNull();
      expect(data.versions.create.effectiveFrom).toEqual(today);
      expect(data.versions.create.createdBy).toBe('ana');
    });

    it('mapeia código duplicado para conflito (409)', async () => {
      prismaMock.laborRole.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.create(
          { code: 'ENC01', name: 'Encarregado de Linha' },
          'ana',
          today,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita data de vigência de calendário inválida sem gravar', async () => {
      await expect(
        service.create(
          {
            code: 'ENC01',
            name: 'Encarregado de Linha',
            effectiveFrom: '2026-02-30',
          },
          'ana',
          today,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.laborRole.create).not.toHaveBeenCalled();
    });

    it('converte Decimal do banco para string no contrato de retorno', async () => {
      prismaMock.laborRole.create.mockResolvedValue({
        id: 1,
        code: 'ENC01',
        name: 'Encarregado de Linha',
        versions: [
          versionRow({ baseSalary: new Prisma.Decimal('5500.50') }),
        ],
      });

      const result = await service.create(
        { code: 'ENC01', name: 'Encarregado de Linha' },
        'ana',
        today,
      );

      expect(result.effectiveVersion?.baseSalary).toBe('5500.5');
      expect(typeof result.effectiveVersion?.baseSalary).toBe('string');
    });
  });

  describe('createVersion', () => {
    it('cria nova versão sem alterar as existentes', async () => {
      prismaMock.laborRole.findUnique.mockResolvedValue({
        id: 1,
        code: 'ENC01',
        name: 'Encarregado',
        versions: [versionRow()],
      });
      prismaMock.laborRoleVersion.create.mockResolvedValue(
        versionRow({ id: 2, effectiveFrom: new Date('2026-10-01') }),
      );

      await service.createVersion(
        1,
        { effectiveFrom: '2026-10-01', baseSalary: '6000.00' },
        'bruno',
      );

      expect(prismaMock.laborRoleVersion.create).toHaveBeenCalled();
      expect(prismaMock.laborRoleVersion.update).not.toHaveBeenCalled();
    });

    it('rejeita segunda versão com a mesma data de vigência (unicidade do banco)', async () => {
      prismaMock.laborRole.findUnique.mockResolvedValue({
        id: 1,
        versions: [],
      });
      prismaMock.laborRoleVersion.create.mockRejectedValue(uniqueViolation());

      await expect(
        service.createVersion(1, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(ConflictException);
    });

    it('falha com item inexistente', async () => {
      prismaMock.laborRole.findUnique.mockResolvedValue(null);

      await expect(
        service.createVersion(99, { effectiveFrom: '2026-10-01' }, 'bruno'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('repassa o termo de busca para código e nome', async () => {
      prismaMock.laborRole.findMany.mockResolvedValue([]);

      await service.list('ENC', today);

      const where = prismaMock.laborRole.findMany.mock.calls[0][0].where;
      expect(where.OR).toEqual([
        { code: { contains: 'ENC', mode: 'insensitive' } },
        { name: { contains: 'ENC', mode: 'insensitive' } },
      ]);
    });

    it('sinaliza pendências com rótulos pt-BR, distinguindo zero de não informado', async () => {
      prismaMock.laborRole.findMany.mockResolvedValue([
        {
          id: 1,
          code: 'ENC01',
          name: 'Encarregado',
          versions: [
            versionRow({
              baseSalary: new Prisma.Decimal('0'),
              socialChargesPercent: null,
            }),
          ],
        },
      ]);

      const [item] = await service.list(undefined, today);

      expect(item.pendingFields).toEqual(['encargos sociais (%)']);
    });
  });

  describe('get', () => {
    it('retorna a versão vigente na data de referência passada', async () => {
      prismaMock.laborRole.findUnique.mockResolvedValue({
        id: 1,
        code: 'ENC01',
        name: 'Encarregado',
        versions: [
          versionRow({
            effectiveFrom: new Date('2026-01-01'),
            baseSalary: new Prisma.Decimal('5000.00'),
          }),
          versionRow({
            id: 11,
            effectiveFrom: new Date('2026-06-01'),
            baseSalary: new Prisma.Decimal('5500.00'),
          }),
        ],
      });

      const result = await service.get(1, new Date('2026-03-15'));

      expect(result.effectiveVersion?.baseSalary).toBe('5000');
    });

    it('responde que não há versão vigente para data anterior à primeira', async () => {
      prismaMock.laborRole.findUnique.mockResolvedValue({
        id: 1,
        code: 'ENC01',
        name: 'Encarregado',
        versions: [versionRow()],
      });

      await expect(service.get(1, new Date('2025-06-01'))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listHistory', () => {
    it('ordena as versões da vigência mais recente para a mais antiga', async () => {
      prismaMock.laborRole.findUnique.mockResolvedValue({
        id: 1,
        code: 'ENC01',
        name: 'Encarregado',
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
