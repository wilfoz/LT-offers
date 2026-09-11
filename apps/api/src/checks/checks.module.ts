import { Module } from '@nestjs/common';
import { PrismaModule } from '../app/prisma.module';
import { ChecksController } from './checks.controller';
import { ChecksService } from './checks.service';

@Module({
  imports: [PrismaModule],
  controllers: [ChecksController],
  providers: [ChecksService],
  exports: [ChecksService],
})
export class ChecksModule {}
