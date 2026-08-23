import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface SaudeApi {
  status: 'ok' | 'degradado';
  versao: string;
  banco: 'ok' | 'indisponivel';
}

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async saude(): Promise<SaudeApi> {
    let banco: SaudeApi['banco'] = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      banco = 'indisponivel';
    }
    return {
      status: banco === 'ok' ? 'ok' : 'degradado',
      versao: process.env.APP_VERSAO ?? '0.0.0',
      banco,
    };
  }
}
