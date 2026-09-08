import {
  PaginatedStakingTowers,
  PlsCaddImportPreview,
  PreliminaryStakingDistributionItem,
  PreliminaryStakingDistributionPayload,
  StakingTowerInput,
  StakingTowerItem,
  StakingValidationSummary,
} from '@lt-offers/domain';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { BatchAssignStakingDto } from './dto/batch-assign-staking.dto';
import { CreateStakingTowerDto } from './dto/create-staking-tower.dto';
import { PlsCaddCommitDto } from './dto/pls-cadd-commit.dto';
import { SavePreliminaryStakingDistributionDto } from './dto/preliminary-staking-distribution.dto';
import { StakingQueryDto } from './dto/staking-query.dto';
import { UpdateStakingTowerDto } from './dto/update-staking-tower.dto';
import { StakingService } from './staking.service';

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
  constructor(private readonly service: StakingService) {}

  @Get()
  async getPaginated(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Query() query: StakingQueryDto,
  ): Promise<PaginatedStakingTowers> {
    return this.service.getPaginatedTowers(lineId, query);
  }

  @Get('integrity-summary')
  async getIntegritySummary(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<StakingValidationSummary> {
    return this.service.validateIntegrity(lineId);
  }

  @Get('preliminary-distribution')
  async getPreliminaryDistribution(
    @Param('lineId', ParseIntPipe) lineId: number,
  ): Promise<PreliminaryStakingDistributionItem | null> {
    return this.service.getPreliminaryDistribution(lineId);
  }

  @Put('preliminary-distribution')
  async savePreliminaryDistribution(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() dto: SavePreliminaryStakingDistributionDto,
  ): Promise<PreliminaryStakingDistributionItem> {
    return this.service.savePreliminaryDistribution(
      lineId,
      dto as PreliminaryStakingDistributionPayload,
    );
  }

  @Post('preview-import')
  @UseInterceptors(FileInterceptor('file'))
  async previewImport(
    @Param('lineId', ParseIntPipe) lineId: number,
    @UploadedFile() file?: UploadedMulterFile,
    @Body() body?: PreviewBodyDto,
  ): Promise<PlsCaddImportPreview> {
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

    return this.service.previewPlsCaddImport(lineId, buffer, fileName);
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
    return this.service.commitPlsCaddImport(lineId, dto);
  }

  @Post('batch-assign')
  @HttpCode(HttpStatus.OK)
  async batchAssign(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() dto: BatchAssignStakingDto,
  ): Promise<{ updatedCount: number }> {
    return this.service.batchAssign(lineId, dto);
  }

  @Get(':towerId')
  async getById(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Param('towerId', ParseIntPipe) towerId: number,
  ): Promise<StakingTowerItem> {
    return this.service.getTowerById(lineId, towerId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body() dto: CreateStakingTowerDto,
  ): Promise<StakingTowerItem> {
    return this.service.createTower(lineId, dto as StakingTowerInput);
  }

  @Patch(':towerId')
  async update(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Param('towerId', ParseIntPipe) towerId: number,
    @Body() dto: UpdateStakingTowerDto,
  ): Promise<StakingTowerItem> {
    return this.service.updateTower(
      lineId,
      towerId,
      dto as Partial<StakingTowerInput>,
    );
  }

  @Delete(':towerId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('lineId', ParseIntPipe) lineId: number,
    @Param('towerId', ParseIntPipe) towerId: number,
  ): Promise<void> {
    await this.service.deleteTower(lineId, towerId);
  }
}
