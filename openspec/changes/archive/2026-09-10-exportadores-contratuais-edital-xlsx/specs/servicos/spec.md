## MODIFIED Requirements

### Requirement: Suporte a Múltiplos Layouts de Planilha de Edital (RF-50)
O sistema SHALL suportar a exportação e visualização do orçamento de serviços e preços em múltiplos formatos de concessionárias e clientes (ex.: Padrão ANEEL, Padrão Celeo, Padrão Concessionárias Privadas), mapeando automaticamente os itens, códigos CIP, subtotais e cabeçalhos sem alterar a lógica ou os valores do motor de cálculo.

#### Scenario: Exportação para modelo específico de cliente
- **WHEN** o usuário seleciona o layout de exportação "Padrão Celeo" para uma oferta com 3 linhas
- **THEN** o sistema gera a planilha formatada com a árvore de contas e códigos específicos da Celeo preservando a exatidão dos totais calculados

#### Scenario: Exportação para modelo Padrão ANEEL
- **WHEN** o usuário seleciona o layout de exportação "Padrão ANEEL"
- **THEN** o sistema gera o arquivo XLSX com as colunas oficiais exigidas nos leilões de transmissão
