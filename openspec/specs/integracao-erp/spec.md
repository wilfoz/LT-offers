## Purpose

Define os requisitos para a geração de pacotes de dados e exportadores estruturados de carga para integração entre a proposta de Linha de Transmissão e os sistemas corporativos de gestão de obras e ERPs (SAP, TOTVS/RM, Sienge/Mega) (Fase F7 do roadmap).

## Requirements

### Requirement: Exportação de Pacote de Carga para ERPs de Construção
O sistema SHALL gerar pacote de integração em formato JSON e XLSX com mapeamento de centros de custo, contas orçamentárias, itens de EAP/WBS, catálogo de recursos e cronograma físico-financeiro mensal para importação direta em sistemas de ERP corporativos (SAP, TOTVS/RM, Mega/Sienge).

#### Scenario: Geração de arquivo de carga do ERP
- **WHEN** a equipe de controladoria solicita o pacote de integração da proposta vencedora para o ERP
- **THEN** o sistema gera o arquivo com o plano de contas da obra, tabela de recursos e distribuição orçamentária mensal vinculada a cada código de conta contábil/gerencial
