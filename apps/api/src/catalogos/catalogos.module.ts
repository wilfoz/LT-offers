import { Module } from '@nestjs/common';
import { CabosCondutoresController } from './cabos-condutores.controller';
import { CabosCondutoresService } from './cabos-condutores.service';

@Module({
  controllers: [CabosCondutoresController],
  providers: [CabosCondutoresService],
})
export class CatalogosModule {}
