# Review do Grupo 4 — Interface de manutenção (tasks 4.1–4.3)

**Revisor**: AI Code Reviewer
**Data**: 2026-08-24
**Change / Grupo**: catalogo-isoladores / grupo 4
**Status**: Aprovado com observações

## Resumo

O grupo entrega a interface de manutenção do 5º catálogo (`DB_AIS`): `InsulatorsApi` estendendo `VersionedCatalogApi` sem nenhum override (~20 linhas, como `GuyWiresApi`), três componentes (`insulator-list/-form/-history`) na receita Swiss com molde nos componentes guy-wire, 4 rotas em `catalogs.routes.ts`, item "Isoladores" no menu da casca e 16 testes de componente novos. A suíte web/domain está verde (108 testes, 19 suites), `npx nx format:check --all` limpo, sem BOM em nenhum arquivo novo e as proibições do `openspec/DESIGN.md` (`::ng-deep`, `.mdc-*`, hex literal, `100vh`, `role="status"` como badge) verificadas por grep — todas limpas.

Zero problemas críticos e zero majors — 3ª entrega de UI de catálogo consecutiva sem major. Todas as lições institucionais das reviews anteriores vieram aplicadas E testadas de primeira, incluindo duas que eram lacunas históricas: o teste do termo de busca asserta o TERMO exato repassado (`toHaveBeenLastCalledWith('ISO-V')` — a asserção fraca reincidente morreu aqui) e o teste do snackbar asserta `router.navigate` (primeira vez na suíte). A alteração em `app.spec.ts` (4→5 itens de navegação) é comportamento novo legítimo da task 4.1; as demais asserções da casca estão intactas.

Os minors são registros para a reavaliação pós-5º catálogo (atrito da base extraída, que o design D3/Risks pede para registrar) — nenhum exige correção antes do commit.

## Arquivos Revisados

| Arquivo | Status | Problemas |
|---------|--------|-----------|
| apps/web/src/app/catalogs/insulators-api.service.ts | ✅ Ok | 0 |
| apps/web/src/app/catalogs/insulator-list.component.ts | ✅ Ok | 0 |
| apps/web/src/app/catalogs/insulator-form.component.ts | ⚠️ Problemas | 2 (minors) |
| apps/web/src/app/catalogs/insulator-history.component.ts | ✅ Ok | 0 |
| apps/web/src/app/catalogs/insulator-list.component.spec.ts | ✅ Ok | 0 |
| apps/web/src/app/catalogs/insulator-form.component.spec.ts | ✅ Ok | 0 |
| apps/web/src/app/catalogs/insulator-history.component.spec.ts | ✅ Ok | 0 |
| apps/web/src/app/catalogs/catalogs.routes.ts | ✅ Ok | 0 |
| apps/web/src/app/app.ts | ✅ Ok | 0 |
| apps/web/src/app/app.spec.ts | ✅ Ok | 0 |

## Problemas Encontrados

### ⛔ Problemas Críticos

Nenhum problema crítico encontrado.

### 🟡 Problemas Major

Nenhum problema major encontrado.

### 🟢 Problemas Minor

1. **[REGISTRO DE ATRITO DA BASE — insumo da reavaliação pós-5º catálogo] Validador "pattern + escala ≤ N" chegou à 4ª implementação paralela.** `decimalWithScale` em `insulator-form.component.ts:26-38` é a 2ª cópia no web da checagem de escala (a 1ª é `weightValueValidator` em `tower-type-form.component.ts:38-49`, que difere apenas por exigir `> 0`); na API existem `DecimalWithScale` (`dto/insulator-version-fields.dto.ts:17-27`) e `PositiveNonZeroDecimal` (`dto/tower-weight-point.dto.ts:15-16`). A base extraída (`libs/domain/catalogs/validation.ts`) fornece só os patterns, sem noção de escala — e a lição P2002/arredondamento silencioso de series-torres tornou a escala obrigatória em todo decimal novo. A regra das três ocorrências já foi ultrapassada considerando as duas bordas. Sugestão para a reavaliação: helper de escala na domain (ex.: `hasMaxScale(value, maxScale)`) consumido pelos 4 pontos, mantendo mensagens na borda. **Não corrigir nesta change** (Non-Goal explícito do design: registrar sem generalizar).

2. **Escala declarada em dois lugares no formulário — sincronia manual com o schema.** Em `insulator-form.component.ts`, a escala de cada campo aparece no literal do validator (`decimalWithScale(2)` etc., linhas 289-304) E no record `DECIMAL_SCALES` usado só pela mensagem (linhas 41-46). Se uma migration mudar a precisão de uma coluna, são dois pontos a atualizar (três, com o DTO da API). Fix barato: derivar o validator do record — `decimalWithScale(DECIMAL_SCALES.ruptureStrengthKn)`. De quebra, apertar a tipagem `Record<string, number>` para as chaves reais (`Record<'ruptureStrengthKn' | 'diameterMm' | 'spacingMm' | 'creepageDistanceMm', number>`) — precedente do minor de tipagem frouxa de `REQUIRED_BY_TYPE` (ground-wires); hoje `errorFor` indexa o record com qualquer chave do form e produziria "no máximo undefined casas" num estado teoricamente inalcançável.

3. **[Herdado, já registrado como MIN-2 nas changes anteriores] Rota de edição com id malformado renderiza a casca do modo criação.** `/catalogs/insulators/abc/edit` mostra "Novo isolador" no `h2` (o `editId` fica null) com o form desabilitado e "Identificador inválido" — comportamento idêntico aos 3 catálogos de cabos, coberto por teste (`rejeita identificador malformado na rota sem degradar para criação`), sem risco funcional (o `save()` retorna cedo com o form desabilitado). Cosmético, tratar junto com os demais catálogos se um dia incomodar.

## ✅ Destaques Positivos

- **Base extraída fechou o ciclo dos 5 catálogos no front**: `InsulatorsApi` tem 20 linhas e zero override — o critério de sucesso do design D3 ("guy-wires com outros campos") valeu também para a UI. Nenhum helper precisou de adaptação.
- **Duas lacunas históricas da suíte fechadas neste grupo**: (1) o teste do termo de busca asserta o termo exato (`expect(apiMock.list).toHaveBeenLastCalledWith('ISO-V')`) — a asserção fraca era reincidente desde o grupo-5 de cabos-tirante; (2) o teste de snackbar asserta `navigateSpy` com a rota de destino — navegação pós-save nunca tinha sido assertada em nenhum catálogo.
- **Lição da poda de specs derivados verificada**: paridade 1:1 com o molde guy-wire (listagem 4=4 testes, histórico 3=3; formulário 9 vs 8 — trocou o teste de inteiro pelo par decimal malformado + escala excedente). Nada do que o molde cobria se perdeu.
- **Validação de escala espelhando o schema com teste dedicado**: web 2/3 casas = `Decimal(12,2)`/`Decimal(10,3)` = DTO da API (`insulator-version-fields.dto.ts`), com o teste "rejeita casas decimais além da precisão da coluna apontando o limite" assertando a mensagem "Use no máximo 2 casas decimais". Zero permitido de propósito (comentário cita o spec: só negativo/não numérico são rejeitados — coerente com null ≠ zero, RNF-09).
- **`mat-progress-bar` no histórico** — o minor pendente das 5 histories do design-system aqui já nasce resolvido, como o design D3 pedia.
- **Todo o checklist institucional coberto por teste**: callback de erro nas 3 leituras (com asserção de que a falha NÃO vira "Nenhum isolador encontrado"), prefill bloqueante incluindo `NEVER` e falha de rede, guarda `if (this.form.disabled) return` no `save()` com comentário justificando (versão toda nula), botão `[disabled]="saving() || form.disabled"`, id malformado no form E no history (a lacuna do history apontada no grupo-5 de cabos-tirante aqui está testada, incluindo `apiMock.history).not.toHaveBeenCalled()`), payload null/decimais-string via `orNull`, vigência `dd/MM/yyyy` com `'UTC'` e `createdAt` local — com o comentário do teste explicando o porquê ("não pode regredir um dia no fuso local").
- **Higiene de entrega**: sem BOM (verificado `head -c3 | od` nos 7 arquivos), `format:check --all` limpo, proibições do DESIGN.md limpas por grep, item de menu em ordem alfabética pt-BR, `.num`/`.mono`/`.badge`/`.table-scroll`/`.empty-state` reusados dos utilitários globais (nada por componente).

## Conformidade com Padrões

| Padrão | Status |
|-------|--------|
| Padrões de Código | ✅ Ok |
| Typescript/Node.js | ✅ Ok |
| Angular/NestJS/React | ✅ Ok |
| REST/HTTP | ✅ Ok (consumo via `VersionedCatalogApi`, sem novidade) |
| Testes | ✅ Ok (16 novos, 108/108 verdes) |
| Logging/Monitoramento | ✅ Ok (erros de leitura/escrita tratados e exibidos ao usuário) |

## Recomendações

1. (Antes do commit — nada.) O grupo está pronto para commit como está; staging explícito por caminho, nunca `git add -A`.
2. (Reavaliação pós-5º catálogo) Levar o minor 1 como insumo formal: helper de escala decimal na domain para desduplicar as 4 implementações de "pattern + escala".
3. (Oportunista, se o arquivo for tocado de novo) Minor 2: derivar `decimalWithScale(...)` de `DECIMAL_SCALES` e apertar a tipagem do record.
4. (Backlog comum aos catálogos) Minor 3 permanece como MIN-2 coletivo; não abrir frente só para isoladores.
5. (Grupo 5) No QA, exercitar o fluxo de escala excedente no navegador (digitar `120.505` em carga de ruptura) — é o único comportamento de UI que os outros catálogos não têm.

## Veredito

**APROVADO COM OBSERVAÇÕES.** Zero críticos, zero majors; os três minors são registro de atrito da base (não corrigir aqui, por decisão de design), melhoria oportunista e dívida cosmética herdada. O grupo 4 pode ser commitado como está. A entrega é a mais limpa das UIs de catálogo até aqui: além de aplicar todas as lições institucionais, fechou duas lacunas históricas de teste (asserção do termo de busca e do `router.navigate` pós-save). Próximos passos: commit do grupo 4 e seguir para o grupo 5 (QA via `/executar-qa` + suíte completa + CI).
