## Purpose

Define os requisitos para a gestão de aditivos contratuais, pleitos de engenharia e ordens de alteração de escopo (*Change Orders*) incidentes sobre a Linha de Base da obra (Fase F7 do roadmap).
## Requirements
### Requirement: Gestão de Aditivos e Pleitos (Change Orders)
O sistema SHALL permitir cadastrar e aprovar Ordens de Alteração Contratual (*Change Orders* / Pleitos), categorizando a origem da variação (geotecnia/solo imprevisto, realocação de traçado/estaqueamento, exigência ambiental, reajuste de preços ou aditivo de escopo pelo cliente), com memorial de cálculo do delta financeiro e de prazo.

#### Scenario: Registro de aditivo por alteração de tipo de fundação
- **WHEN** 15 torres encontram rocha sã em campo exigindo fundação tipo estaca raiz com custo adicional de R$ 1.800.000
- **THEN** o sistema registra o aditivo contratual AD-01, calcula o delta orçamentário e projeta o *Current Working Estimate* (CWE) sem sobrescrever a Baseline Data 0 original

---

### Requirement: Projeção de Estimativa Final de Custo (Current Working Estimate - CWE)
O sistema SHALL calcular a projeção de custo final da obra ($CWE = \text{Baseline Data 0} + \sum \text{Aditivos Aprovados}$), permitindo comparar simultaneamente o valor contratual original com a estimativa corrente revisada.

#### Scenario: Visualização comparativa Baseline vs CWE
- **WHEN** o gestor visualiza o painel financeiro da obra com 2 aditivos aprovados
- **THEN** o sistema exibe o valor da Baseline original, o montante total de aditivos e o valor consolidado do CWE

### Requirement: Gestão de Aditivos e Pleitos (*Change Orders*)
O sistema SHALL permitir cadastrar e aprovar Ordens de Alteração Contratual (*Change Orders* / Pleitos), categorizando a origem da variação (geotecnia/solo imprevisto, realocação de traçado/estaqueamento, exigência ambiental, reajuste de preços ou aditivo de escopo pelo cliente), com memorial de cálculo do delta financeiro e de prazo.

#### Scenario: Registro de aditivo por alteração de tipo de fundação
- **WHEN** 15 torres encontram rocha sã em campo exigindo fundação tipo estaca raiz com custo adicional de R$ 1.800.000
- **THEN** o sistema registra o aditivo contratual AD-01, calcula o delta orçamentário e projeta o *Current Working Estimate* (CWE) sem sobrescrever a Baseline Data 0 original

---

