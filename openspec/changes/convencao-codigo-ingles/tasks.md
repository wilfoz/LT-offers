# Tasks: convencao-codigo-ingles

## 1. Convenções e documentação

- [x] 1.1 Atualizar o `context` e o `guidance` do `openspec/config.yaml`: código/pastas/nomes em inglês com o mapa D1 como referência, comentários/mensagens/tests-descriptions em pt-BR, interface pt-BR (RNF-14)
- [x] 1.2 Atualizar a seção de convenções do `README.md` com a nova regra de idiomas e o mapa de nomenclatura D1
- [x] 1.3 Atualizar o padrão de idiomas do agente `.claude/agents/task-reviewer.md`: identificadores em inglês são a regra; nomes de domínio em pt-BR passam a ser apontados como violação

## 2. Bibliotecas

- [x] 2.1 Mover `libs/dominio` → `libs/domain` com `nx g @nx/workspace:move`, ajustando `importPath` `@lt-offers/domain`, tag `scope:domain` e renomeando os tipos exportados (ex.: `Identificador` → `Identifier`, contratos de cabos em inglês conforme D1)
- [x] 2.2 Mover `libs/motor-calculo` → `libs/calc-engine` (`@lt-offers/calc-engine`, tag `scope:engine`): `ValorDecimal` → `DecimalValue`, `GrafoDependencias` → `DependencyGraph`, `RoundingPolicy` `'half-up'|'half-even'`; comentários e mensagens de lint permanecem pt-BR
- [x] 2.3 Atualizar as tags e `depConstraints` do `eslint.config.mjs` raiz (`escopo:*` → `scope:*`) e as regras anti-relógio do escopo do motor; provar com arquivo de violação temporário que as fronteiras continuam ativas
- [x] 2.4 Rodar a suíte das libs e grep por nomes antigos (`dominio|motor-calculo|ValorDecimal|GrafoDependencias|escopo:`) sem ocorrências em código ativo

## 3. Banco de dados

- [x] 3.1 Renomear modelos e campos no `schema.prisma` conforme D1 (`ConductorCable`, `ConductorCableVersion`, `effective_from`, `weight_ton_per_km`, `reel_length_m`, `diameter_mm`, `created_by`, `created_at`)
- [x] 3.2 Gerar migration com `--create-only`, editar para `ALTER TABLE/COLUMN RENAME` (D3), aplicar e confirmar `prisma migrate status` limpo e dados preservados
- [x] 3.3 Regenerar o Prisma Client e confirmar os novos tipos

## 4. API

- [ ] 4.1 Renomear `apps/api/src/catalogos` → `catalogs`: `ConductorCablesController/Service`, DTOs (`CreateConductorCableDto`, `CreateVersionDto`), helpers (`civil-date.ts`, `effectiveness.ts`), métodos em inglês; mensagens de validação/erro permanecem pt-BR
- [ ] 4.2 Alterar rota para `/api/catalogs/conductor-cables` com campos JSON em inglês (`effectiveOn` como query param) e atualizar todos os testes (identificadores em inglês, descrições `it()` em pt-BR)
- [ ] 4.3 Verificar os endpoints ao vivo contra o Postgres (criar, nova versão, `effectiveOn` passado/atual/inválido, histórico, PATCH 405, dados antigos preservados pela migration)

## 5. Web

- [ ] 5.1 Renomear `apps/web/src/app/catalogos` → `catalogs`: componentes `ConductorCableListComponent`, `ConductorCableFormComponent`, `ConductorCableHistoryComponent`, service `ConductorCablesApi`, identificadores em inglês; todos os textos de tela permanecem pt-BR
- [ ] 5.2 Atualizar rotas do navegador para `/catalogs/conductor-cables` e os testes de componente
- [ ] 5.3 Atualizar o script E2E `qa/e2e-qa.mjs` da change do piloto (rotas e seletores que mudaram) mantendo os mesmos cenários

## 6. Verificação final

- [ ] 6.1 Rodar `npx nx run-many -t lint test build` e `npx nx format:check --all` limpos; grep global por identificadores pt-BR remanescentes em código ativo
- [ ] 6.2 Reexecutar o script E2E completo contra os serviços reais confirmando os mesmos 15 resultados PASSOU do QA
- [ ] 6.3 Commit, push e CI verde
