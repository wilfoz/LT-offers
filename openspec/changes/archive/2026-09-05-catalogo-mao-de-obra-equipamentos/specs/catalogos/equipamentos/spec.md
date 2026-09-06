## Purpose

Catálogo corporativo de equipamentos de obra (origem: aba `DB_EQ` da planilha), contemplando as modalidades de precificação (locação externa, locação interna, aquisição com amortização) e custos operacionais (RF-13, RN-17), com manutenção, busca, filtros por categoria, validação, sinalização de pendências e histórico. O versionamento por vigência segue o comportamento comum de `catalogos/versionamento-vigencia`.

## ADDED Requirements

### Requirement: Manter equipamentos de obra

O sistema SHALL permitir criar e editar equipamentos com código (obrigatório, único no catálogo, texto livre — ex.: `TRAT01`, `GUIN01`), descrição e categoria como identidade, e, como atributos versionados: custo mensal de locação externa (`externalRentalMonthly`), custo mensal de locação interna (`internalRentalMonthly`), preço de compra (`purchasePrice`), prazo de depreciação/amortização em anos (`depreciationYears`), disponibilidade própria padrão (`ownedAvailabilityCount`) e custo estimado mensal de combustível e manutenção (`fuelMaintenanceMonthly`). Os atributos numéricos SHALL ser armazenados e exibidos com precisão decimal, nunca em ponto flutuante binário (RNF-08); valores monetários e contagens informados SHALL ser maiores ou iguais a zero, e o prazo de amortização, quando informado, SHALL ser inteiro maior que zero.

#### Scenario: Criação de equipamento com dados válidos

- **WHEN** um usuário cria um equipamento com código inédito, descrição, categoria e valores de locação válidos
- **THEN** o sistema grava o equipamento como primeira versão e o exibe na listagem

#### Scenario: Código duplicado é rejeitado

- **WHEN** um usuário tenta criar um equipamento com um código que já existe no catálogo
- **THEN** o sistema rejeita a operação e informa que o código já está em uso

#### Scenario: Valores numéricos negativos são rejeitados

- **WHEN** um usuário informa valores monetários ou contagens negativas
- **THEN** o sistema rejeita a operação apontando o campo inválido em português

#### Scenario: Prazo de depreciação zero ou negativo é rejeitado

- **WHEN** um usuário informa prazo de depreciação menor ou igual a zero
- **THEN** o sistema rejeita a operação e informa que os anos de amortização devem ser maiores que zero

### Requirement: Listar e buscar equipamentos

O sistema SHALL exibir a listagem dos equipamentos em suas versões vigentes, com busca por código e descrição e filtro por categoria.

#### Scenario: Busca por código ou descrição

- **WHEN** um usuário busca por parte do código ou da descrição de um equipamento existente
- **THEN** a listagem exibe os equipamentos correspondentes com os valores vigentes

#### Scenario: Filtro por categoria de equipamento

- **WHEN** um usuário filtra a listagem por uma categoria específica
- **THEN** a listagem exibe apenas os equipamentos pertencentes àquela categoria

### Requirement: Sinalizar equipamentos incompletos

O sistema SHALL sinalizar na listagem os equipamentos sem dados essenciais preenchidos (RF-11 parcial), distinguindo campo não informado de campo com valor zero (RNF-09). São obrigatórios: descrição, categoria e ao menos uma estratégia de custo informada (locação externa, locação interna ou preço de compra com anos de amortização).

#### Scenario: Equipamento sem nenhuma estratégia de custo aparece sinalizado

- **WHEN** um equipamento foi salvo sem valor de locação externa, locação interna ou preço de compra
- **THEN** a listagem exibe o equipamento com indicação visível de pendência

#### Scenario: Equipamento com locação externa informada não é pendência

- **WHEN** um equipamento foi salvo com descrição, categoria e locação externa informada
- **THEN** a listagem exibe o equipamento sem sinalização de pendência

### Requirement: Exibir histórico de versões de equipamento

O sistema SHALL exibir, para cada equipamento, o histórico de versões com data de início de vigência, autor e valores de cada versão.

#### Scenario: Consulta do histórico de equipamento após edição

- **WHEN** um usuário abre o histórico de um equipamento que já foi editado
- **THEN** o sistema lista todas as versões em ordem de vigência, cada uma com autor, instante de criação e valores da época
