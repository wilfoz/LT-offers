# catalogos/cabos-guarda

## Purpose

Catálogo corporativo de cabos de guarda nos tipos aço galvanizado e OPGW (origem: abas `DB_CGA` e `DB_OPGW` da planilha), com atributos comuns à família e específicos por tipo: manutenção, busca com filtro por tipo, validação, sinalização de pendências e histórico (RF-07 parcial). O versionamento por vigência segue o comportamento comum de `catalogos/versionamento-vigencia`.

## ADDED Requirements

### Requirement: Manter itens de cabo de guarda com tipo

O sistema SHALL permitir criar e editar itens de cabo de guarda com um tipo — aço ou OPGW — e os atributos comuns: código (obrigatório, único no catálogo, independentemente do tipo), descrição, peso em toneladas por quilômetro, comprimento de bobina em metros, diâmetro em milímetros e UTS (carga de ruptura, em quilonewtons). O tipo SHALL ser definido na criação e não pode ser alterado depois. Os atributos numéricos SHALL ser armazenados e exibidos com precisão decimal, nunca em ponto flutuante binário (RNF-08).

#### Scenario: Criação de cabo de aço com dados válidos

- **WHEN** um usuário cria um cabo de guarda do tipo aço com código inédito e valores numéricos positivos
- **THEN** o sistema grava o item como primeira versão e o exibe na listagem com o tipo aço

#### Scenario: Criação de cabo OPGW com dados válidos

- **WHEN** um usuário cria um cabo de guarda do tipo OPGW com código inédito e valores numéricos positivos
- **THEN** o sistema grava o item como primeira versão e o exibe na listagem com o tipo OPGW

#### Scenario: Código duplicado é rejeitado mesmo entre tipos diferentes

- **WHEN** um usuário tenta criar um cabo de guarda com um código que já existe no catálogo, ainda que com outro tipo
- **THEN** o sistema rejeita a operação e informa que o código já está em uso

#### Scenario: Tipo inválido é rejeitado

- **WHEN** um usuário tenta criar um cabo de guarda com um tipo diferente de aço ou OPGW
- **THEN** o sistema rejeita a operação apontando o tipo inválido em português

#### Scenario: Tipo não pode ser alterado em edição

- **WHEN** um usuário tenta alterar o tipo de um cabo de guarda existente ao criar uma nova versão
- **THEN** o sistema rejeita a operação e informa que o tipo é fixo desde a criação

#### Scenario: Valores numéricos inválidos são rejeitados

- **WHEN** um usuário informa peso, bobina, diâmetro ou UTS com valor negativo ou não numérico
- **THEN** o sistema rejeita a operação apontando o campo inválido em português

### Requirement: Registrar atributos específicos por tipo

O sistema SHALL registrar, em cabos do tipo aço, os atributos classe de galvanização, grau de resistência e número de fios; e, em cabos do tipo OPGW, os atributos fabricante, I²t (em kA²·s) e número de fibras. O sistema SHALL rejeitar atributo específico de um tipo informado em item do outro tipo, apontando o campo indevido em português. Número de fios e número de fibras SHALL ser inteiros positivos; I²t SHALL ter precisão decimal (RNF-08).

#### Scenario: Atributo de OPGW em cabo de aço é rejeitado

- **WHEN** um usuário informa número de fibras ou I²t ao criar ou editar um cabo do tipo aço
- **THEN** o sistema rejeita a operação apontando que o campo não se aplica ao tipo aço

#### Scenario: Atributo de aço em cabo OPGW é rejeitado

- **WHEN** um usuário informa classe de galvanização, grau de resistência ou número de fios ao criar ou editar um cabo do tipo OPGW
- **THEN** o sistema rejeita a operação apontando que o campo não se aplica ao tipo OPGW

#### Scenario: Contagens não inteiras são rejeitadas

- **WHEN** um usuário informa número de fios ou de fibras com valor fracionário, zero ou negativo
- **THEN** o sistema rejeita a operação apontando o campo inválido em português

### Requirement: Listar e buscar cabos de guarda com filtro por tipo

O sistema SHALL exibir a listagem dos cabos de guarda em suas versões vigentes, com busca por código e descrição e filtro por tipo (todos, aço ou OPGW).

#### Scenario: Busca por código

- **WHEN** um usuário busca por parte do código de um cabo de guarda existente
- **THEN** a listagem exibe os itens cujo código contém o termo, mostrando o tipo e os valores da versão vigente

#### Scenario: Filtro por tipo

- **WHEN** um usuário filtra a listagem pelo tipo OPGW
- **THEN** a listagem exibe apenas os cabos do tipo OPGW, mantendo o termo de busca aplicado

### Requirement: Sinalizar itens incompletos conforme o tipo

O sistema SHALL sinalizar na listagem os itens sem todos os dados obrigatórios preenchidos (RF-11 parcial), distinguindo campo não informado de campo com valor zero (RNF-09). São obrigatórios os atributos comuns numéricos (peso, bobina, diâmetro, UTS) e, conforme o tipo: classe de galvanização, grau de resistência e número de fios (aço); I²t e número de fibras (OPGW). Fabricante e descrição não geram pendência.

#### Scenario: Cabo de aço sem classe de galvanização aparece sinalizado

- **WHEN** um cabo do tipo aço foi salvo sem classe de galvanização
- **THEN** a listagem exibe o item com indicação visível de pendência, identificando o campo ausente

#### Scenario: Cabo OPGW sem fabricante não é pendência

- **WHEN** um cabo do tipo OPGW foi salvo com todos os campos obrigatórios e sem fabricante
- **THEN** a listagem exibe o item sem indicação de pendência

### Requirement: Exibir histórico de versões

O sistema SHALL exibir, para cada cabo de guarda, o histórico de versões com data de início de vigência, autor e valores de cada versão, incluindo os atributos específicos do tipo.

#### Scenario: Consulta do histórico após edição

- **WHEN** um usuário abre o histórico de um cabo de guarda que já foi editado
- **THEN** o sistema lista todas as versões em ordem de vigência, cada uma com autor, instante de criação e valores da época
