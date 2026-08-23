import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../app/prisma.service';
import { paraDataCivil } from './data-civil';
import { CamposVersaoDto } from './dto/campos-versao.dto';
import { CriarCaboCondutorDto } from './dto/criar-cabo-condutor.dto';
import { CriarVersaoDto } from './dto/criar-versao.dto';
import { camposPendentes, resolverVersaoVigente } from './vigencia';

/** Violação de unicidade do Postgres via Prisma (duck-typing: mock-friendly). */
function ehViolacaoDeUnicidade(erro: unknown): boolean {
  return (
    typeof erro === 'object' &&
    erro !== null &&
    (erro as { code?: string }).code === 'P2002'
  );
}

@Injectable()
export class CabosCondutoresService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CriarCaboCondutorDto, criadoPor: string, hoje: Date) {
    const vigenciaInicio = dto.vigenciaInicio
      ? paraDataCivil(dto.vigenciaInicio)
      : hoje;

    try {
      return await this.prisma.caboCondutor.create({
        data: {
          codigo: dto.codigo,
          versoes: {
            create: {
              ...this.paraCamposVersao(dto),
              vigenciaInicio,
              criadoPor,
            },
          },
        },
        include: { versoes: true },
      });
    } catch (erro) {
      if (ehViolacaoDeUnicidade(erro)) {
        throw new ConflictException(
          `O código "${dto.codigo}" já está em uso no catálogo`,
        );
      }
      throw erro;
    }
  }

  async criarVersao(id: number, dto: CriarVersaoDto, criadoPor: string) {
    await this.obterItem(id);
    const vigenciaInicio = paraDataCivil(dto.vigenciaInicio);

    try {
      return await this.prisma.caboCondutorVersao.create({
        data: {
          caboCondutorId: id,
          ...this.paraCamposVersao(dto),
          vigenciaInicio,
          criadoPor,
        },
      });
    } catch (erro) {
      if (ehViolacaoDeUnicidade(erro)) {
        throw new ConflictException(
          'Já existe uma versão com esta data de início de vigência; escolha outra data',
        );
      }
      throw erro;
    }
  }

  async listar(busca: string | undefined, dataReferencia: Date) {
    const filtro: Prisma.CaboCondutorWhereInput = busca
      ? {
          OR: [
            { codigo: { contains: busca, mode: 'insensitive' } },
            {
              versoes: {
                some: { descricao: { contains: busca, mode: 'insensitive' } },
              },
            },
          ],
        }
      : {};

    const itens = await this.prisma.caboCondutor.findMany({
      where: filtro,
      include: { versoes: true },
      orderBy: { codigo: 'asc' },
    });

    return itens.map((item) => {
      const vigente = resolverVersaoVigente(item.versoes, dataReferencia);
      return {
        id: item.id,
        codigo: item.codigo,
        versaoVigente: vigente ?? null,
        camposPendentes: vigente ? camposPendentes(vigente) : [],
      };
    });
  }

  async obter(id: number, dataReferencia: Date) {
    const item = await this.obterItem(id);
    const vigente = resolverVersaoVigente(item.versoes, dataReferencia);
    if (!vigente) {
      throw new NotFoundException(
        'Não há versão vigente para a data de referência informada',
      );
    }
    return {
      id: item.id,
      codigo: item.codigo,
      versaoVigente: vigente,
      camposPendentes: camposPendentes(vigente),
    };
  }

  async listarHistorico(id: number) {
    const item = await this.obterItem(id);
    const versoes = [...item.versoes].sort(
      (a, b) => b.vigenciaInicio.getTime() - a.vigenciaInicio.getTime(),
    );
    return { id: item.id, codigo: item.codigo, versoes };
  }

  private async obterItem(id: number) {
    const item = await this.prisma.caboCondutor.findUnique({
      where: { id },
      include: { versoes: true },
    });
    if (!item) {
      throw new NotFoundException('Cabo condutor não encontrado');
    }
    return item;
  }

  private paraCamposVersao(dto: CamposVersaoDto) {
    return {
      descricao: dto.descricao ?? null,
      pesoTonKm: dto.pesoTonKm ?? null,
      bobinaM: dto.bobinaM ?? null,
      diametroMm: dto.diametroMm ?? null,
      utsKn: dto.utsKn ?? null,
    };
  }
}
