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
import { ConductorCablesService } from './conductor-cables.service';
import { todayCivilDate, toCivilDate } from './civil-date';
import { CreateConductorCableDto } from './dto/create-conductor-cable.dto';
import { CreateVersionDto } from './dto/create-version.dto';

const DEFAULT_USER = 'sistema';

const IdPipe = new ParseIntPipe({
  exceptionFactory: () =>
    new BadRequestException('O identificador deve ser um número inteiro'),
});

@Controller('catalogs/conductor-cables')
export class ConductorCablesController {
  constructor(private readonly service: ConductorCablesService) {}

  @Post()
  create(
    @Body() dto: CreateConductorCableDto,
    @Headers('x-user') user?: string,
  ) {
    return this.service.create(dto, this.author(user), todayCivilDate());
  }

  @Get()
  list(
    @Query('search') search?: string,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    return this.service.list(search, this.referenceDate(effectiveOn));
  }

  @Get(':id')
  get(
    @Param('id', IdPipe) id: number,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    return this.service.get(id, this.referenceDate(effectiveOn));
  }

  @Get(':id/history')
  listHistory(@Param('id', IdPipe) id: number) {
    return this.service.listHistory(id);
  }

  @Post(':id/versions')
  createVersion(
    @Param('id', IdPipe) id: number,
    @Body() dto: CreateVersionDto,
    @Headers('x-user') user?: string,
  ) {
    return this.service.createVersion(id, dto, this.author(user));
  }

  // Decoradores @Put/@Patch empilhados no mesmo método NÃO registram duas
  // rotas (o mais externo sobrescreve o metadata) — por isso dois métodos.
  @Put(':id/versions/:versionId')
  replaceVersion(): never {
    return this.rejectVersionChange();
  }

  @Patch(':id/versions/:versionId')
  patchVersion(): never {
    return this.rejectVersionChange();
  }

  private rejectVersionChange(): never {
    throw new MethodNotAllowedException(
      'Versões são imutáveis; para alterar valores, crie uma nova versão com data de vigência',
    );
  }

  private author(user?: string): string {
    return user?.trim() || DEFAULT_USER;
  }

  /** Data de referência resolvida na borda: default = hoje civil. */
  private referenceDate(effectiveOn?: string): Date {
    return effectiveOn ? toCivilDate(effectiveOn) : todayCivilDate();
  }
}
