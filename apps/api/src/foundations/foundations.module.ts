import { Module } from '@nestjs/common';
import { PrismaModule } from '../app/prisma.module';
import { FoundationsController } from './foundations.controller';
import { FoundationsService } from './foundations.service';

@Module({
  imports: [PrismaModule],
  controllers: [FoundationsController],
  providers: [FoundationsService],
  exports: [FoundationsService],
})
export class FoundationsModule {}
