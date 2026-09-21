## Why

A aplicação web foi construída com base nos modelos matemáticos e regras de negócio da planilha mestre "Calculo LT" (CELEO Lote 4), cobrindo os módulos de engenharia, suprimentos, civil, cronograma, orçamentação e fluxo de caixa. Embora a lógica de cálculo esteja implementada, diversas tabelas do frontend web carecem da densidade analítica, agrupamento em múltiplos níveis e visualização comparativa consagrada no template original (como matriz comparativa de fornecedores por UF, detalhamento analítico de custos indiretos de obra, travessias e aberturas de acessos, e grades matriciais mensais de desembolso). Esta change refatora e enriquece as tabelas do frontend para que sejam visualmente e estruturalmente inspiradas no template mestre, elevando a experiência do engenheiro orçamentista com fidelidade ao padrão da indústria EPC.

## What Changes

- **Tabelas de Preços e Suprimentos (M06 / `Precios` & `Materiales`)**:
  - Implementação de cabeçalhos multi-nível com matriz de cotação comparativa por fabricante (*Brametal*, *Brafer*, *Incomisa*, *SAE*) indicando UF de origem e fornecedor escolhido (*ELEGIDA*).
  - Exibição clara de alíquotas e valores tributários discriminados (IPI, ICMS Origem, DIFAL Destino, FECOEP, PIS/COFINS, Faturamento Direto REIDI).
  - Seletor de visão por trecho físico (E1, E2, E3...) e consolidado do Lote Total.

- **Tabelas de Engenharia Civil, Travessias e Acessos (M05 / `Fundaciones`, `Travesias`, `Accesos`, `Limpieza`)**:
  - Enriquecimento da visualização de fundações com sub-tabelas inspiradas nas abas do template: Travessias especiais (rodovias, rios, linhas), Abertura e manutenção de acessos por tipo de terreno, e Limpeza de faixa de servidão.

- **Tabelas de Canteiros e Indiretos de Obra (M07 / `Canteiros` & `Indirectos`)**:
  - Incorporação do detalhamento analítico da equipe de administração local cruzada com custos de apoio operacional (veículo leve 4x4, telefonia, TI, EPI, exames admissionais/demissionais e viagens).

- **Tabelas de Orçamento Síntese e Preços Unitários (M09 / M10 / `RT`, `PU1`, `M1`)**:
  - Reestruturação da tabela de resumo de custos e venda (`RT`) agrupada por grandes disciplinas (Suprimentos, Serviços de Construção, Engenharia, Canteiros & Indiretos, Contingências).
  - Alinhamento da tabela de Folha de Variações de Preço Unitário (`PU1`) com preços de aditivos contratuais por item de medição.

- **Tabela Matricial de Desembolso e Fluxo de Caixa (M11 / `DT` & `CASHFLOW ELECNOR`)**:
  - Grade matricial multi-mês com cabeçalhos de período (M1..M24) desdobrando desembolsos mensais de materiais, serviços, indiretos e faturamento.

## Capabilities

### New Capabilities
<!-- Nenhuma nova capacidade conceitual criada, foco em enriquecimento das existentes -->

### Modified Capabilities
- `precos-tributos`: Enriquecimento da interface de precificação de materiais com matriz comparativa de fabricantes e visão consolidada/trecho inspirada em `Precios` e `Materiales`.
- `fundacoes`: Incorporação de visualização analítica de travessias especiais, acessos e limpeza de faixa inspirada em `Travesias`, `Accesos` e `Limpieza`.
- `servicos`: Alinhamento das tabelas de orçamento de venda e preços unitários inspiradas em `RT`, `M1` e `PU1`.
- `desembolso`: Implementação da grade matricial mensal de desembolso financeiro inspirada em `DT`.

## Impact

- **Frontend Angular (`apps/web`)**: Refatoração dos componentes [`material-pricing.component.ts`](file:///c:/Users/wilwa/Desktop/Developer/offer/apps/web/src/app/offers/material-pricing.component.ts), [`foundation-quantities.component.ts`](file:///c:/Users/wilwa/Desktop/Developer/offer/apps/web/src/app/offers/foundation-quantities.component.ts), [`camps-management.component.ts`](file:///c:/Users/wilwa/Desktop/Developer/offer/apps/web/src/app/offers/camps-management.component.ts), [`service-budget.component.ts`](file:///c:/Users/wilwa/Desktop/Developer/offer/apps/web/src/app/offers/service-budget.component.ts), [`economic-result.component.ts`](file:///c:/Users/wilwa/Desktop/Developer/offer/apps/web/src/app/offers/economic-result.component.ts) e [`cashflow.component.ts`](file:///c:/Users/wilwa/Desktop/Developer/offer/apps/web/src/app/offers/cashflow.component.ts).
- **Tipagens e DTOs de Domínio (`packages/domain`)**: Enriquecimento das interfaces de visualização para suportar detalhamento por fornecedor e sub-disciplinas analíticas.
- **Não há breaking changes** nos endpoints existentes de cálculo ou no motor de cálculo determinístico.
