import { Inject, Injectable } from '@nestjs/common';
import { PlsCaddImportPreview } from '@lt-offers/domain';
import {
  StakingTowersRepository,
  StakingCatalogQueryPort,
  STAKING_TOWERS_REPOSITORY_TOKEN,
  STAKING_CATALOG_QUERY_PORT_TOKEN,
} from '../../domain';
import { PlsCaddParser } from '../services/pls-cadd-parser.service';

@Injectable()
export class PreviewPlsCaddImportUseCase {
  constructor(
    @Inject(STAKING_TOWERS_REPOSITORY_TOKEN)
    private readonly towersRepo: StakingTowersRepository,
    @Inject(STAKING_CATALOG_QUERY_PORT_TOKEN)
    private readonly catalogQuery: StakingCatalogQueryPort,
  ) {}

  async execute(
    lineId: number,
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<PlsCaddImportPreview> {
    const line = await this.catalogQuery.ensureTransmissionLineExists(lineId);

    const parsedRows = PlsCaddParser.parse(fileBuffer);

    const existingTowers = await this.towersRepo.findManyByLineId(lineId);

    const existingTowerNumbers = new Set(
      existingTowers.map((t) => t.towerNumber.toUpperCase()),
    );

    const existingAssignmentsCount = existingTowers.filter(
      (t) =>
        t.soilTypeId !== null ||
        t.foundationTypeId !== null ||
        t.notes !== null,
    ).length;

    const refinedLengthKm = Number(line.refinedLengthKm);

    return PlsCaddParser.buildPreview(
      fileName,
      parsedRows,
      existingTowerNumbers,
      existingAssignmentsCount,
      refinedLengthKm,
    );
  }
}
