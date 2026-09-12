import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ParityReport } from '@lt-offers/domain';
import { ParityService } from './parity.service';
import { RolesGuard } from '../auth/roles.guard';

@Controller('parity')
@UseGuards(RolesGuard)
export class ParityController {
  constructor(private readonly parityService: ParityService) {}

  /**
   * Lista todos os perfis históricos de referência disponíveis.
   */
  @Get('profiles')
  getProfiles(): Array<{ key: string; code: string; name: string; description: string }> {
    return this.parityService.getAvailableProfiles();
  }

  /**
   * Executa e retorna os relatórios de paridade de todos os perfis históricos.
   */
  @Get('reports')
  getAllReports(): ParityReport[] {
    return this.parityService.evaluateAllProfiles();
  }

  /**
   * Executa e retorna o relatório JSON de um perfil específico.
   */
  @Get('reports/:profileKey')
  getReportByProfile(@Param('profileKey') profileKey: string): ParityReport {
    return this.parityService.evaluateProfile(profileKey);
  }

  /**
   * Retorna o relatório formatado em Markdown de um perfil específico.
   */
  @Get('reports/:profileKey/markdown')
  getMarkdownReport(
    @Param('profileKey') profileKey: string,
    @Res() res: Response
  ): void {
    const md = this.parityService.getProfileMarkdownReport(profileKey);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(md);
  }
}
