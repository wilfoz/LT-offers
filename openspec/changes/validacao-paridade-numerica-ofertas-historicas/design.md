## Context

Ver `proposal.md` para motivação e `specs/paridade-numerica/spec.md` para os requisitos funcionais.

O motor de cálculo (`libs/calc-engine`) possui calculadores modulares para quantitativos de fundação, eletromecânicos, tributos, preços, cronograma, histogramas, serviços, resultado econômico e desembolso. Para assegurar o critério de aceite (§14), é necessário um orquestrador ponta a ponta (`FullOfferPipelineRunner`), fixtures de propostas reais congeladas e um avaliador de paridade (`ParityEvaluator`) com tolerâncias calibradas.

## Goals / Non-Goals

**Goals:**
- Implementar o orquestrador `FullOfferPipelineRunner` que encadeia todos os submódulos do motor de cálculo de forma determinística e reativa.
- Criar fixtures estruturadas em TypeScript para os 3 perfis históricos centrais: *Solaris MG (500 kV)*, *Lote Multilinhas Tucano* e *Regime REIDI com Faturamento Direto*.
- Implementar o avaliador `ParityEvaluator` com cálculo de desvio percentual e absoluto nas 3 categorias de tolerância (0 para discretos, ≤ 0,001% para físicos contínuos, ≤ 0,01% para financeiros).
- Criar gerador de relatório de conformidade em Markdown e JSON (`ParityReportGenerator`) com suporte a anotações de `CORRECAO_HOMOLOGADA`.
- Implementar suíte de testes cobrindo os casos limite das regras de negócio (RN-05/06 multi-UF, RN-07/09 ponderação LME por entregas, RN-16 precipitação máxima e RNF-05 imutabilidade histórica).
- Implementar teste automatizado de benchmark de performance para validação dos tempos de recálculo (RNF-01).

**Non-Goals:**
- Não reescrever nem alterar as regras de negócio consolidadas nas fases F1 a F7.
- Não introduzir dependências externas de I/O em tempo de teste unitário (fixtures vivem versionadas no código como objetos tipados).
- Não criar novas telas interativas complexas de edição no frontend.

## Decisions

### 1. Fixtures Versionadas como Módulos TypeScript Tipados
- **Decisão**: Modelar as entradas e baselines esperadas das ofertas históricas como constantes TypeScript fortemente tipadas com contratos de `libs/domain`.
- **Alternativa Considerada**: Ler arquivos XLSX brutos durante a execução dos testes.
- **Racional**: Elimina overhead de I/O de disco, garante compatibilidade de tipos no build e protege as fixtures contra corrupção inadvertida.

### 2. Orquestrador Unificado de Pipeline (`FullOfferPipelineRunner`)
- **Decisão**: Criar uma classe pura em `libs/calc-engine/src/lib/parity/full-offer-pipeline-runner.ts` que recebe os parâmetros de uma oferta, executa sequencialmente o grafo de dependências e retorna o snapshot consolidado de todas as abas.
- **Alternativa Considerada**: Invocar cada calculadora manualmente nos testes de integração.
- **Racional**: Centraliza a ordem canônica do grafo de cálculo do sistema, garantindo consistência com a arquitetura descrita em §12.

### 3. Avaliador com Classificação Tripla de Status
- **Decisão**: O `ParityEvaluator` classifica cada indicador em:
  1. `CONFORME`: variação absoluta ou relativa estritamente dentro da tolerância.
  2. `CORRECAO_HOMOLOGADA`: variação justificada por correção técnica de fórmula ou ponto flutuante do legado.
  3. `DESVIO_DETECTADO`: variação injustificada acima do limiar permitido.
- **Racional**: Permite que o relatório de conformidade seja 100% transparente para auditorias técnicas da engenharia e diretoria.

### 4. Arquitetura de Módulos e Pacotes
```
libs/
  domain/src/lib/contracts/
    parity.types.ts           # Interfaces de métricas, tolerâncias e relatório
  calc-engine/src/lib/parity/
    full-offer-pipeline-runner.ts  # Orquestrador ponta a ponta
    parity-evaluator.ts            # Motor de comparação e tolerâncias
    parity-report-generator.ts     # Gerador de relatórios Markdown/JSON
    fixtures/
      solaris-mg-500kv.fixture.ts  # Fixture Linha Única 500kV
      tucano-multiline.fixture.ts  # Fixture Lote Multilinhas
      reidi-direct-bill.fixture.ts # Fixture Regime REIDI
    parity-validation.spec.ts      # Suíte de paridade numérica
    business-rules-boundary.spec.ts# Testes de casos limites RN-01..RN-26
    performance-benchmark.spec.ts  # Teste de benchmark RNF-01
```

## Risks / Trade-offs

- **[Risco: Acúmulo de erros de arredondamento em cadeias longas]** → **Mitigação**: O `calc-engine` opera estritamente com `Decimal.js` (28 dígitos de precisão) e o `ParityEvaluator` compara com precisão decimal antes de converter para percentual.
- **[Risco: Testes de benchmark com flutuação de ambiente de CI]** → **Mitigação**: O benchmark afere a ordem de magnitude e tempos médios com múltiplas iterações reduzidas, com margem de segurança sobre o teto de 30s.
