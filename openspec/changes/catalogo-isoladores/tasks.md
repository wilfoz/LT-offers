# Tasks: catalogo-isoladores

## 1. Nomenclatura e modelo de dados

- [x] 1.1 Acrescentar ao mapa canônico do README (design D4): isolador → `Insulator` / `insulator` / `insulators`; perfil → `profile`; carga de ruptura (kN) → `ruptureStrengthKn` / `rupture_strength_kn`; passo (mm) → `spacingMm` / `spacing_mm`; linha de fuga (mm) → `creepageDistanceMm` / `creepage_distance_mm` (atenção ao realinhamento Prettier da tabela se alguma célula alargar a coluna)
- [x] 1.2 Modelar `Insulator`/`InsulatorVersion` no `schema.prisma` (design D1: bloco no final, campos anuláveis RNF-09, tipo/fabricante/perfil/descrição `String?`, `rupture_strength_kn Decimal(12,2)`, `diameter_mm`/`spacing_mm`/`creepage_distance_mm Decimal(10,3)`, `effective_from @db.Date`, `@@unique([insulatorId, effectiveFrom])`, índice desc) e gerar a migration
- [x] 1.3 Aplicar a migration no Postgres local (`lt-offers-postgres`), regenerar o Prisma Client e confirmar zero drift com `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma`

## 2. Contratos compartilhados

- [x] 2.1 Criar `libs/domain/src/lib/catalogs/insulators.ts` (contratos de request/response no molde de `guy-wires.ts`: decimais como string, campos anuláveis, `Summary` com `pendingFields`) exportado pelo index

## 3. API de isoladores

- [x] 3.1 Criar `insulators.controller/service/module` em `/catalogs/insulators` sobre a base extraída (helpers de `controller-shared.ts`/`prisma-errors.ts`, `missingFields` com o mapa de rótulos do spec — tipo, perfil, ruptura, diâmetro, passo, linha de fuga; fabricante e descrição fora —, mappers tipados contra a domain, datas civis na borda), registrando no `CatalogsModule`
- [x] 3.2 Implementar DTOs com class-validator e mensagens pt-BR de `dto/validation-messages.ts` (patterns da domain; escala dos decimais limitada à precisão das colunas — lição P2002 de series-torres): código obrigatório/único, decimais como string positiva, textos livres opcionais, `null` para não informado
- [x] 3.3 Escrever testes do service e controller cobrindo os cenários do spec `isoladores` (criação, duplicado 409 via P2002, numéricos inválidos, busca com asserção do TERMO repassado ao `where`, pendências incl. distinção null ≠ zero, histórico, vigência passada/anterior à primeira, 405 PUT/PATCH, autor X-User)
- [x] 3.4 Verificar os endpoints ao vivo contra o Postgres local (criar, nova versão, busca, `effectiveOn` passado, histórico, 405)

## 4. Interface de manutenção

- [x] 4.1 Criar `InsulatorsApi` estendendo `VersionedCatalogApi` sem override e os componentes `insulator-list/-form/-history` na receita Swiss das telas existentes (mat-table nativa, `.form-grid`, `.badge-error`, snackbar ao salvar, `mat-progress-bar` também no histórico), com rotas lazy sob `/catalogs/insulators` e item no menu da casca
- [x] 4.2 Implementar listagem (busca, pendências, callback de erro em toda leitura), formulário (branco→null via `form-utils`, prefill bloqueante via `form.disable()` incl. caso de falha, botão `[disabled]="saving() || form.disabled"`, id malformado rejeitado) e histórico (vigência `dd/MM/yyyy` UTC, `createdAt` local)
- [x] 4.3 Escrever testes de componente (pendências, erro de API em cada leitura, payload com null e decimais como string, repasse do termo de busca ao serviço, prefill pendente/falho, snackbar ao salvar, histórico) e conferir ausência de BOM nos arquivos novos (`head -c3 | od`)

## 5. QA e fechamento

- [x] 5.1 Executar a skill `/executar-qa` para a change: validar cada cenário do spec `isoladores` com evidências (E2E via navegador incl. responsividade/acessibilidade) e gerar `qa.md`
- [ ] 5.2 Rodar a suíte completa (`npx nx run-many -t lint test build` e `npx nx format:check --all`) limpa e confirmar o CI verde no push; registrar na review qualquer atrito da base extraída como insumo da reavaliação pós-5º catálogo
