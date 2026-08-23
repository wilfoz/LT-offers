import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('GET /health', () => {
    it('retorna status ok e versão', () => {
      const appController = app.get<AppController>(AppController);
      const saude = appController.saude();
      expect(saude.status).toBe('ok');
      expect(typeof saude.versao).toBe('string');
    });
  });
});
