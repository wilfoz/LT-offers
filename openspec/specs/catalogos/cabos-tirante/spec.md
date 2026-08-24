# catalogos/cabos-tirante

## Purpose

Catálogo corporativo de cabos de aço para tirante (origem: aba `DB_CTI` da planilha — tirantes que estaiam torres e cabos de interligação), com manutenção, busca, validação, sinalização de pendências e histórico (RF-07, parte final da família de cabos). O versionamento por vigência segue o comportamento comum de `catalogos/versionamento-vigencia`.

## Requirements

### Requirement: Manter itens de cabo de tirante

O sistema SHALL permitir criar e editar itens de cabo de aço para tirante com os atributos: código (obrigatório, único no catálogo), descrição, peso em toneladas por quilômetro, comprimento de bobina em metros, diâmetro em milímetros, UTS (carga de ruptura, em quilonewtons), classe de galvanização, grau de resistência e número de fios. Os atributos numéricos SHALL ser armazenados e exibidos com precisão decimal, nunca em ponto flutuante binário (RNF-08); número de fios SHALL ser inteiro positivo.

#### Scenario: Criação com dados válidos

- **WHEN** um usuário cria um cabo de tirante com código inédito e valores válidos
- **THEN** o sistema grava o item como primeira versão e o exibe na listagem

#### Scenario: Código duplicado é rejeitado

- **WHEN** um usuário tenta criar um cabo de tirante com um código que já existe no catálogo
- **THEN** o sistema rejeita a operação e informa que o código já está em uso

#### Scenario: Valores numéricos inválidos são rejeitados

- **WHEN** um usuário informa peso, bobina, diâmetro ou UTS com valor negativo ou não numérico
- **THEN** o sistema rejeita a operação apontando o campo inválido em português

#### Scenario: Número de fios não inteiro é rejeitado

- **WHEN** um usuário informa número de fios com valor fracionário, zero ou negativo
- **THEN** o sistema rejeita a operação apontando o campo inválido em português

### Requirement: Listar e buscar cabos de tirante

O sistema SHALL exibir a listagem dos cabos de tirante em suas versões vigentes, com busca por código e descrição.

#### Scenario: Busca por código

- **WHEN** um usuário busca por parte do código de um cabo de tirante existente
- **THEN** a listagem exibe os itens cujo código contém o termo, mostrando os valores da versão vigente

### Requirement: Sinalizar itens incompletos

O sistema SHALL sinalizar na listagem os itens sem todos os dados obrigatórios preenchidos (RF-11 parcial), distinguindo campo não informado de campo com valor zero (RNF-09). São obrigatórios: peso, bobina, diâmetro, UTS, classe de galvanização, grau de resistência e número de fios. Descrição não gera pendência.

#### Scenario: Item sem grau de resistência aparece sinalizado

- **WHEN** um cabo de tirante foi salvo sem grau de resistência
- **THEN** a listagem exibe o item com indicação visível de pendência, identificando o campo ausente

### Requirement: Exibir histórico de versões

O sistema SHALL exibir, para cada cabo de tirante, o histórico de versões com data de início de vigência, autor e valores de cada versão.

#### Scenario: Consulta do histórico após edição

- **WHEN** um usuário abre o histórico de um cabo de tirante que já foi editado
- **THEN** o sistema lista todas as versões em ordem de vigência, cada uma com autor, instante de criação e valores da época
