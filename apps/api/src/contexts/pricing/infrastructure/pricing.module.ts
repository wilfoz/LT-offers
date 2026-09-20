import { Module } from '@nestjs/common';
import { PrismaService } from '../../../app/prisma.service';
import { FoundationsModule } from '../../foundations/infrastructure/foundations.module';
import { TaxationModule } from '../../taxation/infrastructure/taxation.module';
import {
  PRICING_DATA_QUERY_PORT_TOKEN,
  QUOTES_QUERY_PORT_TOKEN,
} from '../domain';
import { CalculateLinePricingUseCase, GetQuotesUseCase } from '../application';
import { PrismaPricingDataQueryAdapter } from './database/prisma/prisma-pricing-data-query.adapter';
import { StaticQuotesAdapter } from './static/static-quotes.adapter';
import { PricingController } from './http/controllers/pricing.controller';

const useCases = [GetQuotesUseCase, CalculateLinePricingUseCase];

@Module({
  imports: [FoundationsModule, TaxationModule],
  controllers: [PricingController],
  providers: [
    PrismaService,
    PrismaPricingDataQueryAdapter,
    StaticQuotesAdapter,
    {
      provide: PRICING_DATA_QUERY_PORT_TOKEN,
      useClass: PrismaPricingDataQueryAdapter,
    },
    {
      provide: QUOTES_QUERY_PORT_TOKEN,
      useClass: StaticQuotesAdapter,
    },
    ...useCases,
  ],
  exports: [...useCases],
})
export class PricingModule {}
