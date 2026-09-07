# catalogos/equipes-trabalho

## Purpose

Catálogo corporativo de equipes de trabalho (origem: abas `Equipos` e `DesEquipos` da planilha), com composições analíticas versionadas por vigência em cargos de mão de obra (`LaborRole`) e equipamentos (`Equipment`) (RF-14), parâmetros de taxa de produção teórica máxima em múltiplas unidades e períodos (RF-15, RN-15), estabilidade de vínculos em renomeações (RF-16), bloqueio de exclusão de recursos vinculados (RF-11), manutenção, busca, sinalização de pendências e histórico de versões.

## Requirements

### Requirement: Manter equipes de trabalho e composições

O sistema SHALL permitir criar e editar equipes de trabalho com código (obrigatório, único no catálogo, texto livre — ex.: `EQ-CIV-01`, `EQ-MON-01`) e nome da equipe como identidade, e, como atributos versionados: taxa de produção teórica padrão (`standardProductionRate`), unidade de medida da produção (`productionUnit` — texto livre, ex.: `m3`, `torre`, `km`, `un`, `m`), período base da produção (`productionPeriod` — enum: `HOUR`, `DAY`, `WEEK`, `MONTH`), lista de composição de mão de obra (`workCrewLaborRoles`) e lista de composição de equipamentos (`workCrewEquipments`). Cada item de mão de obra SHALL referenciar um cargo de mão de obra (`LaborRole`) ativo e definir uma quantidade decimal maior que zero (`quantity`). Cada item de equipamento SHALL referenciar um equipamento (`Equipment`) ativo e definir uma quantidade decimal maior que zero (`quantity`). Todos os atributos numéricos SHALL ser armazenados com precisão decimal, nunca em ponto flutuante binário (RNF-08).

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

### Requirement: Estabilidade de vínculos em renomeações de recursos

O sistema SHALL manter as composições de equipes íntegras e vinculadas por chaves primárias estáveis independentemente de alterações no código ou nome de cargos de mão de obra ou equipamentos (RF-16).

#### Scenario: Cargo renomeado reflete na composição sem quebra
- **WHEN** o nome ou código de um cargo de mão de obra é atualizado no catálogo de mão de obra
- **THEN** a consulta da composição da equipe exibe o cargo com o novo nome mantendo a quantidade e o histórico intactos

### Requirement: Bloquear exclusão de recurso vinculado a equipes

O sistema SHALL impedir a exclusão de qualquer cargo de mão de obra ou equipamento que esteja referenciado em uma versão de equipe de trabalho (RF-11).

#### Scenario: Tentativa de exclusão de cargo utilizado em equipe
- **WHEN** um usuário tenta excluir um cargo de mão de obra presente na composição de uma equipe
- **THEN** o sistema rejeita a exclusão informando que o recurso está vinculado a uma ou mais equipes

### Requirement: Listar e buscar equipes de trabalho

O sistema SHALL exibir a listagem das equipes de trabalho em suas versões vigentes, com busca por código e nome, exibindo a contagem total de funções de mão de obra, total de equipamentos e taxa de produção teórica.

#### Scenario: Busca por código ou nome de equipe
- **WHEN** um usuário pesquisa por parte do código ou nome de uma equipe
- **THEN** a listagem exibe as equipes correspondentes com os dados vigentes da versão

### Requirement: Sinalizar equipes com pendências

O sistema SHALL sinalizar na listagem as equipes que não possuem ao menos um item de composição ou que não possuem taxa de produção teórica informada (RF-11), distinguindo valores nulos de zeros (RNF-09).

#### Scenario: Equipe sem itens de composição aparece sinalizada
- **WHEN** uma versão de equipe foi criada sem nenhum cargo ou equipamento associado
- **THEN** a listagem exibe a equipe com badge visual de pendência indicando a ausência de composição

#### Scenario: Equipe sem taxa de produção aparece sinalizada
- **WHEN** uma equipe possui composição mas a taxa de produção teórica não foi informada
- **THEN** a listagem exibe a equipe com sinalização de pendência

### Requirement: Exibir histórico de versões de equipe

O sistema SHALL exibir o histórico de versões da equipe com data de vigência, autor, taxa de produção e o detalhamento completo dos cargos e equipamentos que compunham a equipe naquela versão.

#### Scenario: Consulta do histórico de versões
- **WHEN** um usuário abre o histórico de uma equipe que possui múltiplas versões
- **THEN** o sistema lista todas as versões em ordem cronológica de vigência, com autor, data e o detalhe das composições de cada versão
