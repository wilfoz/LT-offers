# QA — reavaliacao-base-catalogos

**Resultado: APROVADO** — change sem specs delta (`skip_specs: true`); QA enxuto de regressão: 6/6 verificações ao vivo do único comportamento novo e dos pontos refitados, suíte completa verde sem asserção pré-existente alterada.

## Ambiente

- Postgres: container `lt-offers-postgres` (Compose), porta 5432.
- API: `npx nx serve api`, porta 3000; web: `npx nx serve web`, porta 4200.
- Smoke: Playwright (Chromium) via `qa/smoke.mjs`; evidências em `qa/evidences/`.

## Verificações ao vivo (6/6 PASS)

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| Piloto: `/catalogs/conductor-cables/abc/edit` exibe "Identificador inválido" em vez de degradar para modo criação (comportamento novo da change) | PASSOU | `01-piloto-id-malformado.png` |
| Piloto: botão Salvar bloqueado com id malformado | PASSOU | `01-piloto-id-malformado.png` |
| Piloto: fluxo de criação intacto — decimal inválido rejeitado com a mesma mensagem | PASSOU | `02-piloto-criacao-validacao.png` |
| Refit tower-type: zero → mesma mensagem "número decimal positivo" (mapeamento not-positive→invalidDecimal preservado, recomendação da review 1-2) | PASSOU | `03-tower-type-zero-e-escala.png` |
| Refit tower-type: escala excedente → mesma mensagem "no máximo 2 casas decimais" | PASSOU | `03-tower-type-zero-e-escala.png` |
| Refit insulator: escala excedente → mesma mensagem "Use no máximo 2 casas decimais" | PASSOU | `04-insulator-escala.png` |

## Suítes (regressão)

- `npx nx run-many -t test lint build --skip-nx-cache`: verde — domain 7 (2 suítes, incl. `validation.spec.ts` novo), api 187 (16 suítes, +1 teste de busca do piloto), web 111 (19 suítes, +3 testes de guarda), calc-engine 11; builds ok.
- `npx nx format:check --all`: limpo. Sem BOM nos arquivos novos.
- Critério de refit verificado na review dos grupos 1-2: diff dos specs pré-existentes contém apenas fiação; as duas exceções (asserções de busca fortalecidas) eram objetivo declarado da change.

## Bugs e falsos negativos

- Nenhum bug de aplicação.
- 2 falsos negativos do script de smoke (corridas de render, mesmo padrão dos QAs anteriores): leitura de `innerText` antes de o `mat-error` renderizar — corrigidos com `waitFor` das mensagens específicas antes da leitura; e ausência de série no banco dev para o fluxo do tower-type — o script passou a criar a série de apoio via API (removida do banco ao final).

## Observações

- Dados de QA não persistem: a série de apoio "QA Reavaliação" foi removida ao final; o cabo "QA-REGRESSAO" nunca foi gravado (validação bloqueia o submit).
- Serviços de dev encerrados ao final (portas 3000/4200 liberadas).
