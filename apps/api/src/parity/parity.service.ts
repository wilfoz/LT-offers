import { Injectable, NotFoundException } from '@nestjs/common';
import { HistoricalOfferFixture, ParityReport } from '@lt-offers/domain';
import {
  FullOfferPipelineRunner,
  ParityEvaluator,
  ParityReportGenerator,
  SOLARIS_MG_500KV_FIXTURE,
  TUCANO_MULTILINE_FIXTURE,
  REIDI_DIRECT_BILL_FIXTURE,
} from '@lt-offers/calc-engine';

@Injectable()
export class ParityService {
  private readonly runner = new FullOfferPipelineRunner();
  private readonly evaluator = new ParityEvaluator();
  private readonly reportGenerator = new ParityReportGenerator();

  private readonly fixtures: Record<string, HistoricalOfferFixture> = {
    solaris: SOLARIS_MG_500KV_FIXTURE,
    tucano: TUCANO_MULTILINE_FIXTURE,
    reidi: REIDI_DIRECT_BILL_FIXTURE,
  };

  /**
   * Retorna a lista de perfis de referência disponíveis.
   */
  getAvailableProfiles(): Array<{
    key: string;
    code: string;
    name: string;
    description: string;
  }> {
    return Object.entries(this.fixtures).map(([key, f]) => ({
      key,
      code: f.code,
      name: f.name,
      description: f.description,
    }));
  }

  /**
   * Executa a validação de paridade para um perfil específico ou todos.
   */
  evaluateProfile(profileKey: string): ParityReport {
    const fixture = this.fixtures[profileKey.toLowerCase()];
    if (!fixture) {
      throw new NotFoundException(
        `Perfil histórico '${profileKey}' não encontrado.`,
      );
    }

    // Borda do sistema: o relógio é resolvido aqui e injetado no motor (RNF-04).
    const runResult = this.runner.run(fixture, () => Date.now());
    return this.evaluator.evaluate(fixture, runResult, new Date());
  }

  /**
   * Executa a avaliação de todos os perfis e retorna os relatórios consolidados.
   */
  evaluateAllProfiles(): ParityReport[] {
    return Object.keys(this.fixtures).map((key) => this.evaluateProfile(key));
  }

  /**
   * Retorna o relatório formatado em Markdown para visualização/auditoria.
   */
  getProfileMarkdownReport(profileKey: string): string {
    const report = this.evaluateProfile(profileKey);
    return this.reportGenerator.generateMarkdown(report);
  }
}
