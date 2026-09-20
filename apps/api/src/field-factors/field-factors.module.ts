import { Module } from '@nestjs/common';
import { FieldFactorsService } from './field-factors.service';
import { FieldFactorsController } from './field-factors.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FieldFactorsController],
  providers: [FieldFactorsService],
  exports: [FieldFactorsService],
})
export class FieldFactorsModule {}
