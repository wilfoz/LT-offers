# Design: catalogo-isoladores

## Context

Ver `proposal.md — Why`. Quatro catálogos existem; os três planos (`conductor-cables`, `ground-wires`, `guy-wires`) rodam sobre a base extraída em catalogo-cabos-tirante (patterns de validação na `domain`, helpers `catalogs/*` na API, mappers tipados, `VersionedCatalogApi`/`form-utils` no web). O isolador tem exatamente a forma que essa base atende: catálogo plano, um par item + versões, sem discriminador, sem hierarquia. O precedente direto é o `GuyWire` — inclusive na medida de sucesso: o grupo de API deve ser "guy-wires com outros campos". Todas as telas novas nascem sobre a casca Material/Swiss (`openspec/DESIGN.md` é autoridade de layout).

## Goals / Non-Goals

**Goals:**

- Quinto catálogo inteiramente sobre a base extraída, sem tocar em nada existente (zero refit; nenhuma mudança de comportamento observável fora das rotas novas).
- Código novo contém apenas o específico do isolador: schema, contratos, rótulos, rotas, campos.
- Lições institucionais aplicadas de primeira (callbacks de erro em toda leitura com teste, prefill bloqueante, `format:check --all` antes do push, sem BOM, asserção do termo de busca repassado, `mat-progress-bar` também no histórico).

**Non-Goals:**

- Reavaliar/generalizar a abstração da base extraída (marcada para depois do 5º catálogo — esta change só fornece o dado; se houver atrito, registra-se o limite sem generalizar aqui).
- Vincular `StructureSeries.insulatorType` ao catálogo (FK e migração dos textos livres já digitados são change futura).
- Enum para tipo/perfil de isolador (sem valores levantados — ver D1).

## Decisions

### D1 — Modelo de dados: par plano `Insulator`/`InsulatorVersion`, tudo na versão

Espelho do `GuyWire` (schema.prisma): `Insulator` (id, `code` único) e `InsulatorVersion` com descrição, tipo, fabricante, perfil (todos `String?` — o levantamento não enumera valores de tipo/perfil, então **texto livre na versão**, não enum na identidade; se valores fixos forem confirmados, a conversão é migration futura sobre dados reais, melhor que enum especulativo agora), `rupture_strength_kn Decimal(12,2)` (espelha `uts_kn`), `diameter_mm`/`spacing_mm`/`creepage_distance_mm Decimal(10,3)` (espelham `diameter_mm` dos cabos — comprimentos em mm), vigência `@db.Date`, autoria, `@@unique([insulatorId, effectiveFrom])`, índice desc. Nomes de índice `insulator_version_*` ficam folgados no limite de 63 chars do Postgres. Alternativa — tipo na identidade como `GroundWireType`: rejeitada; lá o levantamento enumerava os valores (aço | OPGW) e havia campos condicionais por tipo — aqui não há nem uma coisa nem outra.

### D2 — API sobre a base extraída, sem novidade estrutural

`insulators.controller/service/module` em `/catalogs/insulators`, consumindo `createIdPipe`/`resolveAuthor`/`resolveReferenceDate`/`versionImmutableException` (`controller-shared.ts`), `isUniqueViolation` (`prisma-errors.ts`), `missingFields(version, labels)` (`effectiveness.ts`) e `dto/validation-messages.ts`. DTOs com `POSITIVE_DECIMAL_PATTERN`/`DATE_PATTERN` da `domain`, escala limitada à precisão das colunas (lição P2002 de series-torres: evita colisão pós-arredondamento com mensagem enganosa). Mappers `toVersionContract`/`toSummary` tipados contra `libs/domain/src/lib/catalogs/insulators.ts` (Decimal→string, datas→ISO, sem FKs). Pendências: mapa de rótulos com tipo, perfil, ruptura, diâmetro, passo e linha de fuga (fabricante e descrição fora, conforme spec). Critério de aceite do design: diff conceitual contra `guy-wires.service.ts` ≈ só campos e rótulos.

### D3 — Web: `InsulatorsApi` sem override e três componentes padrão

`InsulatorsApi` estende `VersionedCatalogApi` sem sobrescrever nada (como `GuyWiresApi`, ~20 linhas). Componentes `insulator-list/-form/-history` (o componente de detalhe é particularidade do catálogo hierárquico de séries; os catálogos planos não o têm) seguindo a receita Swiss das telas existentes (mat-table nativa, `.form-grid`, `.badge-error` para pendência, snackbar ao salvar), rotas lazy sob `/catalogs/insulators` em `catalogs.routes.ts`, item novo no menu da casca. Lições incorporadas por padrão: callback de erro em toda leitura (com teste), prefill via `form.disable()` + caso de falha bloqueante, botão `[disabled]="saving() || form.disabled"`, id de rota malformado tratado, `orNull` nos campos texto/decimais; no spec da listagem, assertar o TERMO repassado ao serviço (lacuna reincidente das reviews); `mat-progress-bar` também no histórico (minor pendente do design-system nas 5 histories existentes — aqui já nasce certo; o retrofit das outras não entra nesta change).

### D4 — Nomenclatura

Mapa do README antes do código: isolador → `Insulator` / `insulator` / `insulators`; perfil → `profile`; carga de ruptura (kN) → `ruptureStrengthKn` / `rupture_strength_kn` (tradução direta do termo da planilha, legível no mapa pt→en; a sigla IEC "SML" foi rejeitada por opacidade); passo (mm) → `spacingMm` / `spacing_mm` (termo da IEC 60305 para o passo de isoladores de disco; `pitch` rejeitado por ser menos usual nesse contexto); linha de fuga (mm) → `creepageDistanceMm` / `creepage_distance_mm` (termo consagrado). Já mapeados: `manufacturer`, `diameterMm`, `insulatorType`.

## Risks / Trade-offs

- [Atributos de `DB_AIS` não confirmados com os autores (§02): 49 colunas na planilha vs 7 atributos no resumo] → modelo aditivo, mesmo tratamento das changes anteriores; colunas extras entram por migration aditiva quando confirmadas.
- [Tipo/perfil texto livre pode fragmentar valores ("vidro", "Vidro", "vidro temperado")] → aceito nesta change (não há valores levantados para validar contra); a normalização/enum é change futura com dados reais na mesa.
- [Reuso pode esconder atrito da base no 5º catálogo] → qualquer desvio do padrão (helper que não serve, override inesperado) é registrado na review como insumo da reavaliação pós-5º catálogo, sem generalizar aqui.

## Migration Plan

Ordem padrão dos catálogos planos: (1) migration aditiva `Insulator`/`InsulatorVersion` + README (nomenclatura); (2) contratos na `domain`; (3) API com testes; (4) UI com testes; (5) QA da change. Rollback: reverter migration + arquivos (tudo aditivo, nada existente é tocado). Rotina: review do `task-reviewer` por grupo, commit por grupo (staging explícito por caminho, nunca `git add -A`), `npx nx format:check --all` antes de cada push, `/executar-qa` antes do archive.

## Open Questions

- Nenhuma bloqueante. Valores possíveis de tipo/perfil e as 42 colunas restantes do `DB_AIS` ficam para a validação com os autores (§02), sem afetar specs, abordagem ou tasks desta change.
