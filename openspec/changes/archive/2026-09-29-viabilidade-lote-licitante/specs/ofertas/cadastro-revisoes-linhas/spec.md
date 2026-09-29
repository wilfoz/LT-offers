## MODIFIED Requirements

### Requirement: Manter cadastro de ofertas

O sistema SHALL permitir criar e editar ofertas com leilão (ex.: `Leilão 01/2026`), lote (ex.: `Lote 1`), cliente/concessionária (ex.: `Axia Energia`), data da oferta, data do leilão, data de início do cronograma, data prevista de entrada em operação do edital, CAPEX estimado ANEEL (decimal monetário ≥ 0), RAP máxima (decimal monetário ≥ 0), RAP vencedora estimada (decimal monetário ≥ 0), **investimento total estimado pelo licitante** (decimal monetário ≥ 0, anulável — base da viabilidade do lote, M13) e moeda base (código ISO ex.: `BRL`, `USD`). O sistema SHALL registrar automaticamente autor e data/hora da última alteração (RF-01, RF-03).

Além dos rótulos livres de leilão e lote, o sistema SHALL aceitar a **identidade normalizada do leilão** publicada pela ANEEL — número do leilão no formato `NNN/AAAA` (ex.: `004/2026`), número do lote (inteiro ≥ 1) e código do sublote (ex.: `4A`, até 3 caracteres) — e os **prazos do edital**: data de assinatura do contrato de concessão (data civil) e prazo de construção em meses (inteiro ≥ 1). Todos esses campos são opcionais e, quando não informados, permanecem como "não informado", nunca convertidos em zero ou texto vazio (RNF-09). O CAPEX estimado ANEEL refere-se à estimativa oficial do **lote inteiro** (linhas, subestações e compensações), distinta do custo EPC calculado pelo sistema.

Quando a data de assinatura do contrato e o prazo de construção estiverem informados, o sistema SHALL derivar a **data-limite contratual** (assinatura acrescida do prazo em meses, em calendário civil) e exibi-la ao usuário. O sistema SHALL emitir alerta informativo e não bloqueante (RN-02) quando: (a) a data de início do cronograma for posterior à data de entrada em operação do edital; (b) a data-limite contratual derivada for posterior à data de entrada em operação do edital; ou (c) a data de início do cronograma for anterior à data de assinatura do contrato. O alerta identifica qual condição foi violada e permanece sinalizado na revisão.

#### Scenario: Criação de oferta com dados válidos

- **WHEN** um usuário cria uma oferta com identificação do leilão, lote, cliente e parâmetros financeiros e de datas válidos
- **THEN** o sistema grava a oferta gerando a primeira revisão inicial (R0) e a exibe na listagem de ofertas

#### Scenario: Criação de oferta com identidade normalizada do leilão

- **WHEN** um usuário informa número do leilão `004/2026`, lote `4`, sublote `4A`, assinatura do contrato `2027-02-26` e prazo de construção `60` meses
- **THEN** o sistema grava os cinco campos na revisão e devolve a data-limite contratual derivada `2032-02-26`

#### Scenario: Número do leilão fora do formato é rejeitado

- **WHEN** um usuário informa número do leilão `4/2026` ou `2026-004`
- **THEN** o sistema rejeita a gravação informando, em português, que o número do leilão deve estar no formato `NNN/AAAA`

#### Scenario: Prazo de construção inválido é rejeitado

- **WHEN** um usuário informa prazo de construção `0`, negativo ou não inteiro
- **THEN** o sistema rejeita a gravação informando, em português, que o prazo de construção deve ser um número inteiro de meses maior que zero

#### Scenario: Campos de identidade e prazo não informados permanecem nulos

- **WHEN** um usuário cria uma oferta sem informar número do leilão, lote, sublote, assinatura do contrato ou prazo de construção
- **THEN** o sistema grava esses campos como não informados e não deriva data-limite contratual nem emite alerta de prazo contratual

#### Scenario: Alerta de prazo do cronograma versus edital (RN-02)

- **WHEN** um usuário define uma data de início ou prazo cuja conclusão ultrapassa a data limite de entrada em operação do edital
- **THEN** o sistema alerta o usuário sobre a inconformidade de prazo mantendo a sinalização na revisão

#### Scenario: Alerta de data-limite contratual posterior à entrada em operação (RN-02)

- **WHEN** a assinatura do contrato é `2027-02-26`, o prazo de construção é `60` meses e a entrada em operação do edital é `2031-06-30`
- **THEN** o sistema exibe alerta informando que a data-limite contratual (`2032-02-26`) é posterior à entrada em operação do edital, sem impedir a gravação do rascunho

#### Scenario: Alerta de cronograma iniciado antes da assinatura do contrato (RN-02)

- **WHEN** a data de início do cronograma é anterior à data de assinatura do contrato de concessão
- **THEN** o sistema exibe alerta informando que o cronograma começa antes da assinatura do contrato, sem impedir a gravação do rascunho

#### Scenario: Investimento do licitante aceito e limpo como os demais campos financeiros

- **WHEN** um usuário informa `4110000000.00` como investimento total estimado pelo licitante em uma revisão rascunho, e depois o limpa
- **THEN** o sistema grava o valor como decimal exato, e após a limpeza o campo volta a "não informado" — nunca zero ou texto vazio (RNF-09)
