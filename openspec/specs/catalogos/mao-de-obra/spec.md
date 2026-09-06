# catalogos/mao-de-obra

## Purpose

Catálogo corporativo de cargos de mão de obra (origem: aba `DB_MO` da planilha), com remunerações base, adicionais legais (periculosidade, horas extras, DSR), encargos sociais e benefícios de campo (alimentação, alojamento, folgas/viagens, saúde, seguro de vida) (RF-12, RN-14), com manutenção, busca, validação, sinalização de pendências e histórico. O versionamento por vigência segue o comportamento comum de `catalogos/versionamento-vigencia`.

## Requirements

### Requirement: Manter cargos de mão de obra

O sistema SHALL permitir criar e editar cargos de mão de obra com código (obrigatório, único no catálogo, texto livre — ex.: `ENC01`, `ELET01`) e nome do cargo como identidade, e, como atributos versionados: salário base mensal (`baseSalary`), percentual de periculosidade (`hazardPayPercent`), percentual de horas extras (`overtimePercent`), percentual de DSR sobre horas extras (`dsrOvertimePercent`), encargos sociais (`socialChargesPercent`), benefício de alimentação mensal (`foodAllowanceMonthly`), alojamento mensal (`housingMonthly`), folgas de campo com viagem mensal (`homeLeaveTravelMonthly`), plano de saúde mensal (`healthInsuranceMonthly`) e seguro de vida mensal (`lifeInsuranceMonthly`). Os atributos numéricos SHALL ser armazenados e exibidos com precisão decimal, nunca em ponto flutuante binário (RNF-08); todos os valores numéricos informados SHALL ser maiores ou iguais a zero.

#### Scenario: Criação de cargo com dados válidos

- **WHEN** um usuário cria um cargo com código inédito, nome e valores de remuneração válidos
- **THEN** o sistema grava o cargo como primeira versão e o exibe na listagem

#### Scenario: Código duplicado é rejeitado

- **WHEN** um usuário tenta criar um cargo com um código que já existe no catálogo
- **THEN** o sistema rejeita a operação e informa que o código já está em uso

#### Scenario: Valores numéricos negativos são rejeitados

- **WHEN** um usuário informa salário base, percentuais ou benefícios com valor negativo
- **THEN** o sistema rejeita a operação apontando o campo inválido em português

### Requirement: Listar e buscar cargos de mão de obra

O sistema SHALL exibir a listagem dos cargos em suas versões vigentes, com busca por código e nome do cargo.

#### Scenario: Busca por código ou nome

- **WHEN** um usuário busca por parte do código ou do nome de um cargo existente
- **THEN** a listagem exibe os cargos que contêm o termo, exibindo os valores da versão vigente

### Requirement: Sinalizar cargos incompletos

O sistema SHALL sinalizar na listagem os cargos sem todos os dados essenciais preenchidos (RF-11 parcial), distinguindo campo não informado de campo com valor zero (RNF-09). São obrigatórios: nome do cargo, salário base e encargos sociais.

#### Scenario: Cargo sem salário base aparece sinalizado

- **WHEN** um cargo foi salvo sem salário base informado
- **THEN** a listagem exibe o cargo com indicação visível de pendência, identificando o campo ausente

#### Scenario: Cargo com salário zero não é pendência

- **WHEN** um cargo foi salvo com salário base igual a zero e encargos informados
- **THEN** a listagem exibe o cargo sem sinalização de pendência

### Requirement: Exibir histórico de versões de cargo

O sistema SHALL exibir, para cada cargo, o histórico de versões com data de início de vigência, autor e valores de cada versão.

#### Scenario: Consulta do histórico de cargo após edição

- **WHEN** um usuário abre o histórico de um cargo que já foi editado
- **THEN** o sistema lista todas as versões em ordem de vigência, cada uma com autor, instante de criação e valores da época
