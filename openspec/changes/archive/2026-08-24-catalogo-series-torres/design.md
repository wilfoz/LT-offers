# Design: catalogo-series-torres

## Context

Ver `proposal.md — Why`. Três catálogos planos existem sobre a base extraída em `catalogo-cabos-tirante` (patterns de validação na `domain`, helpers `catalogs/*` na API, `VersionedCatalogApi`/`form-utils` no web). Este é o primeiro catálogo **hierárquico** (série → tipos de torre) e com **tabela dependente** (peso × altura na versão): o design fixa como o padrão item + versões se aplica a cada nível, o desenho das rotas aninhadas e os pontos onde a base extraída não alcança — que ficam registrados como limites, sem generalização nesta change.

Decisões do usuário já tomadas na proposta: peso por altura como tabela discreta (pontos altura → peso, filha da versão) e versionamento independente nos dois níveis.

## Goals / Non-Goals

**Goals:**

- Dois pares item + versões imutáveis (`StructureSeries`, `TowerType`) seguindo à risca o padrão dos catálogos de cabos: vigência derivada, `@@unique([itemId, effectiveFrom])`, autoria, data de referência resolvida na borda (D2 do piloto).
- Tabela peso × altura imutável junto com a versão: cada versão do tipo de torre grava sua tabela completa.
- Máximo reuso da base extraída; cada ponto em que ela não couber é registrado aqui como limite conhecido para a reavaliação prevista após o 5º catálogo.

**Non-Goals:**

- Generalizar a base extraída para hierarquia ou tabelas filhas (rotas aninhadas parametrizadas na `VersionedCatalogApi`, `missingFields` com coleções) — seria a 1ª ocorrência de cada necessidade.
- Interpolação de peso entre alturas, seleção de torre por altura, quantitativos (RF-23) — consumo do catálogo fica com o estaqueamento/M04.
- Importação em massa do `DB_TOR` (Excel é só intercâmbio, e importação está fora do escopo da change).

## Decisions

### D1 — Modelo Prisma: dois pares item+versão e a tabela de pesos

- `StructureSeries` (id, `name` único) + `StructureSeriesVersion` (`designer String?`, `voltage_kv Decimal? (12,2)`, `circuit_count Int?`, `cables_per_phase Int?`, `design_wind_speed_ms Decimal? (12,2)`, `insulator_type String?`, `sil_mw Decimal? (12,2)`, vigência `@db.Date`, autoria; `@@unique([structure_series_id, effective_from])`, índice desc) — precisões seguem a família (12,2) dos catálogos existentes; inteiros como `Int?`.
- `enum TowerFunction { SUSPENSION, ANCHOR }`; `TowerType` (id, `structure_series_id` FK, `code`, `function`; `@@unique([structure_series_id, code])` — sigla única **por série**, conforme spec) + `TowerTypeVersion` (`guy_count Int?`, vigência, autoria; mesmos índices do padrão). Função na **identidade**, como `GroundWire.type` (precedente): é intrínseca ao tipo; troca rejeitada na API.
- `TowerTypeWeight` (id, `tower_type_version_id` FK, `height_m Decimal (10,3)`, `weight_kg Decimal (12,2)`; `@@unique([tower_type_version_id, height_m])`). Pertence à **versão**, não ao tipo: imutabilidade da versão implica imutabilidade da tabela; nova versão grava a tabela inteira (nested create na mesma operação Prisma — atômico, sem transação manual). Alternativa — tabela ligada ao tipo com vigência própria por ponto: rejeitada, quebraria o snapshot coeso da versão e complicaria o histórico.
- `guy_count = 0` é valor persistido normal (autoportante); `null` = não informado (RNF-09). O front envia número, não converte vazio em zero (`intOrNull`).

### D2 — API: rotas aninhadas, tipo de torre sempre no contexto da série

- `structure-series.controller/service` em `/catalogs/structure-series`: mesmas cinco rotas do padrão (list com `search` por nome/projetista + `effectiveOn`, POST, GET `:id`, POST `:id/versions`, GET `:id/history`), sobre `createIdPipe`/`resolveAuthor`/`resolveReferenceDate`/`isUniqueViolation`/`missingFields`. `list` inclui `towerTypeCount` (`_count` do Prisma) no summary.
- `tower-types.controller/service` com prefixo `/catalogs/structure-series/:seriesId/tower-types` (list, POST, GET `:id`, POST `:id/versions`, GET `:id/history`). **Aninhamento completo**: toda operação valida que a série existe e que o tipo pertence a ela (404 pt-BR caso contrário) — a URL expressa a hierarquia e impede acesso cruzado entre séries. Alternativa — rotas rasas `/catalogs/tower-types/:id` após a criação: rejeitada; dois padrões de URL para o mesmo recurso e sem ganho real, o web sempre navega a partir da série.
- Troca de função rejeitada como no precedente OPGW: DTO de versão com campo `function` `@IsEmpty` (mensagem pt-BR) — sem isso o `ValidationPipe {whitelist:true}` descartaria a propriedade em silêncio e o cenário do spec exige 400.
- Tabela de pesos no DTO de versão: array de `{heightM, weightKg}` validado com `ValidateNested` + patterns da `domain`; alturas duplicadas rejeitadas por validador custom no DTO (mensagem pt-BR) **e** `@@unique` no banco como cinturão (P2002 → 409 via `isUniqueViolation`). Array ausente = tabela vazia (pendência, não erro).

### D3 — Contratos e pendências

- `libs/domain/src/lib/catalogs/structure-series.ts` e `tower-types.ts`: `TOWER_FUNCTIONS`/`TowerFunction` const-array + tipos (precedente ground-wires), interfaces `XSummary`/`XVersion`/`XHistory` com decimais como string e datas ISO; pesos como `TowerWeightPoint { heightM, weightKg }[]` ordenado por altura. Services mapeiam via `toVersionContract`/`toSummary` (D3 da change anterior).
- Pendências: série = todos os campos da versão (`designer`, `voltageKv`, `circuitCount`, `cablesPerPhase`, `designWindSpeedMs`, `insulatorType`, `silMw`) via `missingFields` + mapa de rótulos. Tipo de torre = `guyCount` via `missingFields` **compondo com** verificação própria de tabela vazia (rótulo "tabela peso × altura"): `missingFields` só olha campos escalares — limite conhecido da base, composição em vez de generalização.

### D4 — Web: séries no padrão, tipos de torre com API própria e FormArray

- Séries: `structure-series-list/-form/-history` e `StructureSeriesApi extends VersionedCatalogApi` — padrão idêntico aos cabos (busca, pendências, prefill bloqueante com `form.disable()`, erro em toda leitura, datas UTC/local).
- Tipos de torre: `TowerTypesApi` **não estende** `VersionedCatalogApi` — a base assume URL fixa no construtor e todas as rotas de tipo dependem de `seriesId` (limite registrado; parametrizar a base seria a 1ª ocorrência). Serviço próprio com os mesmos quatro métodos recebendo `seriesId` explícito.
- Formulário do tipo de torre: primeira ocorrência de `FormArray` no projeto — linhas altura/peso com adicionar/remover, validação por linha com os patterns da `domain`, duplicata de altura apontada no form antes do submit. Prefill de edição carrega a tabela vigente no array. Lições institucionais valem: reset de estado no `save()`, `enable({ emitEvent: false })`, botão `[disabled]="saving() || form.disabled"`, guarda de id malformado (agora dois ids na rota: série e tipo — ambos guardados **e testados**, cobrindo o minor recorrente das reviews).
- Navegação: lista de séries → detalhe da série (dados vigentes + lista de tipos) → form/histórico do tipo. Rotas lazy sob `/catalogs/structure-series`.

### D5 — Nomenclatura

Mapa do README antes do código (termos listados no proposal — Impact): `StructureSeries`, `TowerType`, `TowerFunction {SUSPENSION, ANCHOR}`, `designer`, `voltageKv`, `circuitCount`, `cablesPerPhase`, `designWindSpeedMs`, `insulatorType`, `silMw`, `guyCount`, `heightM`, `weightKg`. "Série" → `series` (invariável em inglês; o plural das rotas fica `structure-series`, consistente com `guy-wires`).

## Risks / Trade-offs

- [Unidades não confirmadas (§02): kV, m/s, MW, kg, m] → hipótese registrada no proposal; modelo aditivo — renomear coluna/rotular é migration pequena; nenhuma conversão de unidade é feita pelo sistema.
- [`missingFields` e `VersionedCatalogApi` não cobrem coleções/hierarquia] → composição local documentada (D3/D4); vira insumo da reavaliação de abstração após o 5º catálogo, não gambiarra silenciosa.
- [FormArray é padrão novo no web — risco de validação/prefill com arestas] → cenários do spec cobrem duplicata, valores inválidos e preservação por versão; testes de componente para adicionar/remover linha, prefill e payload.
- [Rotas aninhadas duplicam checagem de pertencimento] → checagem única no service (`findFirst` com os dois ids), coberta por teste do 404; custo aceito pela clareza da URL.
- [Volume do `DB_TOR` (centenas de tipos) sem importação] → aceito nesta change; cadastro manual dos dados necessários às primeiras ofertas; importação Excel é change futura.

## Migration Plan

Ordem aditiva, sem tocar nos catálogos existentes: (1) README + migration Prisma; (2) contratos na `domain`; (3) API de séries; (4) API de tipos de torre; (5) UI; (6) QA com smoke dos catálogos existentes. Rollback: reverter migration + arquivos (nenhuma rota existente muda). Rotina: review do `task-reviewer` por grupo, commit por grupo (staging explícito por caminho, nunca `git add -A`), `npx nx format:check` completo antes de cada commit, `/executar-qa` antes do archive.

## Open Questions

- Nenhuma bloqueante. Confirmação de unidades e da lista real de funções de torre do `DB_TOR` segue na validação §02 já registrada; ambos os pontos são aditivos sobre o modelo.
