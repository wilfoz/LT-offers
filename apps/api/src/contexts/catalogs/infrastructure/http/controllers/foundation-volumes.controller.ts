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
import { FoundationVolumesUseCases } from '../../../application';
import {
  createIdPipe,
  handleCatalogDomainError,
  resolveAuthor,
  resolveReferenceDate,
  versionImmutableException,
} from '../controller-shared';
import { CreateFoundationVolumeDto } from '../dto/create-foundation-volume.dto';
import { CreateFoundationVolumeVersionDto } from '../dto/create-foundation-volume-version.dto';
import { CatalogPresenter } from '../presenters/catalog.presenter';

const IdPipe = createIdPipe();

@Controller('catalogs/foundation-volumes')
export class FoundationVolumesController {
  constructor(private readonly useCases: FoundationVolumesUseCases) {}

  private optionalId(
    raw: string | undefined,
    label: string,
  ): number | undefined {
    if (raw === undefined || raw === null || raw.trim() === '') {
      return undefined;
    }
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(
        `O filtro de ${label} deve ser um identificador inteiro positivo`,
      );
    }
    return parsed;
  }

  @Post()
  async create(
    @Body() dto: CreateFoundationVolumeDto,
    @Headers('x-user') user?: string,
  ) {
    try {
      const entity = await this.useCases.create(
        dto,
        resolveAuthor(user),
        resolveReferenceDate(),
      );
      return CatalogPresenter.toFoundationVolumeSummary(
        entity,
        resolveReferenceDate(),
      );
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Get()
  async list(
    @Query('towerTypeId') towerTypeId?: string,
    @Query('soilTypeId') soilTypeId?: string,
    @Query('foundationTypeId') foundationTypeId?: string,
    @Query('effectiveOn') effectiveOn?: string,
  ) {
    try {
      const refDate = resolveReferenceDate(effectiveOn);
      const items = await this.useCases.list(
        {
          towerTypeId: this.optionalId(towerTypeId, 'tipo de torre'),
          soilTypeId: this.optionalId(soilTypeId, 'tipo de solo'),
          foundationTypeId: this.optionalId(
            foundationTypeId,
            'tipo de fundação',
          ),
        },
        refDate,
      );
      return items.map((item) =>
        CatalogPresenter.toFoundationVolumeSummary(item, refDate),
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
      return CatalogPresenter.toFoundationVolumeSummary(entity, refDate);
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Get(':id/history')
  async listHistory(@Param('id', IdPipe) id: number) {
    try {
      const entity = await this.useCases.listHistory(id);
      return CatalogPresenter.toFoundationVolumeHistory(entity);
    } catch (error) {
      handleCatalogDomainError(error);
    }
  }

  @Post(':id/versions')
  async createVersion(
    @Param('id', IdPipe) id: number,
    @Body() dto: CreateFoundationVolumeVersionDto,
    @Headers('x-user') user?: string,
  ) {
    try {
      const version = await this.useCases.createVersion(
        id,
        dto,
        resolveAuthor(user),
      );
      return CatalogPresenter.toFoundationVolumeVersion(version);
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
