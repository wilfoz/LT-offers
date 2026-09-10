# catalogos/custos-fixos

## Purpose

Catálogo corporativo de custos fixos e indiretos de canteiro e equipe de obra (origem: aba `DB_FI` da planilha — EPI, exames médicos, uniformes, mobilização e desmobilização), com manutenção, busca, filtros por categoria, validação, sinalização de pendências e histórico. O versionamento por vigência segue o comportamento comum de `catalogos/versionamento-vigencia`.

## Requirements

### Requirement: Manter itens de custo fixo

O sistema SHALL permitir criar e editar itens de custo fixo com código (obrigatório, único no catálogo, texto livre — ex.: `EPI01`, `EXAM01`), descrição e categoria como identidade, e, como atributos versionados: custo unitário (`unitCost`) e unidade de medida/frequência (`unit` — ex.: mês, unid, pessoa, viagem). O custo unitário SHALL ser armazenado e exibido com precisão decimal, nunca em ponto flutuante binário (RNF-08); valores monetários informados SHALL ser maiores ou iguais a zero.

#### Scenario: Criação de custo fixo com dados válidos

- **WHEN** um usuário cria um item de custo fixo com código inédito, descrição, categoria, unidade e custo unitário válidos
- **THEN** o sistema grava o item como primeira versão e o exibe na listagem

#### Scenario: Código duplicado é rejeitado

- **WHEN** um usuário tenta criar um item de custo fixo com um código que já existe no catálogo
- **THEN** o sistema rejeita a operação e informa que o código já está em uso

#### Scenario: Custo unitário negativo é rejeitado

- **WHEN** um usuário informa custo unitário com valor negativo
- **THEN** o sistema rejeita a operação apontando o campo inválido em português

### Requirement: Listar e buscar custos fixos

O sistema SHALL exibir a listagem dos itens de custo fixo em suas versões vigentes, com busca por código e descrição e filtro por categoria.

#### Scenario: Busca por código ou descrição

- **WHEN** um usuário busca por parte do código ou da descrição de um item de custo fixo
- **THEN** a listagem exibe os itens que contêm o termo com seus valores vigentes

#### Scenario: Filtro por categoria de custo fixo

- **WHEN** um usuário filtra a listagem por uma categoria específica (ex.: EPI)
- **THEN** a listagem exibe apenas os itens daquela categoria

### Requirement: Sinalizar custos fixos incompletos

O sistema SHALL sinalizar na listagem os itens sem todos os dados obrigatórios preenchidos (RF-11 parcial), distinguindo campo não informado de campo com valor zero (RNF-09). São obrigatórios: descrição, categoria, unidade e custo unitário.

#### Scenario: Custo fixo sem valor informado aparece sinalizado

- **WHEN** um item de custo fixo foi salvo sem custo unitário informado
- **THEN** a listagem exibe o item com indicação visível de pendência

#### Scenario: Custo fixo com valor zero não é pendência

- **WHEN** um item de custo fixo foi salvo com custo unitário igual a zero
- **THEN** a listagem exibe o item sem sinalização de pendência

### Requirement: Exibir histórico de versões de custo fixo

O sistema SHALL exibir, para cada item de custo fixo, o histórico de versões com data de início de vigência, autor e valores de cada versão.

#### Scenario: Consulta do histórico de custo fixo após edição

- **WHEN** um usuário abre o histórico de um item de custo fixo que já foi editado
- **THEN** o sistema lista todas as versões em ordem de vigência, cada uma com autor, instante de criação e valores da época
