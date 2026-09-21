## ADDED Requirements

### Requirement: Visualização Multi-Nível de Cotações Comparativas de Fornecedores e Visão por Trecho (RF-28, RF-29, RNF-14)
O sistema SHALL exibir na interface web uma tabela com cabeçalhos em múltiplos níveis inspirada na planilha mestre (`Precios` e `Materiales`), apresentando lado a lado as cotações dos principais fabricantes da indústria (ex.: Brametal, Brafer, Incomisa, SAE), a UF de origem de cada fábrica, a indicação visual do fornecedor selecionado (*ELEGIDA*), a decomposição analítica de tributos (IPI, ICMS origem, DIFAL, FECOEP, PIS/COFINS, REIDI) e a alternância entre a visualização por Trecho (E1, E2, E3...) e Consolidada do Lote.

#### Scenario: Visualização comparativa de fabricantes e seleção da cotação vencedora
- **WHEN** o usuário acessa a aba de Preços e Tributos de Materiais
- **THEN** o sistema renderiza a tabela com colunas comparativas de cotações por fabricante com sua respectiva UF de origem, destacando a empresa vencedora e a composição tributária de entrada

#### Scenario: Alternância entre visão de trecho específico e resumo geral do lote
- **WHEN** o usuário seleciona a visão de um trecho físico específico (ex.: Trecho 1 / E1) ou o Consolidado do Lote
- **THEN** o sistema filtra dinamicamente os quantitativos e custos de materiais daquele trecho mantendo a consistência dos totais no rodapé fixo
