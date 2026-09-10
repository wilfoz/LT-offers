import { Module } from '@nestjs/common';
import { CashflowController } from './cashflow.controller';
import { CashflowService } from './cashflow.service';
import { PrismaService } from '../app/prisma.service';

@Module({
  controllers: [CashflowController],
  providers: [CashflowService, PrismaService],
  exports: [CashflowService],
})
export class CashflowModule {}
