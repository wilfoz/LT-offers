## ADDED Requirements

### Requirement: Tabela de Resumo Geral de Custos e Vendas e Folha de Variações de Preço Unitário (RF-44, RF-45, RNF-14)
O sistema SHALL estruturar a visualização do orçamento de serviços e venda em conformidade com as abas `RT` (Resumen Total de Costos y Ventas), `M1` (Folha de Medição Contratual) e `PU1` (Folha de Variações de Preços Unitários) da planilha mestre, com agrupamento hierárquico por macro-disciplinas e colunas discriminadas de Custo Direto, Impostos, Faturamento Direto e Preço de Venda com BDI.

#### Scenario: Visualização do resumo de custos e vendas no padrão RT
- **WHEN** o usuário acessa o painel de Resultado Econômico e Serviços
- **THEN** o sistema apresenta a tabela com separadores visuais por macro-disciplina (Suprimentos, Construção Civil, Eletromecânica, Engenharia, Canteiros & Indiretos, Contingências) e colunas financeiras alinhadas ao padrão da planilha

#### Scenario: Visualização da folha de variação de preços unitários no padrão PU1
- **WHEN** o usuário consulta os preços unitários contratuais para variações de escopo
- **THEN** o sistema exibe os itens com código contratual, descrição analítica, unidade de medição, quantidade contratada, preço unitário de venda e preço total
