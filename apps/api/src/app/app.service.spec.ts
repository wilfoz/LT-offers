import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('saude', () => {
    it('retorna status ok e versão', () => {
      const saude = service.saude();
      expect(saude.status).toBe('ok');
      expect(typeof saude.versao).toBe('string');
    });
  });
});
