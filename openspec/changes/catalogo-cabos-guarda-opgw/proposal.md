# Proposta: catalogo-cabos-guarda-opgw

## Why

O piloto de catálogos (cabos condutores, arquivado) validou o padrão de versionamento por vigência, módulo NestJS, feature Angular e rotina de implementação/QA. A fase F1 (M02) continua com o **segundo catálogo: cabos de guarda — aço galvanizado e OPGW** (abas `DB_CGA` e `DB_OPGW` da planilha), replicando o padrão do piloto e exercitando pela primeira vez a variação por **tipo** dentro de um mesmo catálogo — atributos comuns à família e atributos específicos de cada tipo.

## What Changes

- **Catálogo de cabos de guarda (família única com dois tipos):**
  - O levantamento (§05) modela cabo de guarda como uma entidade única com variantes (aço / OPGW / aço para tirante); a planilha consolida os quantitativos na mesma aba `CG`. Esta change implementa os tipos **aço** (`DB_CGA`) e **OPGW** (`DB_OPGW`); aço para tirante (`DB_CTI`) fica para change futura.
  - **Atributos comuns** (RF-07): código (único no catálogo), descrição, peso (ton/km), comprimento de bobina (m), diâmetro (mm), UTS (kN).
  - **Atributos do tipo aço** (`DB_CGA`): classe de galvanização, grau de resistência, número de fios.
  - **Atributos do tipo OPGW** (`DB_OPGW`): fabricante, I²t (kA²·s), número de fibras.
  - O **tipo pertence à identidade** do item (não muda entre versões); os demais atributos são versionados por vigência exatamente como no piloto (RNF-05, RF-10).
  - API REST no `apps/api` (CRUD, consulta da versão vigente por data, histórico, trilha de autoria RF-03), telas de manutenção no `apps/web` em pt-BR (listagem com busca e filtro por tipo, formulário com campos condicionais ao tipo, histórico) e contratos em `libs/domain`.
  - Sinalização de itens com dados obrigatórios ausentes por tipo (RF-11 parcial), distinguindo null de zero (RNF-09).
- **Reuso sem retrabalho:** o comportamento de `catalogos/versionamento-vigencia` (spec existente) se aplica integralmente — nenhum delta nesse spec; os helpers `civil-date.ts` e `effectiveness.ts` do módulo `catalogs` são reutilizados como estão.
- **Fora do escopo:** aço para tirante (`DB_CTI`); demais catálogos (torres, isoladores, solos, cargos, equipamentos); abstração "catálogo genérico" em código (segunda ocorrência do padrão — extração só na terceira, conforme regra registrada no design do piloto); importação/exportação Excel; formação de preço por commodity (RN-07) e incrementos de quantidade (RN-11), que pertencem aos módulos de cotação e quantitativos; autenticação (segue autor provisório via header `X-User`, dívida D6 do piloto).

Fase do roadmap: **F1 (M02, continuação)**. Requisitos cobertos: RF-07 (parcial: guarda de aço e OPGW), RF-10, RF-11 (parcial), RF-03; RNF-05, RNF-08, RNF-09, RNF-14.

## Capabilities

### New Capabilities

- `catalogos/cabos-guarda`: o catálogo de cabos de guarda (tipos aço e OPGW) — atributos comuns e por tipo, validações, manutenção (CRUD), busca com filtro por tipo, sinalização de pendências e histórico.

### Modified Capabilities

Nenhuma — `catalogos/versionamento-vigencia` já cobre o comportamento de versões/vigência e não muda; `catalogos/cabos-condutores` não é afetado.

## Impact

- **Código:** novos modelos Prisma + migration (aditiva); novos arquivos no módulo `apps/api/src/catalogs` (controller/service/DTOs de `ground-wires`); novos componentes na feature `apps/web/src/app/catalogs`; novos contratos em `libs/domain/src/lib/catalogs`.
- **Nomenclatura:** novos termos no mapa canônico do README (cabo de guarda → `GroundWire`/`ground_wire`/`ground-wires`, coerente com a sigla OPGW — *OPtical Ground Wire* —, além dos atributos por tipo).
- **Configuração/dependências:** nenhuma nova.
- **Premissas registradas:** (1) atributos de `DB_CGA`/`DB_OPGW` vêm do levantamento (§05) e ainda não foram confirmados com os autores da planilha (§02) — modelo aditivo tolera acréscimo de campos; (2) "resistência" de `DB_CGA` foi interpretada como **grau de resistência mecânica** (ex.: HS/EHS), armazenada como texto — a confirmar junto com a validação §02.
