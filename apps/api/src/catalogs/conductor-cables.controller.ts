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
import { ConductorCablesService } from './conductor-cables.service';
import {
  createIdPipe,
  resolveAuthor,
  resolveReferenceDate,
  versionImmutableException,
} from './controller-shared';
import { todayCivilDate } from './civil-date';
import { CreateConductorCableDto } from './dto/create-conductor-cable.dto';
import { CreateVersionDto } from './dto/create-version.dto';

const IdPipe = createIdPipe();

@Controller('catalogs/conductor-cables')
export class ConductorCablesController {
  constructor(private readonly service: ConductorCablesService) {}

  @Post()
  create(
    @Body() dto: CreateConductorCableDto,
    @Headers('x-user') user?: string,
  ) {
    return this.service.create(dto, resolveAuthor(user), todayCivilDate());
  }

  @Get()
  list(
    @Query('search') search?: string,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    return this.service.list(search, resolveReferenceDate(effectiveOn));
  }

  @Get(':id')
  get(
    @Param('id', IdPipe) id: number,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    return this.service.get(id, resolveReferenceDate(effectiveOn));
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
    return this.service.createVersion(id, dto, resolveAuthor(user));
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
