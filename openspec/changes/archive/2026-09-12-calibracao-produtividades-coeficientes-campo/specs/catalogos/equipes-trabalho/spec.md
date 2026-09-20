## MODIFIED Requirements

### Requirement: Manter equipes de trabalho e composições

O sistema SHALL permitir criar e editar equipes de trabalho com código (obrigatório, único no catálogo, texto livre — ex.: `EQ-CIV-01`, `EQ-MON-01`) e nome da equipe como identidade, e, como atributos versionados: taxa de produção teórica padrão (`standardProductionRate`), taxa de produção máxima permitida para controle de sobreprodução (`maxMonthlyProductionRate`), unidade de medida da produção (`productionUnit` — texto livre, ex.: `m3`, `torre`, `km`, `un`, `m`), período base da produção (`productionPeriod` — enum: `HOUR`, `DAY`, `WEEK`, `MONTH`), lista de composição de mão de obra (`workCrewLaborRoles`) e lista de composição de equipamentos (`workCrewEquipments`). Cada item de mão de obra SHALL referenciar um cargo de mão de obra (`LaborRole`) ativo e definir uma quantidade decimal maior que zero (`quantity`). Cada item de equipamento SHALL referenciar um equipamento (`Equipment`) ativo e definir uma quantidade decimal maior que zero (`quantity`). Todos os atributos numéricos SHALL ser armazenados com precisão decimal, nunca em ponto flutuante binário (RNF-08).

#### Scenario: Criação de equipe de trabalho com composição válida
- **WHEN** um usuário cria uma equipe com código inédito, nome, taxa de produção, unidade, período e itens de mão de obra e equipamento válidos
- **THEN** o sistema grava a equipe como primeira versão com suas composições associadas e a exibe na listagem

#### Scenario: Código duplicado é rejeitado
- **WHEN** um usuário tenta criar uma equipe com um código que já existe no catálogo
- **THEN** o sistema rejeita a operação informando que o código já está em uso

#### Scenario: Quantidade menor ou igual a zero em item de composição é rejeitada
- **WHEN** um usuário informa quantidade zero ou negativa para um cargo ou equipamento da composição
- **THEN** o sistema rejeita a operação apontando a linha e o valor inválido em português

#### Scenario: Cargo ou equipamento inexistente na composição é rejeitado
- **WHEN** um usuário submete uma composição referenciando um identificador de cargo ou equipamento inexistente
- **THEN** o sistema rejeita a requisição informando a referência inválida

#### Scenario: Calibração de equipe de lançamento de múltiplos condutores (4x ou 6x)
- **WHEN** um usuário cadastra uma equipe de lançamento de cabos com múltiplos condutores por fase informando taxa padrão de $15\text{ km-fio/mês}$ e taxa máxima de $25\text{ km-fio/mês}$
- **THEN** o sistema persiste as taxas decimais e utiliza a taxa máxima para validação estrita de sobreprodução no cronograma
