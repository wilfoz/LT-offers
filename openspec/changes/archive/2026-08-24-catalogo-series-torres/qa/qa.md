# QA — catalogo-series-torres

**Resultado: APROVADO** — 19/19 cenários do spec verificados como PASSOU, mais smoke E2E dos 3 catálogos de cabos, acessibilidade e responsividade. Nenhum bug de aplicação encontrado; os 5 FAIL da primeira execução E2E eram defeitos do próprio script de QA (corridas de renderização, literal decimal e premissa de ordem de foco), corrigidos em `e2e-revalidacao.mjs` e revalidados 5/5.

## Ambiente

- Postgres: container `lt-offers-postgres` do Compose (porta 5432), migrations em dia (`prisma migrate status`).
- API: `npx nx serve api` na porta **3000**; Web: `npx nx serve web` na porta **4200** (proxy `/api`→3000). Ambos encerrados ao fim do QA; dados de teste (`QA Série 500/230` e tipos) removidos das tabelas do catálogo novo.
- Navegador: Playwright/Chromium headless (scripts `qa/e2e.mjs` e `qa/e2e-revalidacao.mjs`); evidências em `qa/evidences/`.
- Data da execução: 24/08/2026 ("hoje" civil = vigência default das primeiras versões).

## Checklist por cenário (spec `catalogos/series-torres`)

### Manter séries de estrutura

| # | Cenário | Tipo | Resultado | Evidência |
|---|---------|------|-----------|-----------|
| 1 | Criação com dados válidos | E2E | PASSOU | `03-lista-series-pendencia-sil.png` |
| 2 | Nome duplicado é rejeitado | E2E | PASSOU | `04-serie-nome-duplicado-409.png` |
| 3 | Valores numéricos inválidos são rejeitados | E2E + TU | PASSOU | `02-serie-form-valores-invalidos.png` (mensagens pt-BR por campo) |

### Manter tipos de torre de uma série

| # | Cenário | Tipo | Resultado | Evidência |
|---|---------|------|-----------|-----------|
| 4 | Criação de tipo de torre com dados válidos | E2E | PASSOU | `07-tipo-form-preenchido.png`, `08-detalhe-serie-tipo-completo.png` |
| 5 | Sigla duplicada na mesma série é rejeitada | E2E | PASSOU | `12-tipo-sigla-duplicada-409.png` |
| 6 | Mesma sigla em séries diferentes é aceita | TI | PASSOU | POST `QA-SA1` na 2ª série → HTTP 201 (log da execução) |
| 7 | Troca de função é rejeitada | TI + E2E | PASSOU | POST version com `function` → HTTP 400 pt-BR; form de edição exibe função fixa (`13-tipo-form-edicao-funcao-fixa.png`) |
| 8 | Tipo de torre em série inexistente é rejeitado | TI | PASSOU | POST em série 999 → HTTP 404 "Série de estrutura não encontrada" |

### Manter tabela peso por altura

| # | Cenário | Tipo | Resultado | Evidência |
|---|---------|------|-----------|-----------|
| 9 | Registro de pontos peso × altura | E2E | PASSOU | `08-…` (resumo "2 alturas (24–30 m)" ordenado) |
| 10 | Altura repetida na mesma versão é rejeitada | E2E | PASSOU | `10-tipo-form-altura-duplicada.png` (24 ≡ 24.000 antes do submit) |
| 11 | Ponto com valor inválido é rejeitado | E2E | PASSOU | `09-tipo-form-ponto-invalido.png` (zero e escala > 2 casas, erro por linha) |
| 12 | Versão anterior preserva a tabela da época | E2E | PASSOU | `14-historico-tipo-duas-versoes.png` |

### Listar e buscar / listar tipos

| # | Cenário | Tipo | Resultado | Evidência |
|---|---------|------|-----------|-----------|
| 13 | Busca por nome | E2E | PASSOU | `21-revalida-busca-nome.png` (só "QA Série 500" após filtrar) |
| 14 | Listagem de tipos da série | E2E | PASSOU | `08-…`, `11-detalhe-serie-tipo-pendente.png` |

### Sinalizar registros incompletos

| # | Cenário | Tipo | Resultado | Evidência |
|---|---------|------|-----------|-----------|
| 15 | Série sem SIL aparece sinalizada | E2E | PASSOU | `03-…` ("Pendente: SIL (MW)") |
| 16 | Tipo com zero estais não é pendência | E2E | PASSOU | `08-…` (estais 0 + "Completo", RNF-09) |
| 17 | Tipo sem pontos de peso aparece sinalizado | E2E | PASSOU | `11-…` ("Pendente: quantidade de estais, tabela peso × altura") |

### Histórico de versões por nível

| # | Cenário | Tipo | Resultado | Evidência |
|---|---------|------|-----------|-----------|
| 18 | Histórico da série após edição | E2E | PASSOU | `15-historico-serie-duas-versoes.png` (vigências 24/08 e 01/09, autor) |
| 19 | Histórico do tipo com tabela por época | E2E | PASSOU | `14-…` (v1: 24→5200.5, 30→6400; v2: 24→5300, 30→6400, 33→7000) |

### Smoke dos catálogos existentes (regressão da change)

| Catálogo | Resultado | Evidência |
|----------|-----------|-----------|
| Cabos condutores | PASSOU | `18-smoke-conductor-cables.png` |
| Cabos de guarda | PASSOU | `19-smoke-ground-wires.png` |
| Cabos de tirante | PASSOU | `20-smoke-guy-wires.png` |

## Testes de unidade e integração

- `npx nx run-many -t lint test build` (comando canônico do CI): **verde** — api 160 testes (14 suítes), web 83 (16 arquivos), calc-engine 11, domain 1; builds api e web ok.
- `npx nx format:check` completo: **limpo**.
- Não há meta de cobertura definida no projeto; registro dispensado.

## Acessibilidade (telas novas)

- Navegação por teclado: Tab percorre cabeçalho → busca → ações; campo Nome do form alcançável via Tab (verificação programática na revalidação). Formulários submetem com Enter.
- Rótulos: checagem programática no form de tipo de torre (o mais complexo, com FormArray) — **todos** os `input`/`select` têm `label[for]` associado, inclusive as linhas dinâmicas (`heightM-i`/`weightKg-i`).
- Mensagens de erro: pt-BR, por campo/linha, com `role="alert"`; busca com `role="search"`; tabelas com `caption` e `th scope`.
- Contraste: pendências `#b45309` e erros `#b91c1c` sobre fundo branco (≥ 4.5:1); fontes no tamanho padrão do navegador.
- Imagens: não há imagens de conteúdo nas telas novas (nada exigindo `alt`).

## Visual e responsividade

- Estados capturados: vazio (`01`, `06`), com dados (`03`, `08`), erro de validação (`02`, `09`, `10`) e conflito do servidor (`04`, `12`).
- Breakpoints: desktop 1280px (todas as evidências) e móvel 375px (`16-responsivo-375-lista-series.png`, `17-responsivo-375-tipo-form.png`). A tabela da listagem exige rolagem horizontal em 375px — mesmo comportamento dos catálogos de cabos existentes, sem quebra de layout; registrado como observação, não defeito.

## Bugs

Nenhum bug de aplicação. Defeitos encontrados e corrigidos **no próprio script de QA** (primeira execução, 5 FAIL): (1–3) leituras de DOM sem aguardar renderização (form de série, busca, form de tipo) — as evidências `02`/`05`/`09` provam o app correto; (4) asserção esperava `5200.50`, mas o contrato Decimal→string emite `5200.5` (comportamento correto, mesmo dos demais catálogos); (5) asserção esperava o 1º Tab no campo Nome, mas a ordem correta de foco começa no menu do cabeçalho. Revalidação em `e2e-revalidacao.mjs`: 5/5 PASSOU.

## Observações

- O prefixo `weights.0.` nas mensagens 400 aninhadas da API não chega ao usuário: a validação por linha do form bloqueia o submit antes (condição do MIN-3 da review dos grupos 2-3-4 confirmada em execução real).
- Dados de QA removidos ao final; sequências de id do catálogo novo avançadas (sem efeito funcional).
