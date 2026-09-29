## Why

O sistema hoje calcula o custo EPC e expõe o benchmark de deságios praticados (change `historico-leiloes-aneel`), mas não responde à pergunta central do licitante antes da sessão: **qual a RAP mínima que remunera o investimento no lote e, portanto, qual o deságio máximo suportável sobre a RAP do edital?** O usuário faz essa conta fora do sistema, sem rastreabilidade das premissas.

Esta change cria o módulo M13 (visão do licitante, decisão de escopo do usuário em 27/09/2026): a partir do investimento total estimado para o lote e de parâmetros regulatório-financeiros versionados por vigência (WACC regulatório real após impostos — 8,00% a.a. vigente desde 01/03/2026 —, prazo de recebimento da RAP e fatores de dedução tributária/O&M), deriva a anuidade do investimento, a RAP bruta mínima e o **deságio máximo suportado**, exibidos no detalhe da oferta lado a lado com o deságio derivado da própria oferta (change `identidade-leilao-e-prazos`) e com os deságios praticados do snapshot ANEEL (change `historico-leiloes-aneel`). Todas as quatro hipóteses de modelagem foram confirmadas pelo usuário em 29/09/2026: termos reais com WACC como taxa única de desconto (sem dívida explícita), investimento base informado pelo licitante (referenciado pela estimativa ANEEL) e fatores tributários configuráveis tratados como hipótese.

**Requisitos cobertos**: módulo novo M13 (sem RF no levantamento original — extensão de escopo acordada); RNF-04, RNF-05 (parâmetros versionados), RNF-08, RNF-09, RNF-14. **Fase do roadmap**: ordem acordada A → B → **D** → C.

## What Changes

- **Parâmetros de viabilidade versionados por vigência** (padrão singleton dos parâmetros de chuva/calendário — RNF-05): WACC regulatório real após impostos (% a.a.), prazo de recebimento da RAP em anos, e fatores de dedução da RAP bruta — PIS/COFINS (%), O&M (% da RAP) e IR/CSLL (%) — editáveis pelo usuário, com versão inicial (seed) retroativa citando a fonte do WACC 2026 e marcando os fatores tributários como **hipótese a calibrar** (política do §02).
- **Investimento do licitante na revisão**: campo novo anulável `bidderCapex` (investimento total estimado pelo licitante para o lote, linhas + subestações), aceito no cadastro/edição da revisão. A análise usa `bidderCapex` quando informado e recua para o CAPEX estimado ANEEL da revisão indicando a origem; sem ambos, a viabilidade é "não informado" — nunca zero (RNF-09).
- **Derivações puras de viabilidade na domain** (termos reais, decimal.js): anuidade do investimento ao WACC pelo fator de recuperação de capital, RAP líquida mínima = anuidade, RAP bruta mínima revertendo os fatores de dedução, deságio máximo suportado = `(1 − RAP bruta mínima ÷ RAP máxima do edital) × 100` (negativo = lote inviável mesmo no teto).
- **API de avaliação**: contexto novo `viability` com o catálogo de parâmetros (GET vigente por data de referência / POST nova versão / PUT-PATCH 405) e `GET /viability/assessment` que resolve revisão, parâmetros vigentes pela data da oferta e estatísticas de deságio do snapshot local, devolvendo o parecer completo.
- **Painel "Viabilidade do Lote (M13)"** na aba de parâmetros do detalhe da oferta: investimento base com origem, anuidade, RAP bruta mínima, deságio máximo suportado, veredito frente à RAP máxima e à RAP vencedora estimada, e comparação com os deságios praticados (leilão e base histórica). Campo do investimento do licitante editável na própria aba (rascunho).
- **Tela "Parâmetros de viabilidade"** no grupo de catálogos do menu (padrão da tela de parâmetros de chuva): versão vigente, edição criando nova versão, histórico imutável.
- **README**: termos novos no mapa canônico.

Não há mudança **BREAKING**: tabelas, campo anulável e telas novas; contratos existentes preservados (campos adicionados).

## Capabilities

### New Capabilities

- `viabilidade-lote-licitante`: parâmetros de viabilidade versionados por vigência, derivação da anuidade/RAP mínima/deságio máximo suportado em termos reais ao WACC regulatório, e painel de viabilidade do lote no detalhe da oferta comparado aos deságios praticados.

### Modified Capabilities

- `ofertas/cadastro-revisoes-linhas`: o cadastro da oferta passa a aceitar o investimento total estimado pelo licitante (`bidderCapex`, decimal monetário ≥ 0, anulável) nos mesmos moldes dos demais campos financeiros da revisão.

## Impact

- **Banco/Prisma**: `prisma/schema.prisma` — modelo `ViabilityParameterVersion` (singleton versionado) e coluna anulável `bidder_capex` em `offer_revision`; uma migration aditiva.
- **Domain (`libs/domain`)**: `viability/viability.ts` (contratos) e `viability/viability-derivations.ts` (funções puras com testes); campo `bidderCapex` nos contratos de oferta.
- **API**: contexto novo `apps/api/src/contexts/viability` (hexagonal: repositório Prisma dos parâmetros, porta própria de estatísticas lendo o snapshot `auction_result` — sem acoplar módulos —, use cases, controller, DTOs, DI no `context-modules-di.spec.ts`); contexto `offers` ganha `bidderCapex` (entidade, DTOs, mapper, repositórios, presenter — mesmo trilho da change `identidade-leilao-e-prazos`).
- **Web**: painel novo na aba de parâmetros do `offer-detail` + campo do investimento; tela nova de parâmetros de viabilidade; item novo no menu da casca (app.spec asserta a lista exata — atualizar para 17).
- **Seed**: versão inicial dos parâmetros com vigência retroativa (WACC real após impostos 8,00% a.a. — ANEEL, vigente 01/03/2026; prazo 30 anos; PIS/COFINS 9,25%, O&M 10,00%, IR/CSLL 10,00% — fatores marcados como hipótese na nota); `bidderCapex` da oferta-mestre permanece não informado (análise recua ao CAPEX ANEEL, exercitando a origem).
- **Dependências**: nenhuma nova. Não toca a trilha de auditoria por porta (a extração da porta fina — regra das três disparada na change B — fica para a próxima change que tocar auditoria).
- **Documentação**: README (mapa canônico).
