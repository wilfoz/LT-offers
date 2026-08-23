# Design: convencao-codigo-ingles

## Context

Ver `proposal.md — Why`. O código atual (piloto de cabos condutores, libs `dominio` e `motor-calculo`) usa identificadores em pt-BR por convenção anterior. Esta change fixa a convenção definitiva e renomeia o existente. Restrições: zero mudança de comportamento observável; os testes existentes (53) e o script E2E do QA são o critério de não-regressão.

## Goals / Non-Goals

**Goals:**

- Uma única passada de renomeação cobrindo código, banco, rotas e configuração — sem estados híbridos duradouros.
- Mapa de nomenclatura pt-BR → inglês documentado, para os demais catálogos usarem os mesmos termos.
- Convenção registrada nos três lugares que a impõem: `config.yaml` (guidance/context), README (referência humana) e `task-reviewer` (enforcement em review).

**Non-Goals:**

- Traduzir artefatos OpenSpec, specs, comentários, mensagens de interface ou documentação — permanecem pt-BR.
- Reescrever histórico (reviews, qa/, archive) — são registros da época.
- Criar camada de compatibilidade para a rota antiga da API — não há consumidor externo.

## Decisions

### D1 — Mapa de nomenclatura (glossário de código)

Referência canônica para esta e as próximas changes; termos do glossário §15 do levantamento à esquerda:

| pt-BR (domínio) | Inglês (código/banco/API) |
| --- | --- |
| cabo condutor | `ConductorCable` / `conductor_cable` / `conductor-cables` |
| versão (de catálogo) | `Version` / `_version` |
| vigência (início de) | `effectiveFrom` / `effective_from` |
| vigente em (data de referência) | `effectiveOn` (query param) |
| peso (ton/km) | `weightTonPerKm` / `weight_ton_per_km` |
| bobina (m) | `reelLengthM` / `reel_length_m` |
| diâmetro (mm) | `diameterMm` / `diameter_mm` |
| UTS (kN) | `utsKn` / `uts_kn` (sigla mantida) |
| criado por / em | `createdBy` / `createdAt` |
| campos pendentes | `pendingFields` |
| busca | `search` |
| catálogo | `catalogs` (módulo/feature) |
| motor de cálculo | `calc-engine` / `DecimalValue`, `DependencyGraph` |
| domínio | `domain` |
| política de arredondamento | `RoundingPolicy`: `'half-up'` \| `'half-even'` |

Regra geral: siglas consagradas do setor (UTS, OPGW, LT) não se traduzem; termos sem equivalente natural em inglês entram no mapa antes de usar.

### D2 — O que permanece em pt-BR

Comentários; mensagens de erro e textos exibidos ao usuário (RNF-14); descrições de testes (`describe`/`it`) e cenários de specs; artefatos OpenSpec; mensagens de commit. Racional: são comunicação com pessoas, não identificadores.

### D3 — Migration de RENAME, não drop/create

`prisma migrate dev --create-only` e edição manual do SQL para `ALTER TABLE ... RENAME TO` e `ALTER TABLE ... RENAME COLUMN`, preservando os dados de desenvolvimento e provando o padrão que será obrigatório quando houver dados de produção. O `@@map`/`@map` do schema passa a apontar para os nomes ingleses.

### D4 — Renomeação das libs pelo generator do Nx

`nx g @nx/workspace:move` para `libs/domain` e `libs/calc-engine` (atualiza `project.json`, tsconfig paths e imports automaticamente), seguido de ajuste manual de `importPath`, tags (`scope:*` no `eslint.config.mjs` e nos `project.json`) e das regras de lint do motor (que continuam com mensagens pt-BR).

### D5 — Rotas com URL inglesa, sem redirect

`/api/catalogs/conductor-cables` e `/catalogs/conductor-cables` no navegador. Sem redirect da rota antiga: não há links externos nem favoritos de produção. O script E2E do QA é atualizado na mesma passada.

### D6 — Ordem de execução que mantém o workspace verde por grupo

Convenções/documentos → libs → banco/schema → api → web → verificação E2E. Cada grupo termina com a suíte verde; a api só compila depois das libs e do client Prisma novo, por isso a ordem é estrita.

## Risks / Trade-offs

- [Renomeação ampla pode introduzir regressão silenciosa] → comportamento coberto por 53 testes + E2E do QA reexecutado ao final; nenhum teste é apagado, apenas renomeado.
- [Divergência futura de tradução entre catálogos] → D1 é o mapa canônico; termos novos entram no mapa via design das próximas changes.
- [`nx g move` pode não ajustar tudo (jest displayName, importPath)] → task dedicada de verificação pós-move com `nx run-many` e grep por nomes antigos.
- [Migration de rename à mão pode divergir do schema] → `prisma migrate diff`/`migrate status` limpo é critério de aceite da task.

## Migration Plan

Tudo em um branch de trabalho local (main direto, como as changes anteriores), commits por grupo. Rollback: reverter commits; a migration de rename tem inverso trivial (RENAME de volta). Recomenda-se arquivar `piloto-catalogo-cabos` antes de iniciar.

## Open Questions

Nenhuma — as ambiguidades (rotas, banco, testes) foram decididas e registradas em D1/D2/D5.
