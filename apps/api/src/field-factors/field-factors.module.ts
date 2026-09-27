import { Module } from '@nestjs/common';
import { FieldFactorsService } from './field-factors.service';
import { FieldFactorsController } from './field-factors.controller';
import { AuthModule } from '../auth/auth.module';
import { ScheduleModule } from '../contexts/schedule/infrastructure/schedule.module';

@Module({
  // ScheduleModule provê a resolução da versão vigente dos parâmetros de
  // chuva (catálogo singleton do M07) consumida pelos endpoints de precipitação.
  imports: [AuthModule, ScheduleModule],
  controllers: [FieldFactorsController],
  providers: [FieldFactorsService],
  exports: [FieldFactorsService],
})
export class FieldFactorsModule {}
