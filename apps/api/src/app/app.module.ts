import { Module } from '@nestjs/common';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { OffersModule } from '../offers/offers.module';
import { StakingModule } from '../staking/staking.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, CatalogsModule, OffersModule, StakingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
