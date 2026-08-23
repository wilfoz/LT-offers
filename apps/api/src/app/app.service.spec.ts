import { Test } from '@nestjs/testing';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

describe('AppService', () => {
  async function criarServico(queryRaw: jest.Mock): Promise<AppService> {
    const app = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: PrismaService, useValue: { $queryRaw: queryRaw } },
      ],
    }).compile();
    return app.get<AppService>(AppService);
  }

  it('retorna banco ok quando a query de saúde responde', async () => {
    const service = await criarServico(
      jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    );
    const saude = await service.saude();
    expect(saude.status).toBe('ok');
    expect(saude.banco).toBe('ok');
  });

  it('retorna degradado quando o banco está indisponível', async () => {
    const service = await criarServico(
      jest.fn().mockRejectedValue(new Error('sem conexão')),
    );
    const saude = await service.saude();
    expect(saude.status).toBe('degradado');
    expect(saude.banco).toBe('indisponivel');
  });
});
