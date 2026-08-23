import { Injectable } from '@nestjs/common';

export interface SaudeApi {
  status: 'ok';
  versao: string;
}

@Injectable()
export class AppService {
  saude(): SaudeApi {
    return { status: 'ok', versao: process.env.APP_VERSAO ?? '0.0.0' };
  }
}
