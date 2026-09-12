import { Module } from '@nestjs/common';
import { ParityController } from './parity.controller';
import { ParityService } from './parity.service';

@Module({
  controllers: [ParityController],
  providers: [ParityService],
  exports: [ParityService],
})
export class ParityModule {}
