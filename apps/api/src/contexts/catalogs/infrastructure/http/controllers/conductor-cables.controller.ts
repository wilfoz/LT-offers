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
import { ConductorCablesUseCases } from '../../../application';
import {
  createIdPipe,
  handleCatalogDomainError,
  resolveAuthor,
  resolveReferenceDate,
  versionImmutableException,
} from '../controller-shared';
import { CreateConductorCableDto } from '../dto/create-conductor-cable.dto';
import { CreateVersionDto } from '../dto/create-version.dto';
import { CatalogPresenter } from '../presenters/catalog.presenter';

const IdPipe = createIdPipe();

@Controller('catalogs/conductor-cables')
export class ConductorCablesController {
  constructor(private readonly useCases: ConductorCablesUseCases) {}

  @Post()
  async create(
    @Body() dto: CreateConductorCableDto,
    @Headers('x-user') user?: string,
  ) {
    try {
      const entity = await this.useCases.create(
        dto,
        resolveAuthor(user),
        resolveReferenceDate(),
      );
      return CatalogPresenter.toConductorCableSummary(
        entity,
        resolveReferenceDate(),
      );
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
        CatalogPresenter.toConductorCableSummary(item, refDate),
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
      return CatalogPresenter.toConductorCableSummary(entity, refDate);
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Get(':id/history')
  async listHistory(@Param('id', IdPipe) id: number) {
    try {
      const entity = await this.useCases.listHistory(id);
      return CatalogPresenter.toConductorCableHistory(entity);
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Post(':id/versions')
  async createVersion(
    @Param('id', IdPipe) id: number,
    @Body() dto: CreateVersionDto,
    @Headers('x-user') user?: string,
  ) {
    try {
      const version = await this.useCases.createVersion(
        id,
        dto,
        resolveAuthor(user),
      );
      return CatalogPresenter.toConductorCableVersion(version);
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
