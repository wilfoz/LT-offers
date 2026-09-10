import { Module } from '@nestjs/common';
import { EconomicResultController } from './economic-result.controller';
import { EconomicResultService } from './economic-result.service';
import { PrismaService } from '../app/prisma.service';

@Module({
  controllers: [EconomicResultController],
  providers: [EconomicResultService, PrismaService],
  exports: [EconomicResultService],
})
export class EconomicResultModule {}
