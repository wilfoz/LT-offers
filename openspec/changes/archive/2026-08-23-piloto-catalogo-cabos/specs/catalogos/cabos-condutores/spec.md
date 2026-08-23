# Delta: catalogos/cabos-condutores

## Purpose

Catálogo corporativo de cabos condutores (origem: aba `DB_CAL` da planilha) com os atributos usados pelo cálculo de condutores: manutenção, busca, validação e histórico — o piloto que estabelece o padrão dos demais catálogos (RF-07 parcial).

## ADDED Requirements

### Requirement: Manter itens de cabo condutor

O sistema SHALL permitir criar e editar itens de cabo condutor com os atributos: código (obrigatório, único no catálogo), descrição, peso em toneladas por quilômetro, comprimento de bobina em metros, diâmetro em milímetros e UTS (carga de ruptura, em quilonewtons). Os atributos numéricos SHALL ser armazenados e exibidos com precisão decimal, nunca em ponto flutuante binário (RNF-08).

#### Scenario: Criação com dados válidos

- **WHEN** um usuário cria um cabo condutor com código inédito e valores numéricos positivos
- **THEN** o sistema grava o item como primeira versão e o exibe na listagem

#### Scenario: Código duplicado é rejeitado

- **WHEN** um usuário tenta criar um cabo condutor com um código que já existe no catálogo
- **THEN** o sistema rejeita a operação e informa que o código já está em uso

#### Scenario: Valores numéricos inválidos são rejeitados

- **WHEN** um usuário informa peso, bobina, diâmetro ou UTS com valor negativo ou não numérico
- **THEN** o sistema rejeita a operação apontando o campo inválido em português

### Requirement: Listar e buscar cabos condutores

O sistema SHALL exibir a listagem dos cabos condutores em suas versões vigentes, com busca por código e descrição.

#### Scenario: Busca por código

- **WHEN** um usuário busca por parte do código de um cabo existente
- **THEN** a listagem exibe os itens cujo código contém o termo, mostrando os valores da versão vigente

### Requirement: Sinalizar itens incompletos

O sistema SHALL sinalizar na listagem os itens sem todos os dados obrigatórios preenchidos (RF-11 parcial), distinguindo campo não informado de campo com valor zero (RNF-09).

#### Scenario: Item sem UTS aparece sinalizado

- **WHEN** um item de cabo condutor foi salvo sem o valor de UTS
- **THEN** a listagem exibe o item com indicação visível de pendência, identificando o campo ausente

### Requirement: Exibir histórico de versões

O sistema SHALL exibir, para cada cabo condutor, o histórico de versões com data de início de vigência, autor e valores de cada versão.

#### Scenario: Consulta do histórico após edição

- **WHEN** um usuário abre o histórico de um cabo que já foi editado
- **THEN** o sistema lista todas as versões em ordem de vigência, cada uma com autor, instante de criação e valores da época
