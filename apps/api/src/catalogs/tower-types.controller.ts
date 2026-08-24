import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { todayCivilDate } from './civil-date';
import {
  createIdPipe,
  resolveAuthor,
  resolveReferenceDate,
  versionImmutableException,
} from './controller-shared';
import { CreateTowerTypeDto } from './dto/create-tower-type.dto';
import { CreateTowerTypeVersionDto } from './dto/create-tower-type-version.dto';
import { TowerTypesService } from './tower-types.service';

const IdPipe = createIdPipe();

// Aninhamento completo (design D2): todo acesso a tipo de torre passa pela
// série; o pertencimento é validado no service (404 para id de outra série).
@Controller('catalogs/structure-series/:seriesId/tower-types')
export class TowerTypesController {
  constructor(private readonly service: TowerTypesService) {}

  @Post()
  create(
    @Param('seriesId', IdPipe) seriesId: number,
    @Body() dto: CreateTowerTypeDto,
    @Headers('x-user') user?: string,
  ) {
    return this.service.create(
      seriesId,
      dto,
      resolveAuthor(user),
      todayCivilDate(),
    );
  }

  @Get()
  list(
    @Param('seriesId', IdPipe) seriesId: number,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    return this.service.list(seriesId, resolveReferenceDate(effectiveOn));
  }

  @Get(':id')
  get(
    @Param('seriesId', IdPipe) seriesId: number,
    @Param('id', IdPipe) id: number,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    return this.service.get(seriesId, id, resolveReferenceDate(effectiveOn));
  }

  @Get(':id/history')
  listHistory(
    @Param('seriesId', IdPipe) seriesId: number,
    @Param('id', IdPipe) id: number,
  ) {
    return this.service.listHistory(seriesId, id);
  }

  @Post(':id/versions')
  createVersion(
    @Param('seriesId', IdPipe) seriesId: number,
    @Param('id', IdPipe) id: number,
    @Body() dto: CreateTowerTypeVersionDto,
    @Headers('x-user') user?: string,
  ) {
    return this.service.createVersion(seriesId, id, dto, resolveAuthor(user));
  }

  // Decoradores @Put/@Patch empilhados no mesmo método NÃO registram duas
  // rotas (o mais externo sobrescreve o metadata) — por isso dois métodos.
  @Put(':id/versions/:versionId')
  replaceVersion(): never {
    throw versionImmutableException();
  }

  @Patch(':id/versions/:versionId')
  patchVersion(): never {
    throw versionImmutableException();
  }
}
