## Why

Na planilha legada `Calculo LT`, a validação de consistência e o gerenciamento de incertezas estavam dispersos em abas ocultas (`Checks`, `Check cantid. TOTAL y canteiros`) e abas replicadas por linha (`Risk1..Risk10`). Erros graves de quantitativos, itens sem cotação, equipes sobrecarregadas ou descumprimento de prazos contratuais podiam passar despercebidos, levando a propostas com margens corrompidas ou riscos subdimensionados.

Esta proposta implementa a **Fase F6.1** do roadmap (§13), cobrindo o núcleo do módulo:
- **M12 — Risco, Verificação e Governança** (RF-61, RF-62, RF-63, RF-55, RNF-09)

Com esta entrega, o sistema ganha um painel centralizado de integridade (auditoria e consistência de dados cruzados entre todos os módulos do motor) e uma matriz de riscos quantitativa por linha que alimenta automaticamente a linha de contingências dos coeficientes de venda ($K$) e BDI.

## What Changes

- **Matriz de Riscos da Oferta (M12 / RF-61, RF-55):**
  - Registro estruturado de riscos por linha de transmissão com classificação por categoria (fundiário, ambiental, prazo, clima/chuva, engenharia, geotécnico, terceiros/mercado).
  - Parâmetros quantitativos por risco: probabilidade (%), impacto financeiro estimado (R$), severidade ponderada resultante ($R\$ = \text{Impacto} \times \text{Probabilidade}$) e mitigação/consideração adotada.
  - Integração direta com a formação de preço: o montante total de riscos ponderados alimenta automaticamente a linha de contingência no Quadro de Coeficientes de Venda ($K$) e BDI (RF-52, RF-55).
  - Classificação de tratamento do risco: transferir para contingência do BDI ou assumir como premissa comercial da proposta.
- **Painel Central de Verificações de Consistência (M12 / RF-62, RF-63, RNF-09):**
  - Motor de validação cruzada que avalia a integridade global da oferta em tempo real em todos os módulos:
    - *Estaqueamento:* contagem de estruturas no estaqueamento vs total declarado na linha; combinações de solo × fundação sem cadastro no catálogo.
    - *Suprimentos & Tributos:* itens de materiais/engenharia com quantitativo calculado e sem cotação/preço selecionado (RF-29); materiais sem estado de origem ou alíquotas fiscais indefinidas.
    - *Cronograma & Recursos:* atividades com produção exigida superior à produção máxima teórica da equipe (RF-38); atividades finalizando após os marcos de LI/LO contratuais (RF-39).
    - *Histogramas & Canteiros:* déficits de equipamentos próprios no histograma sem estratégia de aluguel/aquisição associada (RF-44); canteiros sem alocação mínima.
    - *Serviços & Orçamento:* quantitativos de serviços orçados (próprios + ajustados + subcontratados) divergentes do total de engenharia; itens sem código CIP associado.
    - *Desembolso & Caixa:* soma do fluxo de caixa e desembolso ($DT$) divergente do valor total de venda do Quadro $R$; saldo de fechamento com inconsistência.
  - Classificação de severidade das verificações: **Crítico / Impeditivo** (bloqueia o fechamento da revisão da oferta conforme RF-63) e **Alerta / Atenção** (permite justificativa formal auditada).
  - Painel visual interativo na aplicação web com status geral de saúde da oferta (RAG: Red, Amber, Green), contadores de pendências e navegação direta (deep linking) para o campo/aba onde o erro se originou.

## Capabilities

### New Capabilities
- `matriz-riscos`: Matriz de riscos analítica por linha de transmissão, cálculo de severidade ponderada e alimentação de contingências no BDI (M12, RF-61, RF-55).
- `verificacoes-consistencia`: Bateria de verificações cruzadas de integridade e consistência entre todos os módulos de cálculo, painel unificado com links diretos e regras de bloqueio de fechamento de revisão (M12, RF-62, RF-63, RNF-09).

### Modified Capabilities
- `resultado-economico`: Integração do valor de contingência calculado a partir da Matriz de Riscos na parametrização dos coeficientes de venda $K$ e formação de BDI (RF-52, RF-55).

## Impact

- **`libs/domain`**: Novos tipos e contratos para itens de risco (`RiskItem`, `RiskCategory`, `RiskAssessment`), regras de consistência (`ConsistencyCheck`, `CheckSeverity`, `CheckResult`, `OfferHealthSummary`).
- **`libs/calc-engine`**: Novos serviços de cálculo (`RiskCalculator`, `ConsistencyCheckEngine`) operando de forma determinística com aritmética decimal (`DecimalValue`).
- **`apps/api`**: Novos controllers e services NestJS para CRUD de matriz de riscos, execução de diagnósticos de consistência e validação de regras de fechamento de revisão.
- **`apps/web`**: Nova aba de Riscos (`OfferRisksComponent`) e componente/painel global de Verificações (`OfferChecksComponent` / `HealthStatusBadge`) integrado ao cabeçalho e navegação da oferta.
