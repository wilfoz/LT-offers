import { Module } from '@nestjs/common';
import { CatalogosModule } from '../catalogos/catalogos.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, CatalogosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
