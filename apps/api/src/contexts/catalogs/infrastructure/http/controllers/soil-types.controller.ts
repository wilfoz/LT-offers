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
import { SoilTypesUseCases } from '../../../application';
import {
  createIdPipe,
  handleCatalogDomainError,
  resolveAuthor,
  resolveReferenceDate,
  versionImmutableException,
} from '../controller-shared';
import { CreateSoilTypeDto } from '../dto/create-soil-type.dto';
import { CreateSoilTypeVersionDto } from '../dto/create-soil-type-version.dto';
import { CatalogPresenter } from '../presenters/catalog.presenter';

const IdPipe = createIdPipe();

@Controller('catalogs/soil-types')
export class SoilTypesController {
  constructor(private readonly useCases: SoilTypesUseCases) {}

  @Post()
  async create(
    @Body() dto: CreateSoilTypeDto,
    @Headers('x-user') user?: string,
  ) {
    try {
      const entity = await this.useCases.create(
        dto,
        resolveAuthor(user),
        resolveReferenceDate(),
      );
      return CatalogPresenter.toSoilTypeSummary(entity, resolveReferenceDate());
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Get()
  async list(
    @Query('search') search?: string,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    try {
      const refDate = resolveReferenceDate(effectiveOn);
      const items = await this.useCases.list(search, refDate);
      return items.map((item) =>
        CatalogPresenter.toSoilTypeSummary(item, refDate),
      );
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Get(':id')
  async get(
    @Param('id', IdPipe) id: number,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    try {
      const refDate = resolveReferenceDate(effectiveOn);
      const { entity } = await this.useCases.get(id, refDate);
      return CatalogPresenter.toSoilTypeSummary(entity, refDate);
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Get(':id/history')
  async listHistory(@Param('id', IdPipe) id: number) {
    try {
      const entity = await this.useCases.listHistory(id);
      return CatalogPresenter.toSoilTypeHistory(entity);
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Post(':id/versions')
  async createVersion(
    @Param('id', IdPipe) id: number,
    @Body() dto: CreateSoilTypeVersionDto,
    @Headers('x-user') user?: string,
  ) {
    try {
      const version = await this.useCases.createVersion(
        id,
        dto,
        resolveAuthor(user),
      );
      return CatalogPresenter.toSoilTypeVersion(version);
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
