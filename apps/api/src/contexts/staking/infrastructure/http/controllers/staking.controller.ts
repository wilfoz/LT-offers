import {
  PaginatedStakingTowers,
  PlsCaddImportPreview,
  PreliminaryStakingDistributionItem,
  StakingTowerItem,
  StakingValidationSummary,
} from '@lt-offers/domain';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  StakingTowerNotFoundException,
  TransmissionLineNotFoundException,
  DuplicateTowerNumberException,
  InvalidStakingDistributionException,
  PlsCaddParsingException,
  InvalidTowerCombinationException,
} from '../../../domain';
import {
  GetPaginatedStakingTowersUseCase,
  GetStakingTowerByIdUseCase,
  CreateStakingTowerUseCase,
  UpdateStakingTowerUseCase,
  DeleteStakingTowerUseCase,
  BatchAssignStakingUseCase,
  ValidateStakingIntegrityUseCase,
  GetPreliminaryDistributionUseCase,
  SavePreliminaryDistributionUseCase,
  PreviewPlsCaddImportUseCase,
  CommitPlsCaddImportUseCase,
} from '../../../application';
import {
  StakingQueryDto,
  CreateStakingTowerDto,
  UpdateStakingTowerDto,
  BatchAssignStakingDto,
  SavePreliminaryStakingDistributionDto,
  PlsCaddCommitDto,
} from '../dto';
import { StakingPresenter } from '../presenters/staking.presenter';

export interface UploadedMulterFile {
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  mimetype?: string;
  size?: number;
  buffer: Buffer;
}

interface PreviewBodyDto {
  fileBase64?: string;
  fileName?: string;
}

@Controller('lines/:lineId/staking')
export class StakingController {
  constructor(
    private readonly getPaginatedUseCase: GetPaginatedStakingTowersUseCase,
    private readonly getByIdUseCase: GetStakingTowerByIdUseCase,
    private readonly createTowerUseCase: CreateStakingTowerUseCase,
    private readonly updateTowerUseCase: UpdateStakingTowerUseCase,
    private readonly deleteTowerUseCase: DeleteStakingTowerUseCase,
    private readonly batchAssignUseCase: BatchAssignStakingUseCase,
    private readonly validateIntegrityUseCase: ValidateStakingIntegrityUseCase,
    private readonly getPreliminaryDistributionUseCase: GetPreliminaryDistributionUseCase,
    private readonly savePreliminaryDistributionUseCase: SavePreliminaryDistributionUseCase,
    private readonly previewImportUseCase: PreviewPlsCaddImportUseCase,
    private readonly commitImportUseCase: CommitPlsCaddImportUseCase,
  ) {}

  private handleDomainException(error: unknown): never {
    if (
      error instanceof StakingTowerNotFoundException ||
      error instanceof TransmissionLineNotFoundException
    ) {
      throw new NotFoundException(error.message);
    }
    if (
      error instanceof DuplicateTowerNumberException ||
      error instanceof InvalidStakingDistributionException ||
      error instanceof PlsCaddParsingException ||
      error instanceof InvalidTowerCombinationException
    ) {
      throw new BadRequestException(error.message);
    }
    throw error;
  }

  @Get()
  async getPaginated(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Query() query: StakingQueryDto,
  ): Promise<PaginatedStakingTowers> {
    try {
      const result = await this.getPaginatedUseCase.execute(lineId, query);
      return StakingPresenter.toPaginatedStakingTowers(result);
    } catch (error) {
      this.handleDomainException(error);
    }
  }

  @Get('integrity-summary')
  async getIntegritySummary(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<StakingValidationSummary> {
    try {
      const report = await this.validateIntegrityUseCase.execute(lineId);
      return StakingPresenter.toStakingValidationSummary(report);
    } catch (error) {
      this.handleDomainException(error);
    }
  }

  @Get('preliminary-distribution')
  async getPreliminaryDistribution(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<PreliminaryStakingDistributionItem | null> {
    try {
      const dist = await this.getPreliminaryDistributionUseCase.execute(lineId);
      return dist
        ? StakingPresenter.toPreliminaryStakingDistributionItem(dist)
        : null;
    } catch (error) {
      this.handleDomainException(error);
    }
  }

  @Put('preliminary-distribution')
  async savePreliminaryDistribution(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() dto: SavePreliminaryStakingDistributionDto,
  ): Promise<PreliminaryStakingDistributionItem> {
    try {
      const saved = await this.savePreliminaryDistributionUseCase.execute(
        lineId,
        {
          soilPercentages: dto.soilPercentages.map((s) => ({
            itemId: s.id,
            code: s.code ?? '',
            name: s.name ?? '',
            percentage: s.percentage,
          })),
          foundationPercentages: dto.foundationPercentages.map((f) => ({
            itemId: f.id,
            code: f.code ?? '',
            name: f.name ?? '',
            percentage: f.percentage,
          })),
        },
      );
      return StakingPresenter.toPreliminaryStakingDistributionItem(saved);
    } catch (error) {
      this.handleDomainException(error);
    }
  }

  @Post('preview-import')
  @UseInterceptors(FileInterceptor('file'))
  async previewImport(
    @Param('lineId', ParseIntPipe) lineId: number,
    @UploadedFile() file?: UploadedMulterFile,
    @Body() body?: PreviewBodyDto,
  ): Promise<PlsCaddImportPreview> {
    try {
      let buffer: Buffer;
      let fileName = 'pls-cadd-upload.csv';

      if (file && file.buffer) {
        buffer = file.buffer;
        fileName = file.originalname || fileName;
      } else if (body?.fileBase64) {
        buffer = Buffer.from(body.fileBase64, 'base64');
        fileName = body.fileName || fileName;
      } else {
        buffer = Buffer.from('');
      }

      return await this.previewImportUseCase.execute(lineId, buffer, fileName);
    } catch (error) {
      this.handleDomainException(error);
    }
  }

  @Post('commit-import')
  @HttpCode(HttpStatus.OK)
  async commitImport(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() dto: PlsCaddCommitDto,
  ): Promise<{
    importedCount: number;
    updatedCount: number;
    preservedCount: number;
  }> {
    try {
      const result = await this.commitImportUseCase.execute(lineId, dto);
      return StakingPresenter.toPlsCaddCommitResponse(result);
    } catch (error) {
      this.handleDomainException(error);
    }
  }

  @Post('batch-assign')
  @HttpCode(HttpStatus.OK)
  async batchAssign(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() dto: BatchAssignStakingDto,
  ): Promise<{ updatedCount: number }> {
    try {
      return await this.batchAssignUseCase.execute(lineId, dto);
    } catch (error) {
      this.handleDomainException(error);
    }
  }

  @Get(':towerId')
  async getById(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Param('towerId', ParseIntPipe) towerId: number,
  ): Promise<StakingTowerItem> {
    try {
      const tower = await this.getByIdUseCase.execute(lineId, towerId);
      return StakingPresenter.toStakingTowerItem(tower);
    } catch (error) {
      this.handleDomainException(error);
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() dto: CreateStakingTowerDto,
  ): Promise<StakingTowerItem> {
    try {
      const created = await this.createTowerUseCase.execute(lineId, dto);
      return StakingPresenter.toStakingTowerItem(created);
    } catch (error) {
      this.handleDomainException(error);
    }
  }

  @Patch(':towerId')
  async update(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Param('towerId', ParseIntPipe) towerId: number,
    @Body() dto: UpdateStakingTowerDto,
  ): Promise<StakingTowerItem> {
    try {
      const updated = await this.updateTowerUseCase.execute(
        lineId,
        towerId,
        dto,
      );
      return StakingPresenter.toStakingTowerItem(updated);
    } catch (error) {
      this.handleDomainException(error);
    }
  }

  @Delete(':towerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Param('towerId', ParseIntPipe) towerId: number,
  ): Promise<void> {
    try {
      await this.deleteTowerUseCase.execute(lineId, towerId);
    } catch (error) {
      this.handleDomainException(error);
    }
  }
}
