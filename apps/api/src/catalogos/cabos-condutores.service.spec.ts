import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../app/prisma.service';
import { CabosCondutoresService } from './cabos-condutores.service';

const erroUnicidade = () =>
  Object.assign(new Error('unique'), { code: 'P2002' });

describe('CabosCondutoresService', () => {
  const hoje = new Date('2026-08-23T00:00:00.000Z');

  const prismaMock = {
    caboCondutor: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    caboCondutorVersao: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  let service: CabosCondutoresService;

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        CabosCondutoresService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(CabosCondutoresService);
  });

  describe('criar', () => {
    it('cria item com primeira versão quando o código é inédito', async () => {
      prismaMock.caboCondutor.create.mockResolvedValue({ id: 1 });

      await service.criar({ codigo: 'CAA-636', pesoTonKm: '1.2' }, 'ana', hoje);

      const dados = prismaMock.caboCondutor.create.mock.calls[0][0].data;
      expect(dados.codigo).toBe('CAA-636');
      expect(dados.versoes.create.vigenciaInicio).toEqual(hoje);
      expect(dados.versoes.create.criadoPor).toBe('ana');
      expect(dados.versoes.create.utsKn).toBeNull();
    });

    it('mapeia violação de unicidade do banco para conflito (409)', async () => {
      prismaMock.caboCondutor.create.mockRejectedValue(erroUnicidade());

      await expect(
        service.criar({ codigo: 'CAA-636' }, 'ana', hoje),
      ).rejects.toThrow(ConflictException);
    });

    it('rejeita data de vigência de calendário inválida sem gravar', async () => {
      await expect(
        service.criar(
          { codigo: 'CAA-636', vigenciaInicio: '2026-02-30' },
          'ana',
          hoje,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.caboCondutor.create).not.toHaveBeenCalled();
    });
  });

  describe('criarVersao', () => {
    it('cria nova versão sem alterar as existentes', async () => {
      prismaMock.caboCondutor.findUnique.mockResolvedValue({
        id: 1,
        codigo: 'CAA-636',
        versoes: [{ vigenciaInicio: new Date('2026-01-01') }],
      });
      prismaMock.caboCondutorVersao.create.mockResolvedValue({ id: 2 });

      await service.criarVersao(
        1,
        { vigenciaInicio: '2026-09-01', pesoTonKm: '1.3' },
        'bruno',
      );

      expect(prismaMock.caboCondutorVersao.create).toHaveBeenCalled();
      expect(prismaMock.caboCondutorVersao.update).not.toHaveBeenCalled();
    });

    it('rejeita segunda versão com a mesma data de vigência (unicidade do banco)', async () => {
      prismaMock.caboCondutor.findUnique.mockResolvedValue({
        id: 1,
        versoes: [],
      });
      prismaMock.caboCondutorVersao.create.mockRejectedValue(erroUnicidade());

      await expect(
        service.criarVersao(1, { vigenciaInicio: '2026-09-01' }, 'bruno'),
      ).rejects.toThrow(ConflictException);
    });

    it('falha com item inexistente', async () => {
      prismaMock.caboCondutor.findUnique.mockResolvedValue(null);

      await expect(
        service.criarVersao(99, { vigenciaInicio: '2026-09-01' }, 'bruno'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('obter', () => {
    it('retorna a versão vigente na data de referência passada', async () => {
      prismaMock.caboCondutor.findUnique.mockResolvedValue({
        id: 1,
        codigo: 'CAA-636',
        versoes: [
          {
            vigenciaInicio: new Date('2026-01-01'),
            pesoTonKm: '1.2',
            descricao: 'v1',
            bobinaM: '2000',
            diametroMm: '25',
            utsKn: '120',
          },
          {
            vigenciaInicio: new Date('2026-06-01'),
            pesoTonKm: '1.3',
            descricao: 'v2',
            bobinaM: '2000',
            diametroMm: '25',
            utsKn: '125',
          },
        ],
      });

      const resultado = await service.obter(1, new Date('2026-03-15'));

      expect(resultado.versaoVigente.pesoTonKm).toBe('1.2');
    });

    it('responde que não há versão vigente para data anterior à primeira', async () => {
      prismaMock.caboCondutor.findUnique.mockResolvedValue({
        id: 1,
        codigo: 'CAA-636',
        versoes: [{ vigenciaInicio: new Date('2026-01-01') }],
      });

      await expect(service.obter(1, new Date('2025-06-01'))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listar', () => {
    it('sinaliza campos pendentes da versão vigente', async () => {
      prismaMock.caboCondutor.findMany.mockResolvedValue([
        {
          id: 1,
          codigo: 'CAA-636',
          versoes: [
            {
              vigenciaInicio: new Date('2026-01-01'),
              descricao: 'CAA 636 MCM',
              pesoTonKm: '1.2',
              bobinaM: null,
              diametroMm: '25.15',
              utsKn: null,
            },
          ],
        },
      ]);

      const [item] = await service.listar(undefined, hoje);

      expect(item.camposPendentes).toEqual(['bobina (m)', 'UTS (kN)']);
    });
  });

  describe('listarHistorico', () => {
    it('ordena as versões da vigência mais recente para a mais antiga', async () => {
      prismaMock.caboCondutor.findUnique.mockResolvedValue({
        id: 1,
        codigo: 'CAA-636',
        versoes: [
          { vigenciaInicio: new Date('2026-01-01'), criadoPor: 'ana' },
          { vigenciaInicio: new Date('2026-06-01'), criadoPor: 'bruno' },
        ],
      });

      const historico = await service.listarHistorico(1);

      expect(historico.versoes.map((v) => v.criadoPor)).toEqual([
        'bruno',
        'ana',
      ]);
    });
  });
});
