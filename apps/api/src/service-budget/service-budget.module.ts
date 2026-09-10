import { Module } from '@nestjs/common';
import { ServiceBudgetController } from './service-budget.controller';
import { ServiceBudgetService } from './service-budget.service';
import { PrismaService } from '../app/prisma.service';

@Module({
  controllers: [ServiceBudgetController],
  providers: [ServiceBudgetService, PrismaService],
  exports: [ServiceBudgetService],
})
export class ServiceBudgetModule {}
