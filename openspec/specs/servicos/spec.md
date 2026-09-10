## Purpose

Define os requisitos e regras de cálculo para a consolidação de serviços e orçamento contratual de Linhas de Transmissão (Módulo M09), abrangendo as três origens de custo, códigos CIP do contratante, folhas contratuais (Medição e PU) e ratios paramétricos de custo.

## Requirements

### Requirement: Consolidação de Itens de Serviço por Três Origens de Custo (RF-46)
O sistema SHALL consolidar cada item de serviço da linha de transmissão a partir de uma de três origens de custo: (1) cálculo direto derivado da alocação de equipes no cronograma físico, (2) cálculo paramétrico ajustado por fatores de complexidade e acesso, ou (3) subcontratação com cotação direta de mercado, validando que os quantitativos de serviço coincidem exatamente com o quantitativo físico consolidado em M05.

#### Scenario: Consolidação de serviço com origem mista
- **WHEN** a montagem de torres é executada com equipe própria orçada pelo cronograma físico e a supressão de vegetação é contratada como serviço subcontratado cotado a preço global
- **THEN** o sistema consolida o custo de cada item respeitando sua respectiva origem e valida a paridade das quantidades totais com o quantitativo da linha

---

### Requirement: Associação ao Código CIP e Emissão de Planilha de Preços do Edital (RF-47)
O sistema SHALL associar cada item de serviço ao Código de Item Padronizado (CIP) do contratante (ex.: `GR02.04.05`), aplicando os percentuais de BDI específicos por grupo de serviço e emitindo a planilha de preços estruturada com subtotais e totais no padrão exigido pelo edital.

#### Scenario: Aplicação de BDI sobre item CIP de fundações
- **WHEN** um item de escavação com código CIP `GR01.02.01` possui custo direto de R$ 1.500.000 e a linha possui BDI de serviços definido em 24,50%
- **THEN** o sistema emite o preço de venda do item como $\text{R\$} 1.500.000 \times (1 + 0,245) = \text{R\$} 1.867.500$ e posiciona o valor no grupo analítico correto do edital

---

### Requirement: Geração de Folha de Medição e Folha de Preços Unitários (RF-48)
O sistema SHALL gerar a Folha de Medição Contratual (`M1..M10`) e a Folha de Variações de Preços Unitários (`PU1..PU10`) a partir do mesmo orçamento consolidado, detalhando a unidade, a quantidade contratual, o preço unitário com impostos e o critério de medição de cada evento da obra.

#### Scenario: Emissão de folha de preços unitários para aditivos
- **WHEN** o orçamentista solicita a folha de PU para compor o anexo contratual de pleitos e medições
- **THEN** o sistema lista todos os itens da linha com suas respectivas quantidades, custos unitários e preços unitários contratuais de venda

---

### Requirement: Cálculo de Ratios de Custo por Km e por Torre (RF-49)
O sistema SHALL calcular indicadores de custo unitário por quilômetro (R$/km) e por estrutura (R$/torre) para cada grupo de serviço e para o total da linha, permitindo comparações paramétricas diretas (*benchmarking*) entre linhas da mesma proposta e contra ofertas históricas.

#### Scenario: Comparação de ratio de montagem de estruturas
- **WHEN** uma linha de 120 km possui 300 torres e custo total de montagem de R$ 9.000.000
- **THEN** o sistema computa o ratio de R$ 75.000/km e R$ 30.000/torre para o grupo de montagem

---

### Requirement: Suporte a Múltiplos Layouts de Planilha de Edital (RF-50)
O sistema SHALL suportar a exportação e visualização do orçamento de serviços em múltiplos formatos de concessionárias e clientes (ex.: AXIA Sudeste/Norte/Sul, Celeo, Elecnor), mapeando automaticamente os itens e subtotais sem alterar a lógica ou os valores do motor de cálculo.

#### Scenario: Exportação para modelo específico de cliente
- **WHEN** o usuário seleciona o layout de exportação "Padrão Celeo" para uma oferta com 3 linhas
- **THEN** o sistema gera a planilha formatada com a árvore de contas e códigos específicos da Celeo preservando a exatidão dos totais calculados
