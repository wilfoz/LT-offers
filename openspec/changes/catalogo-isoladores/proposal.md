# Proposta: catalogo-isoladores

## Why

O catálogo de isoladores (`DB_AIS`) é o quinto catálogo corporativo do M02 e a fonte dos dados de isolamento que o levantamento associa às cadeias de suspensão e ancoragem (tabela de entidades do §05: tipo, fabricante, perfil, ruptura, diâmetro, passo, linha de fuga). Ele também é a pendência registrada na change `catalogo-series-torres`: o campo "tipo de isolador" da série ficou como texto livre "até existir o catálogo `DB_AIS`". Como catálogo plano (sem hierarquia nem discriminador), ele é construído inteiramente sobre a base extraída em `catalogo-cabos-tirante` — e fecha a amostra de cinco catálogos com que a reavaliação da abstração (registrada nos designs anteriores) poderá ser feita.

## What Changes

- **Catálogo de isoladores (`DB_AIS`), construído sobre a base extraída:**
  - Catálogo plano, um par item + versões (precedente `GuyWire`), **sem discriminador de tipo na identidade**: o levantamento não enumera valores para "tipo" nem para "perfil", então ambos entram como texto livre na versão (premissa 2 abaixo) — sem enum, sem campos condicionais.
  - Atributos: código (obrigatório, único), descrição, tipo, fabricante, perfil, carga de ruptura (kN), diâmetro (mm), passo (mm), linha de fuga (mm).
  - Versionamento por vigência conforme `catalogos/versionamento-vigencia` (sem delta), trilha de autoria (RF-03), sinalização de pendências (RF-11 parcial) com null ≠ zero (RNF-09).
  - API REST em `/catalogs/insulators`, telas de manutenção em pt-BR (listagem com busca, formulário, histórico) sobre a casca Material/Swiss, contratos em `libs/domain`.
- **Reuso integral da base extraída** (patterns de validação da `domain`, helpers `catalogs/*` da API, mappers tipados contra a `domain`, `VersionedCatalogApi`/`form-utils` no web): a expectativa — critério de sucesso do design da extração — é o service ser "guy-wires com outros campos", sem nada reimplementado.
- **Fora do escopo:** vincular `StructureSeries.insulatorType` ao novo catálogo (segue texto livre; a vinculação por FK é change futura, quando houver decisão sobre migração dos valores já digitados); a reavaliação da abstração pós-5º catálogo (esta change fornece o dado, a reavaliação é trabalho próprio); demais catálogos M02/M03 (solos/fundações `DB_FUN`, cargos, equipamentos); importação Excel; quantitativos e regras RN-xx; a parte de RF-11 "impedir exclusão de item referenciado por oferta ativa" (não há ofertas); autenticação (segue `X-User`, dívida D6 do piloto).

Fase do roadmap: **F1 (M02, continuação)**. Requisitos cobertos: RF-10, RF-11 (parcial), RF-03; RNF-05, RNF-08, RNF-09, RNF-14. Observação: o M02 não tem RF dedicado ao `DB_AIS` — a cobertura vem da origem declarada do módulo (*DB_CAL · … · DB_AIS · DB_FUN*) e da tabela de entidades do §05 ("Isolador").

## Capabilities

### New Capabilities

- `catalogos/isoladores`: o catálogo de isoladores — atributos, validações, manutenção (CRUD), busca, sinalização de pendências e histórico.

### Modified Capabilities

Nenhuma — `catalogos/versionamento-vigencia` aplica-se integralmente ao novo catálogo sem delta; os catálogos existentes não mudam de comportamento (nenhum refit nesta change).

## Impact

- **Código:**
  - Modelos Prisma `Insulator`/`InsulatorVersion` + migration aditiva em `prisma/schema.prisma`.
  - API: `insulators.controller/service/module` + DTOs em `apps/api/src/catalogs/`, reusando `prisma-errors.ts`, `controller-shared.ts`, `effectiveness.ts` (`missingFields`) e `dto/validation-messages.ts`.
  - Web: componentes `insulator-list/form/history` + `InsulatorsApi` estendendo `VersionedCatalogApi` (sem override, como `GuyWiresApi`); rotas lazy em `catalogs.routes.ts`; item de menu na casca.
  - Domain: contratos `insulators.ts` em `libs/domain` (patterns de validação já existentes).
- **API observável:** apenas rotas novas (`/catalogs/insulators…`); nada existente muda.
- **Nomenclatura:** novos termos no mapa canônico do README (isolador → `Insulator`/`insulators`; perfil → `profile`; carga de ruptura (kN) → `ruptureStrengthKn`; passo (mm) → `spacingMm`; linha de fuga (mm) → `creepageDistanceMm`). `fabricante → manufacturer`, `diâmetro (mm) → diameterMm` e `tipo de isolador → insulatorType` já existem no mapa.
- **Configuração/dependências:** nenhuma nova.
- **Premissas registradas (hipóteses §02, modelo aditivo como nas changes anteriores):**
  1. Unidades inferidas e não confirmadas com os autores: ruptura em kN, diâmetro/passo/linha de fuga em mm.
  2. "Tipo" e "perfil" como texto livre (o levantamento não enumera valores; a planilha tem 49 colunas em `DB_AIS` e o resumo lista 7 atributos — enum viria de dados não levantados). Se valores fixos forem confirmados depois, a conversão texto → enum é change futura.
  3. Campo descrição incluído por consistência com os quatro catálogos anteriores (busca por código + descrição é o padrão da listagem), embora o levantamento não o cite para isolador.
  4. Campos obrigatórios para pendência: tipo, perfil, ruptura, diâmetro, passo e linha de fuga; fabricante e descrição fora (precedente dos cabos de guarda).
