import { Module } from '@nestjs/common';
import { ElectromechanicalService } from './electromechanical.service';
import { ElectromechanicalController } from './electromechanical.controller';
import { PrismaService } from '../app/prisma.service';

@Module({
  controllers: [ElectromechanicalController],
  providers: [ElectromechanicalService, PrismaService],
  exports: [ElectromechanicalService],
})
export class ElectromechanicalModule {}
