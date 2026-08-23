import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    })
      .useMocker((token) => {
        if (token === PrismaService) {
          return { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
        }
        return undefined;
      })
      .compile();
  });

  describe('GET /health', () => {
    it('retorna status ok, versão e banco ok', async () => {
      const appController = app.get<AppController>(AppController);
      const saude = await appController.saude();
      expect(saude.status).toBe('ok');
      expect(saude.banco).toBe('ok');
      expect(typeof saude.versao).toBe('string');
    });
  });
});
