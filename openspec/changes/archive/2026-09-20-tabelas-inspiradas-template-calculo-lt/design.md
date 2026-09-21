## Context

A aplicação web já possui a lógica de cálculo dos 12 módulos de negócio implementada em backend NestJS e bibliotecas puras TypeScript. No entanto, as tabelas do frontend Angular necessitam de enriquecimento visual e estrutural para refletir a fidelidade e densidade de dados presentes no template mestre da planilha Excel (`Calculo LT CELEO Lote 4`), especificamente nos módulos de Suprimentos, Engenharia Civil, Indiretos, Orçamento e Fluxo de Caixa.

## Goals / Non-Goals

**Goals:**
- Implementar cabeçalhos multi-nível (*multi-tier headers*) nas tabelas técnicas de materiais, orçamento e fluxo de caixa.
- Incorporar matriz comparativa de cotações de fornecedores (*Brametal*, *Brafer*, *Incomisa*, *SAE*) com indicação de UF de origem e fornecedor escolhido (*ELEGIDA*).
- Adicionar sub-tabelas de Travessias Especiais, Acessos e Limpeza de Faixa na visualização de Engenharia Civil.
- Adicionar detalhamento analítico de Indiretos de Obra na gestão de canteiros.
- Alinhar a tabela de resumo de custos e vendas ao layout padrão `RT` e a folha de variações ao padrão `PU1`.
- Implementar a grade matricial de desembolso mensal multi-mês (`DT`).
- Manter 100% de compatibilidade com os tipos e endpoints existentes, preservando a imutabilidade de revisões fechadas.

**Non-Goals:**
- Não alterar as fórmulas ou regras matemáticas do motor de cálculo determinístico.
- Não modificar o esquema de banco de dados relacional (Prisma).
- Não criar novas dependências externas de bibliotecas visuais além do Angular Material e do Design System existente.

## Decisions

### 1. Padrão de Cabeçalhos em Múltiplos Níveis (Multi-tier Headers)
- **Decisão:** Utilizar múltiplos `mat-header-row` ou tags semânticas `<thead>` com `colspan` e `rowspan` nativas com estilização Swiss Design System (`.technical-table`).
- **Alternativa considerada:** Plugins de grid pesados (como AG-Grid) — descartada para evitar dependências externas e manter o bundle leve e rápido com Angular puro.

### 2. Seletor de Visão Trecho / Consolidado do Lote (E1, E2, E3... vs Lote Total)
- **Decisão:** Implementar barra de botões no formato *pills* permitindo filtrar a visão de materiais, quantidades e cronograma por trecho específico ou exibir a consolidação global do lote, exatamente como as abas `E1..E3` e `RT`/`DT` da planilha.
- **Alternativa considerada:** Menus dropdown escondidos — descartada em favor de pills com visibilidade imediata.

### 3. Matriz de Cotação de Fornecedores por UF
- **Decisão:** Exibir as colunas comparativas de preços unitários dos fabricantes cadastrados lado a lado, com a coluna da empresa selecionada em destaque visual e tag `ELEGIDA`.

### 4. Grade Matricial Mensal com Sticky Columns
- **Decisão:** Para a tabela `DT` de desembolso, fixar a coluna de disciplina/descrição à esquerda (*sticky column*) e permitir scroll horizontal suave para os meses M1..M24 com cabeçalho de datas sincronizado.

## Risks / Trade-offs

- **[Responsividade em telas menores com tabelas densas]** → Uso de containers com `.table-scroll` horizontal dedicado e barra de rolagem customizada, preservando a legibilidade dos valores numéricos.
- **[Desempenho de renderização em matrizes grandes]** → Uso de `trackBy` / `@for ... track` otimizado no Angular 19/20 com Signals e OnPush.
