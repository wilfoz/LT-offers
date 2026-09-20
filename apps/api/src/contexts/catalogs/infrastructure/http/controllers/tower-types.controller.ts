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
import { TowerTypesUseCases } from '../../../application';
import {
  createIdPipe,
  handleCatalogDomainError,
  resolveAuthor,
  resolveReferenceDate,
  versionImmutableException,
} from '../controller-shared';
import { CreateTowerTypeDto } from '../dto/create-tower-type.dto';
import { CreateTowerTypeVersionDto } from '../dto/create-tower-type-version.dto';
import { CatalogPresenter } from '../presenters/catalog.presenter';

const IdPipe = createIdPipe();

@Controller('catalogs/structure-series/:seriesId/tower-types')
export class TowerTypesController {
  constructor(private readonly useCases: TowerTypesUseCases) {}

  @Post()
  async create(
    @Param('seriesId', IdPipe) seriesId: number,
    @Body() dto: CreateTowerTypeDto,
    @Headers('x-user') user?: string,
  ) {
    try {
      const entity = await this.useCases.create(
        seriesId,
        {
          code: dto.code,
          function: dto.function as any,
          guyCount: dto.guyCount,
          weights: dto.weights?.map((w) => ({
            heightM: String(w.heightM),
            weightKg: String(w.weightKg),
          })),
          effectiveFrom: dto.effectiveFrom,
        },
        resolveAuthor(user),
        resolveReferenceDate(),
      );
      return CatalogPresenter.toTowerTypeSummary(
        entity,
        resolveReferenceDate(),
      );
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Get()
  async list(
    @Param('seriesId', IdPipe) seriesId: number,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    try {
      const refDate = resolveReferenceDate(effectiveOn);
      const items = await this.useCases.listBySeries(seriesId, refDate);
      return items.map((item) =>
        CatalogPresenter.toTowerTypeSummary(item, refDate),
      );
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Get(':id')
  async get(
    @Param('seriesId', IdPipe) seriesId: number,
    @Param('id', IdPipe) id: number,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    try {
      const refDate = resolveReferenceDate(effectiveOn);
      const { entity } = await this.useCases.get(seriesId, id, refDate);
      return CatalogPresenter.toTowerTypeSummary(entity, refDate);
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Get(':id/history')
  async listHistory(
    @Param('seriesId', IdPipe) seriesId: number,
    @Param('id', IdPipe) id: number,
  ) {
    try {
      const entity = await this.useCases.listHistory(seriesId, id);
      return CatalogPresenter.toTowerTypeHistory(entity);
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Post(':id/versions')
  async createVersion(
    @Param('seriesId', IdPipe) seriesId: number,
    @Param('id', IdPipe) id: number,
    @Body() dto: CreateTowerTypeVersionDto,
    @Headers('x-user') user?: string,
  ) {
    try {
      const version = await this.useCases.createVersion(
        seriesId,
        id,
        {
          guyCount: dto.guyCount,
          weights: dto.weights?.map((w) => ({
            heightM: String(w.heightM),
            weightKg: String(w.weightKg),
          })),
          effectiveFrom: dto.effectiveFrom,
        },
        resolveAuthor(user),
      );
      return CatalogPresenter.toTowerTypeVersion(version);
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Put(':id/versions/:versionId')
  replaceVersion(): never {
    throw versionImmutableException();
  }

  @Patch(':id/versions/:versionId')
  patchVersion(): never {
    throw versionImmutableException();
  }
}
