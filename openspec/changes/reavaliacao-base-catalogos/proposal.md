# Proposta: reavaliacao-base-catalogos

## Why

A reavaliação da base extraída de catálogos, prometida nos designs de catalogo-cabos-tirante e catalogo-series-torres para depois do 5º catálogo, está devida: com o catálogo de isoladores entregue, a regra das três ocorrências estourou na validação de "decimal com escala limitada à precisão da coluna" — **quatro implementações paralelas** (API: `PositiveNonZeroDecimal` em `tower-weight-point.dto.ts` e `DecimalWithScale` em `insulator-version-fields.dto.ts`; web: `weightValueValidator` em `tower-type-form.component.ts` e `decimalWithScale` em `insulator-form.component.ts`), registradas como atrito na review do grupo 4 de catalogo-isoladores. A varredura desta reavaliação também encontrou dívidas de teste e um retrofit nunca feito no piloto (detalhes em What Changes); dois minors coletivos registrados anteriormente já haviam sido quitados em changes intermediárias (`mat-progress-bar` presente nos 6 históricos; `@angular/cdk`/`material` já pinados em 22.1.3) e saem da lista.

## What Changes

- **Extração (regra das três ocorrências, sem mudança de comportamento observável):** predicado puro de "decimal com escala" em `libs/domain` (zero permitido ou proibido por opção), consumido pelos 2 validators da API e pelos 2 validator functions do web — as 4 cópias somem; mensagens pt-BR continuam em cada borda (RNF-14).
- **Retrofit do piloto (única mudança de comportamento visível):** `conductor-cable-form` com id de rota malformado (ex.: `/catalogs/conductor-cables/abc/edit`) hoje **degrada para modo criação** — o bug corrigido em todos os catálogos posteriores (lição do grupo 4 de catalogo-cabos-guarda-opgw) nunca foi retrofitado no piloto. Passa a se comportar como os demais 5 forms: mensagem "Identificador inválido" com formulário desabilitado. Alinhamento de tratamento de erro; nenhum requisito de spec muda.
- **Dívidas de teste quitadas (test-only):** guarda de id malformado dos históricos de `conductor-cable` e `ground-wire` (existe no código, nunca testada — aberto desde a review do grupo 5 de catalogo-cabos-tirante); asserção fraca do termo de busca (`where.OR` só `toBeDefined`) fortalecida nos service specs antigos da API para assertar o termo repassado, como o padrão estabelecido em insulators (reincidência registrada nas reviews de series-torres e cabos-tirante).
- **Registro dos limites NÃO extraídos** (no design, sem código): `missingFields` sem suporte a coleções e `VersionedCatalogApi` de URL fixa têm 1 ocorrência divergente cada (series-torres) — seguem aguardando mais casos, conforme a própria regra das três ocorrências.
- **Fora do escopo:** MIN-2 coletivo (rota de edição/detalhe com id malformado renderiza a casca do modo criação — cosmético, decisão do usuário de deixar de fora); componentes Angular/controllers genéricos e tabela única (Non-Goals reafirmados das extrações anteriores); catálogos novos (`DB_FUN` etc.).

Fase do roadmap: **F1 (M02, consolidação)**. Requisitos tocados (sem mudança de requisito): RNF-08 (precisão decimal — a validação de escala protege contra arredondamento silencioso), RNF-09, RNF-14; RF-07/RF-08 apenas como código refitado.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

Nenhuma — refactor interno, testes e alinhamento de tratamento de erro; nenhum requisito dos specs `catalogos/*` muda (a change declara `skip_specs: true`).

## Impact

- **Código:**
  - `libs/domain/src/lib/catalogs/validation.ts`: predicado de escala novo (função pura, sem dependência de class-validator/Angular).
  - API: `dto/tower-weight-point.dto.ts` e `dto/insulator-version-fields.dto.ts` refitados para consumir a domain (validators viram cascas finas).
  - Web: `tower-type-form.component.ts`, `insulator-form.component.ts` refitados; `conductor-cable-form.component.ts` ganha a guarda de id malformado.
  - Specs de teste: novos testes em `conductor-cable-form/-history` e `ground-wire-history` (web); asserções do termo de busca fortalecidas nos service specs da API (`conductor-cables`, `ground-wires`, `guy-wires`, `structure-series`, `tower-types` onde aplicável).
- **API observável:** nenhuma mudança (mesmas rotas, status e mensagens).
- **UI observável:** apenas o form do piloto com id malformado (erro em vez de modo criação) — alinhado aos demais catálogos.
- **Critério de refit (mesmo das extrações anteriores):** nenhuma asserção de teste pré-existente muda, exceto as explicitamente FORTALECIDAS (termo de busca) — troca de asserção fraca por forte é o objetivo declarado, não efeito colateral.
- **Nomenclatura/configuração/dependências:** nenhuma nova.
