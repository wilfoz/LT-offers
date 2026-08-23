# Delta: catalogos/versionamento-vigencia

## Purpose

Comportamento comum de versionamento dos catálogos corporativos por vigência: toda alteração gera uma nova versão datada, o histórico é imutável e qualquer consumidor consegue resolver a versão vigente para uma data — base da reprodutibilidade histórica das ofertas (RNF-05, RF-10).

## ADDED Requirements

### Requirement: Alterações criam nova versão com vigência

O sistema SHALL registrar toda alteração de um item de catálogo como uma nova versão com data de início de vigência, preservando as versões anteriores sem modificação.

#### Scenario: Edição de item gera nova versão

- **WHEN** um usuário edita um item de catálogo que já possui versão vigente e salva com uma data de início de vigência
- **THEN** o sistema cria uma nova versão com os dados editados e a versão anterior permanece inalterada no histórico

#### Scenario: Versão histórica é imutável

- **WHEN** um usuário tenta alterar diretamente o conteúdo de uma versão anterior à vigente
- **THEN** o sistema rejeita a operação e orienta a criar uma nova versão

### Requirement: Resolução da versão vigente por data

O sistema SHALL retornar, para um item de catálogo e uma data de referência, a versão cuja vigência estava ativa naquela data — a versão com a maior data de início de vigência menor ou igual à data de referência.

#### Scenario: Consulta na data atual

- **WHEN** um consumidor consulta um item sem informar data de referência
- **THEN** o sistema retorna a versão vigente na data atual

#### Scenario: Consulta em data passada

- **WHEN** um consumidor consulta um item informando uma data anterior à vigência atual
- **THEN** o sistema retorna a versão que estava vigente naquela data, com os valores da época

#### Scenario: Data anterior à primeira vigência

- **WHEN** um consumidor consulta um item com data de referência anterior ao início da primeira versão
- **THEN** o sistema responde que não há versão vigente para a data, sem retornar valor algum

### Requirement: Trilha de autoria por versão

O sistema SHALL registrar automaticamente, em cada versão criada, o autor e a data/hora da criação (RF-03).

#### Scenario: Autoria registrada na criação

- **WHEN** um usuário cria ou edita um item de catálogo
- **THEN** a versão resultante registra o autor e o instante da operação, e ambos ficam visíveis no histórico
