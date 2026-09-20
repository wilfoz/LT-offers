import { ParityReport } from '@lt-offers/domain';

export class ParityReportGenerator {
  /**
   * Gera o relatório consolidado de conformidade em formato Markdown estruturado.
   */
  public generateMarkdown(report: ParityReport): string {
    const lines: string[] = [];

    lines.push(`# Relatório de Paridade Numérica e Conformidade Técnica (§14)`);
    lines.push(``);
    lines.push(`> **Oferta:** ${report.offerCode} — *${report.offerName}*`);
    lines.push(`> **Perfil Testado:** ${report.profileDescription}`);
    lines.push(
      `> **Data de Execução:** ${report.executedAt} | **Tempo de Processamento:** ${report.executionDurationMs} ms`,
    );
    lines.push(
      `> **Resultado Final:** ${report.isApproved ? '🟢 **HOMOLOGADO / APROVADO**' : '🔴 **REPROVADO / DESVIO DETECTADO**'}`,
    );
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
    lines.push(`## 1. Sumário Executivo de Conformidade`);
    lines.push(``);
    lines.push(`| Métrica Global | Valor | Critério de Aceite (§14) |`);
    lines.push(`|---|---|---|`);
    lines.push(
      `| **Total de Indicadores Avaliados** | **${report.totalMetrics}** | Cobertura integral das abas de quantitativos e custos |`,
    );
    lines.push(
      `| **Conformes (Dentro da Tolerância)** | **${report.conformeCount}** | Discretos = 0, Físicos $\\le 0,001\\%$, Financeiro $\\le 0,01\\%$ |`,
    );
    lines.push(
      `| **Correções Homologadas do Legado** | **${report.correcaoCount}** | Ajustes documentados de fórmulas/arredondamento da planilha |`,
    );
    lines.push(
      `| **Desvios Críticos Injustificados** | **${report.desvioCount}** | Limite tolerado para aprovação = **0** |`,
    );
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
    lines.push(`## 2. Desempenho por Módulo de Negócio`);
    lines.push(``);
    lines.push(
      `| Módulo | Total Itens | Conformes | Correções | Desvios | Status |`,
    );
    lines.push(`|---|---|---|---|---|---|`);

    for (const mod of report.modules) {
      const statusIcon =
        mod.status === 'PASSED' ? '✅ Aprovado' : '❌ Reprovado';
      lines.push(
        `| **${mod.module}** | ${mod.totalMetrics} | ${mod.conformeCount} | ${mod.correcaoCount} | ${mod.desvioCount} | ${statusIcon} |`,
      );
    }

    lines.push(``);
    lines.push(`---`);
    lines.push(``);
    lines.push(`## 3. Memória Analítica de Indicadores`);
    lines.push(``);
    lines.push(
      `| Indicador | Unidade | Valor Baseline (Planilha) | Valor Calculado (Sistema) | Variação Abs. | Variação Rel. | Status |`,
    );
    lines.push(`|---|---|---|---|---|---|---|`);

    for (const item of report.comparisons) {
      let statusBadge = '🟢 Conforme';
      if (item.status === 'CORRECAO_HOMOLOGADA') {
        statusBadge = '⚠️ Correção Homologada';
      } else if (item.status === 'DESVIO_DETECTADO') {
        statusBadge = '🔴 Desvio';
      }

      const formattedBase =
        typeof item.baselineValue === 'number'
          ? item.baselineValue.toLocaleString('pt-BR', {
              maximumFractionDigits: 4,
            })
          : item.baselineValue;
      const formattedCalc =
        typeof item.calculatedValue === 'number'
          ? item.calculatedValue.toLocaleString('pt-BR', {
              maximumFractionDigits: 4,
            })
          : item.calculatedValue;
      const formattedDeltaAbs = item.deltaAbsolute.toLocaleString('pt-BR', {
        maximumFractionDigits: 4,
      });
      const formattedDeltaPct = `${item.deltaRelativePct.toFixed(4)}%`;

      lines.push(
        `| \`${item.metricName}\` | ${item.unit} | ${formattedBase} | ${formattedCalc} | ${formattedDeltaAbs} | ${formattedDeltaPct} | ${statusBadge} |`,
      );
    }

    const corrections = report.comparisons.filter(
      (c) => c.status === 'CORRECAO_HOMOLOGADA' && c.technicalNote,
    );
    if (corrections.length > 0) {
      lines.push(``);
      lines.push(`---`);
      lines.push(``);
      lines.push(`## 4. Notas Técnicas de Correções do Modelo Legado`);
      lines.push(``);
      for (const corr of corrections) {
        lines.push(`- **\`${corr.metricName}\`**: ${corr.technicalNote}`);
      }
    }

    lines.push(``);
    return lines.join('\n');
  }

  /**
   * Gera o payload do relatório em formato JSON estruturado.
   */
  public generateJson(report: ParityReport): string {
    return JSON.stringify(report, null, 2);
  }
}
