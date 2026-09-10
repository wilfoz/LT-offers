import { Module } from '@nestjs/common';
import { TaxTablesService } from './tax-tables.service';
import { TaxationController } from './taxation.controller';

@Module({
  controllers: [TaxationController],
  providers: [TaxTablesService],
  exports: [TaxTablesService],
})
export class TaxationModule {}
