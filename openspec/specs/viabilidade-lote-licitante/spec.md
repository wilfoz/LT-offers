## Purpose

Define o módulo M13 — viabilidade do lote para o licitante: parâmetros regulatório-financeiros versionados por vigência (RNF-05), derivação em termos reais da anuidade do investimento, da RAP bruta mínima e do deságio máximo suportado ao WACC regulatório (RNF-08), e o painel de viabilidade no detalhe da oferta comparado aos deságios praticados do histórico ANEEL (RNF-04, RNF-09, RNF-14).

## Requirements

### Requirement: Manter parâmetros de viabilidade versionados por vigência (RNF-05)

O sistema SHALL manter um catálogo singleton de parâmetros de viabilidade — WACC regulatório real após impostos (% a.a.), prazo de recebimento da RAP (anos inteiros ≥ 1), e fatores de dedução da RAP bruta: PIS/COFINS (%), O&M (% da RAP) e IR/CSLL (%) — editável pelo usuário criando uma nova versão com data de início de vigência a cada alteração, sem jamais modificar ou excluir versões anteriores. A avaliação de viabilidade SHALL resolver a versão vigente pela data da oferta da revisão, garantindo que uma oferta reproduza seu parecer original mesmo após atualização dos parâmetros. A versão inicial (seed) SHALL ter vigência retroativa com o WACC regulatório de transmissão vigente (8,00% a.a. real após impostos, ANEEL, desde 01/03/2026), prazo de 30 anos e fatores de dedução registrados como hipótese a calibrar.

#### Scenario: Edição cria nova versão preservando o histórico

- **WHEN** o usuário altera o WACC de 8,00% para 7,50% com vigência a partir de 2027-03-01
- **THEN** o sistema cria uma nova versão dos parâmetros e mantém a versão anterior intacta e consultável para datas de referência anteriores a 2027-03-01

#### Scenario: Avaliação resolve a versão vigente pela data da oferta

- **WHEN** uma revisão com data da oferta 2026-09-01 é avaliada existindo versões com vigência 2026-01-01 (WACC 8,00%) e 2027-03-01 (WACC 7,50%)
- **THEN** a avaliação usa o WACC de 8,00% da versão vigente em 2026-09-01

#### Scenario: Validação dos parâmetros

- **WHEN** o usuário tenta gravar uma versão com WACC `0`, negativo ou não decimal, prazo `0` ou fator de dedução fora de 0 a 100%
- **THEN** o sistema rejeita a gravação com erro 400 e mensagem em português identificando o campo

### Requirement: Derivar anuidade, RAP mínima e deságio máximo suportado (RNF-08)

O sistema SHALL derivar, em aritmética decimal e termos reais (RAP constante descontada ao WACC real — sem projeção de inflação, decisão confirmada em 29/09/2026): a **anuidade do investimento** pelo fator de recuperação de capital `A = CAPEX × [i(1+i)^n] / [(1+i)^n − 1]` com `i` = WACC real após impostos e `n` = prazo de recebimento; a **RAP líquida mínima** igual à anuidade; a **RAP bruta mínima** revertendo os fatores de dedução `RAPmín = A ÷ [(1 − PIS/COFINS)(1 − O&M)(1 − IR/CSLL)]`; e o **deságio máximo suportado** `(1 − RAPmín ÷ RAPmáx do edital) × 100` com duas casas decimais, negativo quando a RAP mínima excede o teto (lote inviável no edital). O investimento base SHALL ser o informado pelo licitante na revisão quando presente, senão o CAPEX estimado ANEEL, com a origem identificada; sem ambos, ou sem RAP máxima, os derivados afetados SHALL ser "não informado" — nunca zero (RNF-09).

#### Scenario: Deságio máximo suportado calculado a partir do investimento do licitante

- **WHEN** o investimento do licitante é `4110000000.00`, o WACC real após impostos é `8,00% a.a.`, o prazo é `30` anos e os fatores de dedução são PIS/COFINS `9,25%`, O&M `10,00%` e IR/CSLL `10,00%`
- **THEN** o sistema deriva a anuidade `365080751.22`, a RAP bruta mínima `496657825.69` e, com RAP máxima `762630000.00`, o deságio máximo suportado `34.88`

#### Scenario: Investimento base recua ao CAPEX ANEEL com origem identificada

- **WHEN** a revisão não tem investimento do licitante informado mas tem CAPEX estimado ANEEL
- **THEN** a avaliação usa o CAPEX estimado ANEEL como investimento base e identifica a origem como estimativa do regulador

#### Scenario: RAP mínima acima do teto resulta em deságio máximo negativo

- **WHEN** a RAP bruta mínima derivada excede a RAP máxima do edital
- **THEN** o deságio máximo suportado é negativo e a avaliação sinaliza o lote como inviável nas condições do edital

#### Scenario: Ausência de entradas não vira zero

- **WHEN** a revisão não tem investimento do licitante nem CAPEX estimado ANEEL, ou não tem RAP máxima
- **THEN** os derivados afetados são "não informado" e o painel orienta quais entradas faltam, sem inventar valores (RNF-09)

### Requirement: Exibir o painel de viabilidade do lote no detalhe da oferta (RNF-14)

O sistema SHALL exibir, na aba de parâmetros do detalhe da oferta, o painel "Viabilidade do Lote (M13)" com: o investimento base e sua origem; a anuidade do investimento; a RAP bruta mínima; o deságio máximo suportado; o veredito frente à RAP máxima do edital e à RAP vencedora estimada da revisão (viável/inviável com a folga ou o excesso); a comparação com os deságios praticados do snapshot ANEEL (estatísticas do leilão correspondente quando houver e da base histórica completa); e os parâmetros vigentes usados com sua vigência. O campo do investimento do licitante SHALL ser editável na própria aba em revisão rascunho, com formato pt-BR e validação espelhando a API.

#### Scenario: Painel completo com oferta viável

- **WHEN** a revisão tem investimento base, RAP máxima e RAP vencedora estimada acima da RAP bruta mínima derivada
- **THEN** o painel exibe anuidade, RAP mínima, deságio máximo suportado, veredito de viabilidade com a folga percentual e a comparação com os deságios praticados, citando os parâmetros vigentes usados

#### Scenario: Deságio pretendido acima do máximo suportado é sinalizado

- **WHEN** o deságio derivado da RAP vencedora estimada excede o deságio máximo suportado
- **THEN** o painel destaca visualmente que a proposta pretendida não remunera o investimento nas premissas vigentes, sem impedir a gravação (parecer informativo)

#### Scenario: Comparação com deságios praticados do histórico

- **WHEN** o snapshot do histórico contém lotes do leilão referenciado pela revisão
- **THEN** o painel exibe o deságio máximo suportado lado a lado com o deságio mínimo, médio e máximo praticados no leilão e na base histórica completa
