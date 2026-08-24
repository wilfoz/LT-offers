# catalogos/series-torres

## Purpose

Catálogo corporativo de séries de estruturas e seus tipos de torre (origem: aba `DB_TOR` da planilha), em dois níveis — série (projetista, tensão, circuitos, cabos por fase, vento de projeto, tipo de isolador, SIL) e tipo de torre (função, estais, tabela peso × altura) — com manutenção, busca, validação, sinalização de pendências e histórico por nível (RF-08). O versionamento por vigência segue o comportamento comum de `catalogos/versionamento-vigencia`, aplicado independentemente a cada nível.

## ADDED Requirements

### Requirement: Manter séries de estrutura

O sistema SHALL permitir criar e editar séries de estrutura com nome (obrigatório, único no catálogo) como identidade e, como atributos versionados: projetista, tensão em quilovolts, quantidade de circuitos, cabos por fase, vento de projeto em metros por segundo, tipo de isolador (texto livre) e SIL em megawatts. Os atributos numéricos SHALL ser armazenados e exibidos com precisão decimal, nunca em ponto flutuante binário (RNF-08); quantidade de circuitos e cabos por fase SHALL ser inteiros positivos.

#### Scenario: Criação com dados válidos

- **WHEN** um usuário cria uma série com nome inédito e valores válidos
- **THEN** o sistema grava a série como primeira versão e a exibe na listagem

#### Scenario: Nome duplicado é rejeitado

- **WHEN** um usuário tenta criar uma série com um nome que já existe no catálogo
- **THEN** o sistema rejeita a operação e informa que o nome já está em uso

#### Scenario: Valores numéricos inválidos são rejeitados

- **WHEN** um usuário informa tensão, vento de projeto ou SIL com valor negativo ou não numérico, ou circuitos ou cabos por fase com valor fracionário, zero ou negativo
- **THEN** o sistema rejeita a operação apontando o campo inválido em português

### Requirement: Manter tipos de torre de uma série

O sistema SHALL permitir criar e editar tipos de torre pertencentes a uma série existente, com sigla (obrigatória, única dentro da série) e função (suspensão ou ancoragem) como identidade, e, como atributos versionados: quantidade de estais (inteiro maior ou igual a zero — zero é valor válido de torre autoportante, distinto de não informado, RNF-09) e a tabela peso × altura. A função SHALL ser imutável após a criação: uma tentativa de troca de função em edição SHALL ser rejeitada com mensagem em português.

#### Scenario: Criação de tipo de torre com dados válidos

- **WHEN** um usuário cria um tipo de torre em uma série existente com sigla inédita na série, função e valores válidos
- **THEN** o sistema grava o tipo como primeira versão e o exibe na listagem de tipos da série

#### Scenario: Sigla duplicada na mesma série é rejeitada

- **WHEN** um usuário tenta criar um tipo de torre com uma sigla que já existe na mesma série
- **THEN** o sistema rejeita a operação e informa que a sigla já está em uso na série

#### Scenario: Mesma sigla em séries diferentes é aceita

- **WHEN** um usuário cria um tipo de torre com uma sigla que já existe em outra série
- **THEN** o sistema aceita a operação, pois a unicidade da sigla é por série

#### Scenario: Troca de função é rejeitada

- **WHEN** um usuário tenta editar um tipo de torre alterando sua função
- **THEN** o sistema rejeita a operação e informa que a função não pode ser alterada

#### Scenario: Tipo de torre em série inexistente é rejeitado

- **WHEN** um usuário tenta criar um tipo de torre referenciando uma série que não existe
- **THEN** o sistema rejeita a operação informando que a série não foi encontrada

### Requirement: Manter tabela peso por altura do tipo de torre

O sistema SHALL permitir informar, em cada versão de tipo de torre, a tabela peso × altura como conjunto de pontos discretos (altura em metros → peso em quilogramas), com altura única dentro da versão e valores decimais positivos. Cada versão SHALL carregar sua tabela completa: a edição de um ponto gera nova versão com a tabela inteira, e versões anteriores preservam as tabelas da época.

#### Scenario: Registro de pontos peso × altura

- **WHEN** um usuário salva um tipo de torre com pontos de altura e peso válidos
- **THEN** o sistema grava os pontos na versão criada e os exibe ordenados por altura

#### Scenario: Altura repetida na mesma versão é rejeitada

- **WHEN** um usuário informa dois pontos com a mesma altura
- **THEN** o sistema rejeita a operação e informa que a altura está duplicada

#### Scenario: Ponto com valor inválido é rejeitado

- **WHEN** um usuário informa altura ou peso com valor negativo, zero ou não numérico
- **THEN** o sistema rejeita a operação apontando o campo inválido em português

#### Scenario: Versão anterior preserva a tabela da época

- **WHEN** um usuário edita a tabela peso × altura de um tipo de torre que já tinha versão com pontos
- **THEN** o histórico exibe a versão anterior com os pontos originais e a nova versão com os pontos editados

### Requirement: Listar e buscar séries de estrutura

O sistema SHALL exibir a listagem das séries em suas versões vigentes, com busca por nome e projetista, e indicar a quantidade de tipos de torre de cada série.

#### Scenario: Busca por nome

- **WHEN** um usuário busca por parte do nome de uma série existente
- **THEN** a listagem exibe as séries cujo nome contém o termo, mostrando os valores da versão vigente

### Requirement: Listar tipos de torre de uma série

O sistema SHALL exibir, para uma série, a listagem de seus tipos de torre em suas versões vigentes, com sigla, função, quantidade de estais e resumo da tabela peso × altura.

#### Scenario: Listagem de tipos da série

- **WHEN** um usuário abre uma série que possui tipos de torre
- **THEN** o sistema lista os tipos da série com os valores da versão vigente de cada um

### Requirement: Sinalizar registros incompletos

O sistema SHALL sinalizar nas listagens os registros sem todos os dados obrigatórios preenchidos (RF-11 parcial), distinguindo campo não informado de campo com valor zero (RNF-09). Na série são obrigatórios: projetista, tensão, quantidade de circuitos, cabos por fase, vento de projeto, tipo de isolador e SIL. No tipo de torre são obrigatórios: quantidade de estais e ao menos um ponto na tabela peso × altura.

#### Scenario: Série sem SIL aparece sinalizada

- **WHEN** uma série foi salva sem SIL
- **THEN** a listagem exibe a série com indicação visível de pendência, identificando o campo ausente

#### Scenario: Tipo de torre com zero estais não é pendência

- **WHEN** um tipo de torre foi salvo com quantidade de estais igual a zero e tabela peso × altura preenchida
- **THEN** a listagem exibe o tipo sem indicação de pendência

#### Scenario: Tipo de torre sem pontos de peso aparece sinalizado

- **WHEN** um tipo de torre foi salvo sem nenhum ponto na tabela peso × altura
- **THEN** a listagem exibe o tipo com indicação visível de pendência, identificando a tabela ausente

### Requirement: Exibir histórico de versões por nível

O sistema SHALL exibir, para cada série e para cada tipo de torre, o histórico de versões com data de início de vigência, autor e valores de cada versão — incluindo, no tipo de torre, a tabela peso × altura de cada versão.

#### Scenario: Consulta do histórico da série após edição

- **WHEN** um usuário abre o histórico de uma série que já foi editada
- **THEN** o sistema lista todas as versões em ordem de vigência, cada uma com autor, instante de criação e valores da época

#### Scenario: Consulta do histórico do tipo de torre

- **WHEN** um usuário abre o histórico de um tipo de torre com mais de uma versão
- **THEN** o sistema lista as versões com autor, instante de criação, valores e a tabela peso × altura de cada época
