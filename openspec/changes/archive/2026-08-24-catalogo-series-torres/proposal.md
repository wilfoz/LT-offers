# Proposta: catalogo-series-torres

## Why

O quarto catálogo — **séries de estruturas e torres** (`DB_TOR`, maior base de engenharia da planilha: 35.429 células e 15.007 fórmulas) — atende o RF-08 (obrigatório) e é o primeiro catálogo de **forma diferente**: hierárquico (série → tipos de torre) e com tabela dependente (peso por altura), exatamente o teste de limites do padrão extraído que o design de `catalogo-cabos-tirante` previu para o 4º catálogo. Sem ele, o estaqueamento (M04) e os quantitativos de torres (RF-23) não têm de onde ler tipos e pesos.

## What Changes

- **Catálogo de séries de estruturas e torres (`DB_TOR`), em dois níveis, ambos no padrão item + versões imutáveis com vigência (decisão do usuário):**
  - **Série de estrutura** — identidade: nome (único no catálogo); versão: projetista, tensão (kV), quantidade de circuitos, cabos por fase, vento de projeto, tipo de isolador e SIL.
  - **Tipo de torre** — pertence a uma série; identidade: sigla (única dentro da série) e função (suspensão | ancoragem, intrínseca ao tipo, como o precedente `GroundWireType`); versão: quantidade de estais e a **tabela peso × altura** (decisão do usuário: pontos discretos altura → peso, filha da versão — cada nova versão grava a tabela completa, preservando a imutabilidade).
  - Versionamento por vigência conforme `catalogos/versionamento-vigencia` (sem delta), trilha de autoria (RF-03), sinalização de pendências (RF-11 parcial) com null ≠ zero (RNF-09 — em particular, zero estais é valor válido de torre autoportante, distinto de "não informado").
  - API REST em `/catalogs/structure-series` (tipos de torre aninhados na série), telas de manutenção em pt-BR (listagem com busca, formulário, histórico — nos dois níveis) e contratos em `libs/domain`.
- **Reuso da base extraída** (patterns de validação da `domain`, helpers `catalogs/*` da API, `VersionedCatalogApi`/`form-utils` no web) onde a forma couber; onde a hierarquia não couber (ex.: rotas aninhadas, tabela filha), o limite é registrado no design **sem generalizar a base nesta change** — reavaliação de abstração fica para depois do 5º catálogo, com este precedente na mesa.
- **Fora do escopo:** catálogo de isoladores (`DB_AIS` — "tipo de isolador" fica como texto livre nesta change, sem FK); estaqueamento e `DB_Estructuras` (M04); quantitativos de torres (RF-23) e regras RN-xx; a parte de RF-11 "impedir exclusão de item referenciado por oferta ativa" (não há ofertas ainda); importação Excel; autenticação (segue `X-User`, dívida D6 do piloto).

Fase do roadmap: **F1 (M02, continuação)**. Requisitos cobertos: RF-08, RF-10, RF-11 (parcial), RF-03; RNF-05, RNF-08, RNF-09, RNF-14.

## Capabilities

### New Capabilities

- `catalogos/series-torres`: o catálogo de séries de estruturas e seus tipos de torre — atributos dos dois níveis, tabela peso × altura, validações, manutenção (CRUD), busca, sinalização de pendências e histórico por nível.

### Modified Capabilities

Nenhuma — `catalogos/versionamento-vigencia` aplica-se integralmente aos dois níveis do novo catálogo sem delta; os catálogos de cabos existentes não mudam.

## Impact

- **Código:**
  - Prisma: modelos `StructureSeries`/`StructureSeriesVersion`, `TowerType`/`TowerTypeVersion` e `TowerTypeWeight` (pontos altura → peso da versão) + migration aditiva.
  - API: `structure-series.*` e `tower-types.*` em `apps/api/src/catalogs/`, sobre os helpers extraídos (`prisma-errors`, `controller-shared`, `missingFields`).
  - Web: componentes `structure-series-*` e `tower-type-*`, rotas lazy sob `/catalogs/structure-series`, link na navegação; serviços estendendo `VersionedCatalogApi` onde a forma couber.
  - Domain: contratos em `libs/domain/src/lib/catalogs/structure-series.ts` (e tower types).
- **API observável:** apenas rotas novas; nenhuma rota existente muda.
- **Nomenclatura:** novos termos no mapa canônico do README antes do código: série de estrutura → `StructureSeries`/`structure_series`/`structure-series`; tipo de torre → `TowerType`/`tower_type`/`tower-types`; função → `TowerFunction`: `SUSPENSION` | `ANCHOR`; projetista → `designer`; tensão (kV) → `voltageKv`; circuitos → `circuitCount`; cabos por fase → `cablesPerPhase`; vento de projeto → `designWindSpeedMs`; tipo de isolador → `insulatorType`; SIL (MW) → `silMw`; quantidade de estais → `guyCount`; altura (m) → `heightM`; peso (kg) → `weightKg`.
- **Configuração/dependências:** nenhuma nova.
- **Premissas registradas (hipóteses §02, modelo aditivo como nas changes anteriores):**
  1. Unidades inferidas e não confirmadas com os autores: tensão em kV, vento de projeto em m/s, SIL em MW, altura em m, peso em kg.
  2. Enum de função só com suspensão e ancoragem (o levantamento não cita outras); valores novos entram por migration aditiva.
  3. "Tipo de isolador" como texto livre até existir o catálogo `DB_AIS`.
  4. Campos obrigatórios para pendência definidos no spec (todos os atributos de versão da série; estais e tabela de pesos não vazia no tipo de torre).
