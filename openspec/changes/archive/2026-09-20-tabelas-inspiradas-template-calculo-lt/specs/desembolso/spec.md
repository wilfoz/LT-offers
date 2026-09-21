## ADDED Requirements

### Requirement: Grade Matricial Mensal de Desembolso e Exposição de Caixa (RF-51, RF-52, RNF-14)
O sistema SHALL exibir o cronograma financeiro e fluxo de caixa em formato de grade matricial multi-mês inspirada na aba `DT` da planilha mestre, com cabeçalhos de período (M1..M24) desdobrando os desembolsos de suprimentos, subcontratados de fundação, montagem de estruturas, lançamento de cabos, indiretos e faturamento acumulado.

#### Scenario: Visualização matricial de desembolso mensal
- **WHEN** o usuário acessa a aba de Desembolso e Fluxo de Caixa
- **THEN** o sistema exibe a tabela matricial com os meses do empreendimento nas colunas e as linhas de despesa/receita com barra de rolagem horizontal sincronizada e totais por mês e acumulados
