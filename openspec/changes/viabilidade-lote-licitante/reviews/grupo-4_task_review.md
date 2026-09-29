# Review do Grupo 4 — Seed, verificação e QA (tasks 4.1–4.3)

**Revisor**: AI Code Reviewer
**Data**: 2026-09-29
**Change / Grupo**: viabilidade-lote-licitante / grupo 4
**Status**: Aprovado com observações

## Resumo

O grupo 4 fecha a change com: (4.1) seed idempotente da versão inicial dos parâmetros de viabilidade em `prisma/seed.ts` (seção "1.y"), fiel ao design D6 — `effectiveFrom 2026-03-01` UTC, WACC `8.00`, prazo `30`, PIS/COFINS `9.25`, O&M `10.00`, IR/CSLL `10.00`, `createdBy` do seed, comentário citando a fonte do WACC (ANEEL, vigente 01/03/2026) e marcando os fatores como hipótese a calibrar (§02), sem tocar o `bidderCapex` da oferta-mestre; (4.2) verificação completa; (4.3) QA APROVADO 25/25 (14 E2E + 11 TI) com `qa/qa.md`, script Playwright arquivado em `qa/e2e-viabilidade.js` e 23 evidências em `qa/evidences/`.

Conferi cenário a cenário os dois specs da change contra o checklist do qa.md: os **10 cenários** do spec `viabilidade-lote-licitante` e o **1 cenário novo** do MODIFIED de `ofertas/cadastro-revisoes-linhas` têm verificação e evidência nomeada — cobertura completa, com extras além do spec (409 de vigência duplicada, 405 PUT/PATCH imutável, seed conferido via GET e psql, a11y, 375px). Os cenários pré-existentes do requirement MODIFIED ficaram em regressão pelas suítes completas — adequado, a change não os tocou. Amostragem de 8 evidências de TI bateu com o que o qa.md afirma, incluindo os valores canônicos idênticos nas três camadas. Arquivar o script E2E com a change é um avanço sobre a prática anterior de evidências soltas — recomendo adotar como padrão. Zero críticos e zero majors; apenas minors de reprodutibilidade do QA e cosméticos.

Verificação reproduzida por mim: `npx nx test domain --skip-nx-cache` (171/171 verdes), `npx nx format:check --all` com exit 0 (o `prisma/seed.ts` está no escopo do gate; `/openspec` é prettierignored), `npx prisma migrate status` em dia (17 migrations). Seed ao vivo (2× grava/mantém + psql) e suítes api/web evidenciados pelo aplicador e pelo qa.md.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| `prisma/seed.ts` (seção 1.y) | ✅ Ok | 1 minor (cosmético) |
| `openspec/changes/viabilidade-lote-licitante/qa/qa.md` (novo) | ✅ Ok | 0 |
| `openspec/changes/viabilidade-lote-licitante/qa/e2e-viabilidade.js` (novo) | ⚠️ Problemas | 3 minors |
| `openspec/changes/viabilidade-lote-licitante/qa/evidences/` (11 JSONs + 12 capturas) | ✅ Ok | 1 minor (nota) |
| `openspec/changes/viabilidade-lote-licitante/tasks.md` | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

**MIN-1 — Fluxos de TI não arquivados como script** (`qa/`)

O E2E foi arquivado como script reprodutível, mas os 11 TIs (criação das ofertas de apoio `QA-M13-*`, POSTs de versões, 400/405/409, round-trip do `bidderCapex`) só existem como *outputs* JSON em `evidences/` — os comandos que os geraram não foram preservados. O próprio cabeçalho do E2E declara a dependência ("Pré-requisitos: ... ofertas QA-M13-* criadas pelos TI"), então metade da reprodução do QA está indocumentada. Sugestão: nas próximas changes, arquivar também o script de TI (ou uma seção "comandos executados" no qa.md) ao lado do E2E.

**MIN-2 — Script E2E não é re-executável sem ajuste** (`qa/e2e-viabilidade.js:248,264`)

E2E-10/11 postam vigência fixa `2027-06-01`: numa 2ª execução o POST responde 409 (vigência duplicada — comportamento correto da API) e E2E-11 falha como falso negativo. Os ids de oferta também são fixos (29–32, estado atual do banco de dev). Aceitável para um artefato de QA pontual, mas vale uma linha no cabeçalho avisando ("execução única por banco; re-execução exige nova vigência/ids") ou derivar a vigência dinamicamente (ex.: `anoCorrente + 2`).

**MIN-3 — Asserção fraca no E2E-8** (`qa/e2e-viabilidade.js:209`)

`text.includes('13')` (contagem de lotes do leilão 001/2022) casa com qualquer substring — "413", "2013", um valor monetário — e passaria por acidente. As demais asserções da lista ('5,00%', '41,31%', '60,00%') são razoáveis; para a contagem, ancorar no contexto (`/13 lotes/` ou um `data-testid` da linha de estatística).

**MIN-4 — Numeração de seção "1.y" no seed** (`prisma/seed.ts:1265`)

A seção nova segue o placeholder "1.x" do histórico de leilões em vez de número real — e o arquivo já tinha duas seções "1.11" (linhas 909 e 1108, pré-existente de change anterior). Cosmético e coerente com o vizinho; numa manutenção futura do seed, renumerar as seções de uma vez.

**Nota (não conta como problema)** — as evidências JSON têm BOM UTF-8 e formatação `ConvertTo-Json` do PowerShell (espaçamento largo, `&` como `&` em `ti4-validacao-400.json`). Inócuo: são artefatos de evidência, não fonte, e `/openspec` está no `.prettierignore` — o gate de formatação não as vê. Registro só para leitores futuros não estranharem.

## ✅ Destaques Positivos

1. **Data UTC explícita para `@db.Date` — armadilha BRT evitada por construção**: `new Date('2026-03-01T00:00:00.000Z')` é meia-noite UTC explícita, imune à janela 21h–24h BRT que já produziu dia errado com `new Date()` implícito (achado recorrente das reviews). Round-trip confirmado: `ti1-parametros-vigentes-seed.json` devolve `"effectiveFrom": "2026-03-01"` exato via GET.
2. **Idempotência no padrão da casa, sem risco novo**: `count() === 0` segue à letra o D6 desta change ("padrão dos demais singletons") e o precedente do histórico de leilões (seção 1.x, mesma estrutura if/else com mensagens gêmeas). É deliberadamente mais conservador que um `upsert` — nunca toca histórico existente, coerente com a imutabilidade RNF-05 — e o `@unique` em `effective_from` cobre até corrida (P2002 em vez de duplicata). O único estado em que o baseline não seria gravado (versões criadas via UI antes de o seed jamais rodar) é artificial e a resposta do seed (preservar o que existe) é a correta.
3. **Cobertura 11/11 dos cenários dos specs**, conferida cenário a cenário: parâmetros versionados (3/3 por TI), derivações (4/4 por TU+TI+E2E), painel (3/3 por E2E) e o MODIFIED de ofertas (TI-11/11b + E2E-2/E2E-5) — cada linha do checklist com evidência nomeada e verificável.
4. **Valores canônicos idênticos fim a fim**: anuidade `365080751.22`, RAP mínima `496657825.69`, deságio `34.88` conferidos na domain (TU), na API (`ti7-assessment-mestre-canonico.json`, com origem `ANEEL_ESTIMATE` provando que o seed não tocou o `bidderCapex` da oferta-mestre) e na interface (E2E-1/E2E-2 em pt-BR `34,88%`); teto insuficiente `-24.16` (ti8) e ausência de entradas com derivados `null` + `missingInputs` sem inventar zero (ti9, RNF-09).
5. **Script E2E arquivado com a change** — mudança de prática bem-vinda: cenários numerados mapeados aos requisitos (V5, O1/V4...), screenshot automático de falha, exit code para CI, e as lições institucionais aplicadas (espera do `detached` do snackbar contra corrida de render, restauração da oferta-mestre ao estado original no E2E-5, tolerância de viewport no teste de overflow).
6. **TI-4 valida o pacote completo de validação**: 6 mensagens pt-BR (uma por campo) numa única resposta 400 e a data civil `2028-02-30` rejeitada por round-trip — exatamente a lição da armadilha de rollover silencioso registrada desde o piloto.
7. **ti6 comprova PUT E PATCH em 405** separadamente — a armadilha NestJS de decoradores empilhados (só o mais externo vale) não reincidiu.

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ✅ Ok |
| Typescript/Node.js | ✅ Ok |
| Angular/NestJS/React | ✅ Ok (nada tocado neste grupo) |
| REST/HTTP | ✅ Ok (evidências: 400/405/409 corretos) |
| Testes | ✅ Ok (domain 171 reproduzido; api 320/web 393 evidenciados) |
| Logging/Monitoramento | ✅ Ok (logs do seed em pt-BR, informativos) |

## Recomendações

1. (MIN-1) A partir da próxima change, arquivar também os fluxos de TI como script (ou lista de comandos no qa.md) junto do E2E — consolidar o precedente bom que este grupo iniciou.
2. (MIN-2) Adicionar uma linha no cabeçalho de `e2e-viabilidade.js` avisando que a execução é única por banco (vigências fixas → 409 na re-execução; ids de oferta do banco de dev).
3. (MIN-3) Trocar `text.includes('13')` do E2E-8 por asserção ancorada (regex com contexto ou testid) se o script for reutilizado.
4. (MIN-4) Renumerar as seções do seed (1.x/1.y e o "1.11" duplicado pré-existente) numa manutenção futura — sem urgência.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero problemas críticos ou major. O seed é fiel ao design D6 (valores, fonte, hipótese declarada, idempotência conservadora, data UTC correta para `@db.Date`), a verificação da task 4.2 foi reproduzida nesta review (domain skip-cache, format:check --all exit 0, migrate status em dia) e o QA cobre todos os 11 cenários dos specs da change com evidências consistentes na amostragem. Os quatro minors são de reprodutibilidade/cosmética dos artefatos de QA e não bloqueiam nada. Próximos passos: commitar o grupo 4, opcionalmente incorporar a recomendação 2 (uma linha de comentário) antes do commit, e seguir para `/opsx:archive` com sync dos specs.


## Resolução (pós-review)

- **MIN-1** — seção "Reprodução dos TI" adicionada ao qa.md com as 10 chamadas HTTP (método, rota, payload) que geraram cada evidência JSON.
- **MIN-2** — cabeçalho do `e2e-viabilidade.js` agora avisa que o script assume banco recém-semeado (ids 29–32 e vigência 2027-06-01 fixos; 2ª rodada gera 409 no E2E-11).
- **MIN-3** — asserção do E2E-8 endurecida de `'13'` para `'(13 lote(s))'`.
- **MIN-4** (numeração das seções do seed) — sem ação; cosmético e pré-existente, renumerar em manutenção futura.