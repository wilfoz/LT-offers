import { Module } from '@nestjs/common';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule, CatalogsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
