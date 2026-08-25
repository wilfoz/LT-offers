# catalogos/isoladores — delta

## Purpose

Catálogo corporativo de isoladores (origem: aba `DB_AIS` da planilha — isoladores das cadeias de suspensão e ancoragem), com manutenção, busca, validação, sinalização de pendências e histórico (M02). O versionamento por vigência segue o comportamento comum de `catalogos/versionamento-vigencia`.

## ADDED Requirements

### Requirement: Manter itens de isolador

O sistema SHALL permitir criar e editar itens de isolador com os atributos: código (obrigatório, único no catálogo), descrição, tipo, fabricante, perfil, carga de ruptura em quilonewtons, diâmetro em milímetros, passo em milímetros e linha de fuga em milímetros. Tipo, fabricante e perfil SHALL ser texto livre (o levantamento não enumera valores — hipótese §02, registrada na proposta). Os atributos numéricos SHALL ser armazenados e exibidos com precisão decimal, nunca em ponto flutuante binário (RNF-08).

#### Scenario: Criação com dados válidos

- **WHEN** um usuário cria um isolador com código inédito e valores válidos
- **THEN** o sistema grava o item como primeira versão e o exibe na listagem

#### Scenario: Código duplicado é rejeitado

- **WHEN** um usuário tenta criar um isolador com um código que já existe no catálogo
- **THEN** o sistema rejeita a operação e informa que o código já está em uso

#### Scenario: Valores numéricos inválidos são rejeitados

- **WHEN** um usuário informa carga de ruptura, diâmetro, passo ou linha de fuga com valor negativo ou não numérico
- **THEN** o sistema rejeita a operação apontando o campo inválido em português

### Requirement: Listar e buscar isoladores

O sistema SHALL exibir a listagem dos isoladores em suas versões vigentes, com busca por código e descrição.

#### Scenario: Busca por código

- **WHEN** um usuário busca por parte do código de um isolador existente
- **THEN** a listagem exibe os itens cujo código contém o termo, mostrando os valores da versão vigente

### Requirement: Sinalizar itens incompletos

O sistema SHALL sinalizar na listagem os itens sem todos os dados obrigatórios preenchidos (RF-11 parcial), distinguindo campo não informado de campo com valor zero (RNF-09). São obrigatórios: tipo, perfil, carga de ruptura, diâmetro, passo e linha de fuga. Fabricante e descrição não geram pendência.

#### Scenario: Item sem linha de fuga aparece sinalizado

- **WHEN** um isolador foi salvo sem linha de fuga
- **THEN** a listagem exibe o item com indicação visível de pendência, identificando o campo ausente

### Requirement: Exibir histórico de versões

O sistema SHALL exibir, para cada isolador, o histórico de versões com data de início de vigência, autor e valores de cada versão.

#### Scenario: Consulta do histórico após edição

- **WHEN** um usuário abre o histórico de um isolador que já foi editado
- **THEN** o sistema lista todas as versões em ordem de vigência, cada uma com autor, instante de criação e valores da época
