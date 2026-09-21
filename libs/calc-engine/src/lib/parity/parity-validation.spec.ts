import {
  SOLARIS_MG_500KV_FIXTURE,
  TUCANO_MULTILINE_FIXTURE,
  REIDI_DIRECT_BILL_FIXTURE,
  CELEO_LOTE_04_2026_FIXTURE,
} from './fixtures';
import { FullOfferPipelineRunner } from './full-offer-pipeline-runner';
import { ParityEvaluator } from './parity-evaluator';
import { ParityReportGenerator } from './parity-report-generator';

describe('Suíte de Paridade Numérica e Fixtures Reais (§14)', () => {
  let runner: FullOfferPipelineRunner;
  let evaluator: ParityEvaluator;
  let reportGenerator: ParityReportGenerator;

  beforeEach(() => {
    runner = new FullOfferPipelineRunner();
    evaluator = new ParityEvaluator();
    reportGenerator = new ParityReportGenerator();
  });

  describe('Perfil 1: Linha Única Solaris MG 500 kV (RNF-04, RNF-08)', () => {
    it('deve obter 100% de conformidade com a baseline da planilha sem desvios injustificados', () => {
      const runResult = runner.run(SOLARIS_MG_500KV_FIXTURE);
      const report = evaluator.evaluate(
        SOLARIS_MG_500KV_FIXTURE,
        runResult,
        new Date('2026-09-12T12:00:00Z'),
      );

      expect(report.isApproved).toBe(true);
      expect(report.desvioCount).toBe(0);
      expect(report.conformeCount).toBeGreaterThan(10);
      expect(report.correcaoCount).toBe(1); // Correção de aço estrutural catalogada

      const md = reportGenerator.generateMarkdown(report);
      expect(md).toContain('🟢 **HOMOLOGADO / APROVADO**');
      expect(md).toContain('totalEstimatedSteelWeightTon');
    });
  });

  describe('Perfil 2: Lote Multilinhas Tucano 230 kV (RN-05, RN-09)', () => {
    it('deve validar paridade em lote com múltiplas linhas e entregas mensais', () => {
      const runResult = runner.run(TUCANO_MULTILINE_FIXTURE);
      const report = evaluator.evaluate(
        TUCANO_MULTILINE_FIXTURE,
        runResult,
        new Date('2026-09-12T12:00:00Z'),
      );

      expect(report.isApproved).toBe(true);
      expect(report.desvioCount).toBe(0);
      expect(report.correcaoCount).toBe(1);

      const json = reportGenerator.generateJson(report);
      const parsed = JSON.parse(json);
      expect(parsed.offerCode).toBe('OF-2025-042-TUCANO');
      expect(parsed.modules.every((m: any) => m.status === 'PASSED')).toBe(
        true,
      );
    });
  });

  describe('Perfil 3: Regime Especial REIDI & Faturamento Direto (RN-07, RN-10)', () => {
    it('deve validar paridade com suspensão tributária e faturamento direto de materiais', () => {
      const runResult = runner.run(REIDI_DIRECT_BILL_FIXTURE);
      const report = evaluator.evaluate(
        REIDI_DIRECT_BILL_FIXTURE,
        runResult,
        new Date('2026-09-12T12:00:00Z'),
      );

      expect(report.isApproved).toBe(true);
      expect(report.desvioCount).toBe(0);
      expect(report.correcaoCount).toBe(1);

      const directBilled = report.comparisons.find(
        (c) => c.metricName === 'directBilledMaterialsTotalBrl',
      );
      expect(directBilled).toBeDefined();
      expect(directBilled?.status).toBe('CONFORME');
    });
  });

  describe('Perfil 4: Template Real Celeo Lote 04 525 kV (Calculo LT-CELEO)', () => {
    it('deve validar paridade numérica de 100% contra a planilha mestre do Lote 04', () => {
      const runResult = runner.run(CELEO_LOTE_04_2026_FIXTURE);
      const report = evaluator.evaluate(
        CELEO_LOTE_04_2026_FIXTURE,
        runResult,
        new Date('2026-09-20T12:00:00Z'),
      );

      expect(report.isApproved).toBe(true);
      expect(report.desvioCount).toBe(0);

      const md = reportGenerator.generateMarkdown(report);
      expect(md).toContain('🟢 **HOMOLOGADO / APROVADO**');
      expect(md).toContain('OF-2026-CELEO-LOTE-04');
    });
  });
});
