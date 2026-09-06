# Design: catalogo-solos-fundacoes

## Context

Ver `proposal.md — Why`. Cinco catálogos existem sobre a base extraída e reavaliada (`reavaliacao-base-catalogos`): patterns de validação e `decimalScaleViolation` na `domain`, helpers `catalogs/*` na API, `VersionedCatalogApi`/`form-utils` no web. Este é o primeiro catálogo com **três recursos** na mesma change e o primeiro com **identidade composta por referências a outros catálogos** (a matriz referencia `TowerType` do `catalogo-series-torres`, além dos dois recursos novos). A estrutura real da `DB_FUN` foi inspecionada diretamente na planilha (blocos `SUELOS`, `TIPOS FUNDACIONES` e `VOLUMENES POR TORRE`) — os atributos abaixo vêm dessa inspeção, não apenas do resumo do levantamento.

Limites conhecidos da base, reafirmados na reavaliação, que esta change exercita de novo: `missingFields` não cobre coleções/derivados (composição da fundação e pendência "tudo nulo" da matriz são composições locais) e `VersionedCatalogApi` assume criação por `code`/`description` (a matriz cria por tripla de referências — API própria no web).

## Goals / Non-Goals

**Goals:**

- Três pares item + versões imutáveis (`SoilType`, `FoundationType`, `FoundationVolume`) seguindo à risca o padrão consolidado: vigência derivada, `@@unique([itemId, effectiveFrom])`, autoria, data de referência resolvida na borda (D2 do piloto), mappers tipados contra a `domain`.
- Identidade composta da matriz garantida no banco (`@@unique` da tripla de FKs) e referências validadas na API com mensagens pt-BR.
- Máximo reuso: solos e fundações devem ser "isoladores com outros campos"; a matriz reusa tudo da API e diverge apenas onde a identidade composta obriga.

**Non-Goals:**

- Importação em massa da matriz (~2.010 linhas da planilha) — change futura; esta entrega o CRUD.
- Validação de aplicabilidade quantidade × composição da fundação (a planilha mistura zero e vazio sem regra; impor regra agora seria especulativo).
- Generalizar a base extraída para identidade composta (1ª ocorrência — regra das três ocorrências).
- Consumo da matriz pelo estaqueamento (RF-19/20) ou pelo cálculo de volumes (RF-24/RN-12).

## Decisions

### D1 — Modelo Prisma: três pares item+versão e o enum de aplicação

- `SoilType` (id, `code` único) + `SoilTypeVersion` (`description String?`, `submerged Boolean?`, `allowable_compression_stress_kgf_cm2 Decimal? (12,2)`, `specific_weight_kgf_m3 Decimal? (12,2)`, `internal_friction_angle_deg Decimal? (10,3)`, `cohesion_kg_cm2 Decimal? (10,3)`, `nspt_min Int?`, `nspt_max Int?`, vigência `@db.Date`, autoria; `@@unique([soil_type_id, effective_from])`, índice desc). Faixa de NSPT estruturada (min inclusivo, max exclusivo — os 10 solos da planilha seguem `x≤N<y`); `nspt_min < nspt_max` garantido na API, sem CHECK no banco (risco aceito, precedente GroundWire). Alternativa — faixa como texto livre: rejeitada, perderia a consulta estruturada que o estaqueamento fará (classificar NSPT medido em solo).
- `enum FoundationApplication { SELF_SUPPORTING, GUYED, CROSS_ROPE }` (valores enumerados nos ~52 tipos reais: Autoportante, Estaiada, Crossrope). `FoundationType` (id, `code` único, `application`) + `FoundationTypeVersion` (`description String?` + 17 contagens `Int?`, vigência, autoria). Aplicação na **identidade**, imutável (precedente `GroundWire.type`/`TowerType.function`): é intrínseca ao tipo — `4FZ` é autoportante por construção.
- Composição por elemento como **17 colunas `Int?`** espelhando a planilha (fuste sapata → `spread_footing_count`, preformado mastro/tirante → `precast_mast_count`/`precast_guy_count`, pilas → `straight_pier_count`/`belled_pier_count`/`slab_pier_count`/`straight_pier_guy_count`/`belled_pier_guy_count`, ancoragem em rocha → `rock_anchor_count`, estacas → `concrete_pile_count`/`steel_pile_count`/`root_pile_count`, helicoidais → `helical_mast_count`/`helical_guy_count`, `tricone_count`, `micropile_count`, hélice contínua → `continuous_auger_pile_count`). Alternativa — tabela filha genérica elemento × contagem: rejeitada; o conjunto de elementos é fechado na planilha, colunas tipadas dispensam enum de elemento + join e mantêm o padrão de colunas anuláveis por tipo.
- `FoundationVolume` (id, `tower_type_id` FK, `soil_type_id` FK, `foundation_type_id` FK; `@@unique([tower_type_id, soil_type_id, foundation_type_id])`) + `FoundationVolumeVersion` com **34 colunas `Decimal? (12,3)`** uniformes, em cinco famílias: escavação (`excavation_{hard|normal|water}_{footing|precast|pile_cap}_m3`, `excavation_pier_m3`), perfuração (`anchor_bolt_drilling_m`), aço (`steel_{piers|footings|pile_caps|precast|rock|anchor_bolts}_kg`), concreto (`concrete_{piers|footings|pile_caps|precast|rock}_m3`), complementos (`regeneration_m3`, `grout_m3`, `backfill_soil_m3`, `backfill_soil_cement_m3`, `formwork_m2`) e metragens de estacas (`{helical|steel|root|concrete}_pile_m`, `tricone_m`, `continuous_auger_pile_m`, `micropile_m`). Precisão única (12,3) cobre os dados reais (aço em milhares de kg, volumes com 2 casas) e evita colisão pós-arredondamento com escala do DTO limitada a 3 (lição P2002 de series-torres). Encepado → `pile_cap` (bloco de coroamento).
- FKs com `onDelete` default (Restrict): não há exclusão nos catálogos, e a restrição no banco é o cinturão do RF-11 futuro.

### D2 — API: dois controllers padrão e um com identidade composta

- `soil-types` e `foundation-types` em `/catalogs/soil-types` e `/catalogs/foundation-types`: as cinco rotas do padrão (list com `search` + `effectiveOn`, POST, GET `:id`, POST `:id/versions`, GET `:id/history`) sobre `createIdPipe`/`resolveAuthor`/`resolveReferenceDate`/`isUniqueViolation`/`missingFields`. `foundation-types` adiciona filtro `application` no list (precedente ground-wires) e rejeita troca de aplicação com `@IsEmpty` no DTO de versão (mensagem pt-BR — sem isso o `ValidationPipe {whitelist:true}` descartaria a propriedade em silêncio).
- `foundation-volumes` em `/catalogs/foundation-volumes` (recurso **plano**, não aninhado): a tripla completa na URL daria três níveis de aninhamento sem hierarquia real — a combinação não "pertence" a nenhum dos três pais. List com filtros `towerTypeId`/`soilTypeId`/`foundationTypeId` + `effectiveOn`; POST cria com a tripla + quantidades; POST `:id/versions` só quantidades (DTO com os três ids `@IsEmpty`, tripla imutável). Criação valida a existência das três referências **antes** do insert, com 404 pt-BR dizendo qual referência falta; `@@unique` da tripla + `isUniqueViolation` → 409 como cinturão de concorrência (P2002).
- Summary da matriz carrega os rótulos da combinação (nome da série + sigla da torre, código do solo, sigla da fundação) via `include` no Prisma e mapper — a listagem é ilegível só com ids.

### D3 — Contratos e pendências

- `libs/domain/src/lib/catalogs/soil-types.ts`, `foundation-types.ts`, `foundation-volumes.ts`: const-array `FOUNDATION_APPLICATIONS`/tipo `FoundationApplication` (precedente `GROUND_WIRE_TYPES`), interfaces `XSummary`/`XVersion`/`XHistory` com decimais string e datas ISO; a matriz expõe `combination { towerTypeId, seriesName, towerCode, soilTypeId, soilCode, foundationTypeId, foundationCode }` no summary.
- Pendências: solo = `missingFields` sobre descrição, submerso, tensão admissível, peso específico e ângulo de atrito (coesão e NSPT fora — não se aplicam a rocha; um booleano `false` e um zero persistidos não são pendência, RNF-09). Fundação = `missingFields(description)` **compondo com** verificação própria "nenhuma das 17 contagens informada" (rótulo "composição por elemento"). Matriz = verificação própria "nenhuma das 34 quantidades informada" (rótulo "quantidades"). Os dois últimos são o limite conhecido `missingFields`-sem-coleções, reafirmado na reavaliação — composição local, sem generalizar.

### D4 — Web: dois catálogos no padrão e a matriz com API própria e form seccionado

- Solos e fundações: trio list/form/history padrão; `SoilTypesApi` e `FoundationTypesApi` estendem `VersionedCatalogApi` (fundações com override do list para o filtro de aplicação, precedente `GroundWiresApi` — manter o teste que asserta o repasse do termo de busca **e** do filtro juntos, lição do minor de guy-wires). Form de fundação: aplicação `mat-select` travado na edição, 17 contagens `intOrNull` agrupadas por família (sapata/preformados/pilas/rocha/estacas).
- Matriz: `FoundationVolumesApi` **não estende** `VersionedCatalogApi` (criação por tripla, não por `code`/`description` — 2ª divergência do limite de URL/payload fixo, registrada para a reavaliação; parametrizar agora seria a 2ª ocorrência, a regra pede três). Métodos próprios com os mesmos contratos de retorno.
- Form da matriz: seleção da combinação por três selects carregados dos catálogos — série → tipo de torre em cascata (a lista de torres depende da série), solo e fundação diretos — todos travados na edição (`disable({emitEvent:false})`); 34 campos decimais `orNull` agrupados nas cinco famílias do D1 com `.form-grid`. Prefill bloqueante: qualquer falha de leitura (entrada, séries, torres, solos, fundações) bloqueia o form com erro — lição institucional do prefill silencioso.
- Listagem da matriz: filtros por série/torre/solo/fundação (selects), colunas = combinação + amostra de quantidades (escavação total não — sem agregação; exibir contagem de quantidades informadas + badge de pendência) + vigência. Rotas lazy sob `/catalogs/foundation-volumes`.
- Menu da casca: +3 itens (Tipos de solo, Tipos de fundação, Matriz de volumes) — o teste da casca asserta a lista exata e o length (5 → 8); atualizar na mesma task da rota.

### D5 — Nomenclatura

Bloco novo no mapa do README antes do código, com os termos do proposal — Impact mais: encepado/bloco de coroamento → `pileCap`; fuste sapata → `spreadFooting`; preformado → `precast`; pila (reta | campana | com laje) → `pier (straight | belled | slab)`; tirante (elemento de fundação estaiada) → `guy`; perfuração de pernos → `anchorBoltDrillingM`; regeneração → `regenerationM3`; grout → `groutM3` (termo do setor, não traduz); reaterro (solo | solo-cimento) → `backfillSoilM3`/`backfillSoilCementM3`; formas → `formworkM2`; hélice contínua → `continuousAugerPile`; estaca raiz → `rootPile`; matriz de volumes → `FoundationVolume`. Sufixos de unidade nas colunas de quantidade (`M3`, `Kg`, `M2`, `M`) seguem o padrão `Kn`/`Mm` dos catálogos.

## Risks / Trade-offs

- [Unidades da matriz inferidas, não declaradas na planilha] → hipótese registrada no proposal (premissa 1); modelo aditivo, renomear coluna é migration pequena; o sistema não converte unidades.
- [Traduções dos elementos de fundação (pila → pier, encepado → pile cap) sem glossário prévio] → mapa canônico no README revisado antes do código; rótulos pt-BR na UI vêm do levantamento, o inglês é interno.
- [Form da matriz com 3 referências + 34 campos — o maior do projeto] → agrupamento por família com `.form-grid`, validação `decimalScaleValidator` por campo, teste de payload null/número; sem FormArray (campos fixos), complexidade menor que o peso×altura.
- [Cadastro manual de ~2.010 combinações é inviável na prática] → aceito nesta change: cadastram-se as combinações das primeiras ofertas; importação Excel é change futura já sinalizada no proposal (Excel como intercâmbio, §12).
- [Cascata série → torre no form pode reintroduzir o bug de `valueChanges` reemitido] → carregar torres em handler explícito de mudança de série, nunca em `valueChanges` sem `emitEvent: false` no prefill (lição de catalogo-cabos-guarda-opgw).
- [Três selects de referência dependem de catálogos populados] → estado vazio orienta a cadastrar solo/fundação/série primeiro (empty-state pt-BR); QA cria as referências antes da matriz.
- [P2002 ambíguo — a matriz tem duas uniques (tripla no item, `[itemId, effectiveFrom]` na versão)] → mesma mitigação de series-torres: mensagens distintas por operação (create → combinação duplicada; createVersion → vigência duplicada), escala do DTO limitada à da coluna.

## Migration Plan

Ordem aditiva, sem tocar nos catálogos existentes: (1) README + migration Prisma (os três pares + enum); (2) contratos na `domain`; (3) API soil-types; (4) API foundation-types; (5) API foundation-volumes; (6) UI dos três recursos + menu; (7) QA com smoke dos catálogos existentes. Rollback: reverter migration + arquivos (nenhuma rota existente muda). Rotina consolidada: review do `task-reviewer` por grupo, commit por grupo (staging explícito por caminho, nunca `git add -A`), `npx nx format:check --all` antes de cada commit, `npx nx test api --skip-nx-cache` desnecessário (sharedGlobals já cobre o schema desde a reavaliação), `/executar-qa` antes do archive.

## Open Questions

- Nenhuma bloqueante. Confirmação das unidades da matriz e das traduções de elementos segue na validação §02 já registrada; ambas são aditivas sobre o modelo (renomeação de coluna/rótulo).
