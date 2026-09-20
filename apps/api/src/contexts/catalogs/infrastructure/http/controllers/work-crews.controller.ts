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
import { WorkCrewsUseCases } from '../../../application';
import {
  createIdPipe,
  handleCatalogDomainError,
  resolveAuthor,
  resolveReferenceDate,
  versionImmutableException,
} from '../controller-shared';
import { CreateWorkCrewDto } from '../dto/create-work-crew.dto';
import { CreateWorkCrewVersionDto } from '../dto/create-work-crew-version.dto';
import { CatalogPresenter } from '../presenters/catalog.presenter';

const IdPipe = createIdPipe();

@Controller('catalogs/work-crews')
export class WorkCrewsController {
  constructor(private readonly useCases: WorkCrewsUseCases) {}

  @Post()
  async create(
    @Body() dto: CreateWorkCrewDto,
    @Headers('x-user') user?: string,
  ) {
    try {
      const entity = await this.useCases.create(
        {
          code: dto.code,
          name: dto.name,
          standardProductionRate: dto.standardProductionRate,
          productionUnit: dto.productionUnit,
          productionPeriod: dto.productionPeriod as any,
          laborRoles: dto.laborRoles?.map((lr) => ({
            laborRoleId: lr.laborRoleId,
            quantity: String(lr.quantity),
          })),
          equipments: dto.equipments?.map((eq) => ({
            equipmentId: eq.equipmentId,
            quantity: String(eq.quantity),
          })),
          effectiveFrom: dto.effectiveFrom,
        },
        resolveAuthor(user),
        resolveReferenceDate(),
      );
      return CatalogPresenter.toWorkCrewSummary(entity, resolveReferenceDate());
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
        CatalogPresenter.toWorkCrewSummary(item, refDate),
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
      return CatalogPresenter.toWorkCrewSummary(entity, refDate);
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Get(':id/history')
  async listHistory(@Param('id', IdPipe) id: number) {
    try {
      const entity = await this.useCases.listHistory(id);
      return CatalogPresenter.toWorkCrewHistory(entity);
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Post(':id/versions')
  async createVersion(
    @Param('id', IdPipe) id: number,
    @Body() dto: CreateWorkCrewVersionDto,
    @Headers('x-user') user?: string,
  ) {
    try {
      const version = await this.useCases.createVersion(
        id,
        {
          standardProductionRate: dto.standardProductionRate,
          productionUnit: dto.productionUnit,
          productionPeriod: dto.productionPeriod as any,
          laborRoles: dto.laborRoles?.map((lr) => ({
            laborRoleId: lr.laborRoleId,
            quantity: String(lr.quantity),
          })),
          equipments: dto.equipments?.map((eq) => ({
            equipmentId: eq.equipmentId,
            quantity: String(eq.quantity),
          })),
          effectiveFrom: dto.effectiveFrom,
        },
        resolveAuthor(user),
      );
      return CatalogPresenter.toWorkCrewVersion(version);
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
