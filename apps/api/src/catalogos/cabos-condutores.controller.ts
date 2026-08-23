import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  MethodNotAllowedException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CabosCondutoresService } from './cabos-condutores.service';
import { hojeDataCivil, paraDataCivil } from './data-civil';
import { CriarCaboCondutorDto } from './dto/criar-cabo-condutor.dto';
import { CriarVersaoDto } from './dto/criar-versao.dto';

const USUARIO_PADRAO = 'sistema';

const PipeId = new ParseIntPipe({
  exceptionFactory: () =>
    new BadRequestException('O identificador deve ser um número inteiro'),
});

@Controller('catalogos/cabos-condutores')
export class CabosCondutoresController {
  constructor(private readonly service: CabosCondutoresService) {}

  @Post()
  criar(
    @Body() dto: CriarCaboCondutorDto,
    @Headers('x-usuario') usuario?: string,
  ) {
    return this.service.criar(dto, this.autor(usuario), hojeDataCivil());
  }

  @Get()
  listar(
    @Query('busca') busca?: string,
    @Query('vigenteEm') vigenteEm?: string,
  ) {
    return this.service.listar(busca, this.dataReferencia(vigenteEm));
  }

  @Get(':id')
  obter(
    @Param('id', PipeId) id: number,
    @Query('vigenteEm') vigenteEm?: string,
  ) {
    return this.service.obter(id, this.dataReferencia(vigenteEm));
  }

  @Get(':id/historico')
  listarHistorico(@Param('id', PipeId) id: number) {
    return this.service.listarHistorico(id);
  }

  @Post(':id/versoes')
  criarVersao(
    @Param('id', PipeId) id: number,
    @Body() dto: CriarVersaoDto,
    @Headers('x-usuario') usuario?: string,
  ) {
    return this.service.criarVersao(id, dto, this.autor(usuario));
  }

  // Decoradores @Put/@Patch empilhados no mesmo método NÃO registram duas
  // rotas (o mais externo sobrescreve o metadata) — por isso dois métodos.
  @Put(':id/versoes/:versaoId')
  substituirVersao(): never {
    return this.rejeitarAlteracaoDeVersao();
  }

  @Patch(':id/versoes/:versaoId')
  corrigirVersao(): never {
    return this.rejeitarAlteracaoDeVersao();
  }

  private rejeitarAlteracaoDeVersao(): never {
    throw new MethodNotAllowedException(
      'Versões são imutáveis; para alterar valores, crie uma nova versão com data de vigência',
    );
  }

  private autor(usuario?: string): string {
    return usuario?.trim() || USUARIO_PADRAO;
  }

  /** Data de referência resolvida na borda (design D2): default = hoje civil. */
  private dataReferencia(vigenteEm?: string): Date {
    return vigenteEm ? paraDataCivil(vigenteEm) : hojeDataCivil();
  }
}
