import {
  BadRequestException,
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
import { CreateFoundationVolumeDto } from './dto/create-foundation-volume.dto';
import { CreateFoundationVolumeVersionDto } from './dto/create-foundation-volume-version.dto';
import { FoundationVolumesService } from './foundation-volumes.service';

const IdPipe = createIdPipe();

@Controller('catalogs/foundation-volumes')
export class FoundationVolumesController {
  constructor(private readonly service: FoundationVolumesService) {}

  @Post()
  create(
    @Body() dto: CreateFoundationVolumeDto,
    @Headers('x-user') user?: string,
  ) {
    return this.service.create(dto, resolveAuthor(user), todayCivilDate());
  }

  @Get()
  list(
    @Query('towerTypeId') towerTypeId?: string,
    @Query('soilTypeId') soilTypeId?: string,
    @Query('foundationTypeId') foundationTypeId?: string,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    return this.service.list(
      {
        towerTypeId: this.optionalId(towerTypeId, 'tipo de torre'),
        soilTypeId: this.optionalId(soilTypeId, 'tipo de solo'),
        foundationTypeId: this.optionalId(foundationTypeId, 'tipo de fundação'),
      },
      resolveReferenceDate(effectiveOn),
    );
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
    @Body() dto: CreateFoundationVolumeVersionDto,
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

  /** Filtros de combinação validados na borda; ausência = sem filtro. */
  private optionalId(value: string | undefined, label: string) {
    if (value === undefined || value === '') {
      return undefined;
    }
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException(
        `O filtro de ${label} deve ser um identificador numérico`,
      );
    }
    return id;
  }
}
