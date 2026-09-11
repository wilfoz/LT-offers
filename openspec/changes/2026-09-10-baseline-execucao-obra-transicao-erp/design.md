## Context

Ver `proposal.md` para motivação e enquadramento na Fase F7 do roadmap (`requisitos-calculo-lt.md` §10 e §13).
O sistema já calcula com precisão matemática todos os elementos da proposta técnica e comercial (Fases F1 a F6). A Fase F7 estabelece a ponte com a execução, tornando a linha de base e os entregáveis da proposta a base operacional direta para a gestão da obra.

## Goals / Non-Goals

**Goals:**
- Implementar o modelo de dados e transição de estado para congelar a Baseline Contratual da Obra (Data 0) a partir de propostas vencedoras (`WON`).
- Implementar o motor de Análise de Valor Agregado (`EarnedValueCalculator`) em `libs/calc-engine` para cálculo de Curva S, desvios ($SV$, $CV$) e índices de desempenho ($SPI$, $CPI$).
- Implementar a gestão de Aditivos Contratuais e Pleitos (*Change Orders*), projetando a estimativa corrente revisada (*Current Working Estimate* - CWE).
- Implementar o gerador de pacotes de integração e carga para ERPs de construção (SAP, TOTVS/RM, Sienge/Mega) em formato JSON e XLSX.
- Criar a interface de Acompanhamento de Obra e Curva S na aplicação Angular com gráficos comparativos e formulário de apontamento de boletins de medição.

**Non-Goals:**
- Sistema de controle de ponto biométrico ou almoxarifado em tempo real (função do ERP de canteiro).
- Emissão direta de Notas Fiscais Eletrônicas (NFe/NFSe) no SEFAZ.

## Decisions

### Decisão 1: Separação entre Baseline Contratual (Data 0) e Estimativa Corrente (CWE)
- **Escolha:** A Baseline Data 0 é estritamente imutável após a aprovação da proposta vencedora. Modificações de campo e aditivos são persistidos como `ContractChangeOrder` e acumulados na projeção *Current Working Estimate* (CWE).
- **Alternativa considerada:** Sobrescrever os valores da proposta diretamente a cada aditivo.
- **Racional:** Preserva a rastreabilidade contratual original exigida para pleitos e auditorias perante contratantes e financiadores.

### Decisão 2: Motor de Valor Agregado Puro no Calc-Engine (`EarnedValueCalculator`)
- **Escolha:** Implementação em `libs/calc-engine` com aritmética `DecimalValue` isolada.
- **Alternativa considerada:** Fórmulas de cálculo embutidas no banco ou nos componentes da UI.
- **Racional:** Garante determinismo (RNF-04), precisão decimal (RNF-08) e testabilidade sem interface (RNF-16).

### Decisão 3: Pacote Padronizado de Integração ERP (JSON & XLSX)
- **Escolha:** Estrutura unificada com identificadores de EAP, contas de custo gerenciais e séries temporais mensais.
- **Alternativa considerada:** Adaptadores proprietários e acoplados a APIs de cada ERP específico.
- **Racional:** Evita dependência externa e permite importação universal via arquivos de carga ou webhooks.

## Risks / Trade-offs

- **[Risco] Variações temporais em obras com reprogramação de prazos** → *Mitigação:* O motor calcula SPI e CPI considerando a data de corte do boletim de medição contra a série da baseline e da baseline reprogramada.
