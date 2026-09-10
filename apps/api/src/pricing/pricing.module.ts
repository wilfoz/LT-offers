import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingController } from './pricing.controller';
import { PrismaModule } from '../app/prisma.module';
import { FoundationsModule } from '../foundations/foundations.module';
import { TaxationModule } from '../taxation/taxation.module';

@Module({
  imports: [PrismaModule, FoundationsModule, TaxationModule],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
