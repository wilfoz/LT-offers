import {
  FoundationMatrixLookupItem,
  FoundationVolumeQuantities,
  FOUNDATION_VOLUME_QUANTITY_FIELDS,
} from '@lt-offers/domain';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../../app/prisma.service';
import { FoundationVolumeMatricesQueryPort } from '../../../../domain';

@Injectable()
export class PrismaFoundationVolumeMatricesQueryAdapter implements FoundationVolumeMatricesQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async loadEffectiveVolumeMatrices(): Promise<FoundationMatrixLookupItem[]> {
    const volumes = await this.prisma.foundationVolume.findMany({
      include: {
        versions: {
          orderBy: { effectiveFrom: 'desc' },
          take: 1,
        },
      },
    });

    const result: FoundationMatrixLookupItem[] = [];

    for (const v of volumes) {
      const latestVersion = v.versions[0];
      if (!latestVersion) continue;

      const quantities = {} as FoundationVolumeQuantities;
      for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
        const val = latestVersion[field];
        quantities[field] =
          val !== null && val !== undefined ? val.toString() : null;
      }

      result.push({
        towerTypeId: v.towerTypeId,
        soilTypeId: v.soilTypeId,
        foundationTypeId: v.foundationTypeId,
        quantities,
      });
    }

    return result;
  }
}
