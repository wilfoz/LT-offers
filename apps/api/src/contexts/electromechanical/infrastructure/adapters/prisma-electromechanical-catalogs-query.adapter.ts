import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../app/prisma.service';
import { ElectromechanicalCatalogsQueryPort } from '../../domain';

@Injectable()
export class PrismaElectromechanicalCatalogsQueryAdapter implements ElectromechanicalCatalogsQueryPort {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async loadEffectiveCatalogs(referenceDate?: string): Promise<{
    referenceDate?: string;
  }> {
    return {
      referenceDate,
    };
  }
}
