import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ViabilityParameters,
  ViabilityParametersVersionItem,
} from '@lt-offers/domain';
import { PrismaService } from '../../../../app/prisma.service';
import { DuplicateViabilityParametersDateException } from '../../domain/exceptions/viability.exceptions';
import { ViabilityParametersRepository } from '../../domain/ports/viability-parameters.repository';

const Decimal = Prisma.Decimal;

type VersionRow = Prisma.ViabilityParameterVersionGetPayload<
  Record<string, never>
>;

@Injectable()
export class PrismaViabilityParametersRepository implements ViabilityParametersRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async findEffective(
    referenceDate: string,
  ): Promise<ViabilityParametersVersionItem | null> {
    const row = await this.prisma.viabilityParameterVersion.findFirst({
      where: { effectiveFrom: { lte: new Date(referenceDate) } },
      orderBy: { effectiveFrom: 'desc' },
    });
    return row ? toItem(row) : null;
  }

  async create(
    version: ViabilityParameters & { createdBy: string },
  ): Promise<ViabilityParametersVersionItem> {
    try {
      const row = await this.prisma.viabilityParameterVersion.create({
        data: {
          effectiveFrom: new Date(version.effectiveFrom),
          waccRealAfterTaxPercent: new Decimal(version.waccRealAfterTaxPercent),
          concessionYears: version.concessionYears,
          pisCofinsPercent: new Decimal(version.pisCofinsPercent),
          operationMaintenancePercent: new Decimal(
            version.operationMaintenancePercent,
          ),
          incomeTaxPercent: new Decimal(version.incomeTaxPercent),
          createdBy: version.createdBy,
        },
      });
      return toItem(row);
    } catch (error) {
      // P2002 no unique de vigência: duplicidade detectada pelo próprio banco.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new DuplicateViabilityParametersDateException(
          version.effectiveFrom,
        );
      }
      throw error;
    }
  }
}

function toItem(row: VersionRow): ViabilityParametersVersionItem {
  return {
    id: row.id,
    effectiveFrom: row.effectiveFrom.toISOString().slice(0, 10),
    waccRealAfterTaxPercent: row.waccRealAfterTaxPercent.toFixed(2),
    concessionYears: row.concessionYears,
    pisCofinsPercent: row.pisCofinsPercent.toFixed(2),
    operationMaintenancePercent: row.operationMaintenancePercent.toFixed(2),
    incomeTaxPercent: row.incomeTaxPercent.toFixed(2),
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
  };
}
