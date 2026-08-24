# Proposta: catalogo-cabos-tirante

## Why

O terceiro catálogo de cabos — **aço para tirante** (`DB_CTI`) — completa o RF-07 e dispara a **regra das três ocorrências** registrada no design do piloto: com dois precedentes reais (`conductor-cables` e `ground-wires`), o que é mecânico e comprovadamente estável no padrão de catálogo é extraído para bases compartilhadas **antes** de construir o terceiro, em vez de criar uma terceira cópia. As dívidas a quitar foram registradas nas reviews da change anterior: patterns de validação triplicados, helpers duplicados na API, retornos de service sem tipo contra os contratos da `domain` e `conductor-cables` sem consumir a `domain`.

## What Changes

- **Extração do padrão de catálogo (dívidas da regra das três ocorrências, sem mudança de comportamento observável):**
  - Patterns de validação (`decimal positivo`, `inteiro positivo`, `data AAAA-MM-DD`) extraídos para `libs/domain` e consumidos por API (DTOs) e web (forms) — hoje triplicados.
  - Helpers duplicados da API unificados no módulo `catalogs`: violação de unicidade do Prisma (`P2002`), cálculo genérico de campos pendentes por mapa de rótulos, `IdPipe`/autor/data de referência/rejeição de alteração de versão dos controllers.
  - Services passam a **retornar os contratos da `domain`** (mapeando `Prisma.Decimal`→string e datas→ISO na borda do service) — `conductor-cables` torna-se consumidor da `domain` e some o vazamento de campos internos (FKs) nas respostas.
  - Web: base genérica do serviço de API de catálogo versionado e utilitários de formulário (`orNull`/`intOrNull`) compartilhados.
  - **Fora da extração:** componentes Angular e controllers/services NestJS continuam um por catálogo (composição por convenção); nenhuma abstração de UI genérica.
- **Catálogo de cabos de aço para tirante (`DB_CTI`), construído sobre a base extraída:**
  - Catálogo próprio, **sem discriminador de tipo** (decisão do usuário): tirante não é cabo de guarda — a planilha o consolida em aba própria (`Tirantes`) e o RF-23 o quantifica separadamente; o glossário (§15) o define como cabo de aço que estaia a torre.
  - Atributos (RF-07 + família de aço do §05): código (único), descrição, peso (ton/km), bobina (m), diâmetro (mm), UTS (kN), classe de galvanização, grau de resistência, número de fios.
  - Versionamento por vigência conforme `catalogos/versionamento-vigencia` (sem delta), trilha de autoria (RF-03), sinalização de pendências (RF-11 parcial, null ≠ zero RNF-09).
  - API REST em `/catalogs/guy-wires`, telas de manutenção em pt-BR (listagem com busca, formulário, histórico) e contratos em `libs/domain`.
- **Fora do escopo:** demais catálogos M02/M03 (torres, isoladores, solos, cargos, equipamentos); importação Excel; quantitativos de tirantes (RF-23) e regras RN-xx de cálculo; autenticação (segue `X-User`, dívida D6 do piloto); refactor dos componentes Angular existentes além do necessário para consumir o que foi extraído.

Fase do roadmap: **F1 (M02, continuação)**. Requisitos cobertos: RF-07 (completa a família de cabos: condutor, guarda de aço, OPGW, aço para tirante), RF-10, RF-11 (parcial), RF-03; RNF-05, RNF-08, RNF-09, RNF-14.

## Capabilities

### New Capabilities

- `catalogos/cabos-tirante`: o catálogo de cabos de aço para tirante — atributos, validações, manutenção (CRUD), busca, sinalização de pendências e histórico.

### Modified Capabilities

Nenhuma — a extração preserva o comportamento observável de `catalogos/cabos-condutores` e `catalogos/cabos-guarda` (mesmas rotas, validações, mensagens e regras); `catalogos/versionamento-vigencia` aplica-se integralmente ao novo catálogo sem delta.

## Impact

- **Código:**
  - Extração: `libs/domain` (patterns de validação; contratos passam a ser o tipo de retorno dos services), `apps/api/src/catalogs/*` (helpers compartilhados; refit de `conductor-cables.*` e `ground-wires.*`), `apps/web/src/app/catalogs/*` (base de API service e utilitários de form; refit dos serviços/forms existentes).
  - Catálogo novo: modelos Prisma `GuyWire`/`GuyWireVersion` + migration aditiva; `guy-wires.*` na API; componentes `guy-wire-*` no web; contratos `guy-wires.ts` na `domain`.
- **API observável:** rotas e comportamentos existentes preservados; dois efeitos colaterais aceitos do refit, ambos alinhando às interfaces já publicadas na `domain` (que o web já usa; nenhum consumidor conhecido é afetado): (1) as respostas param de expor FKs internas (`conductorCableId`/`groundWireId` nas versões); (2) o envelope do POST de criação passa a ser o `Summary` do item (versão criada como vigente + `pendingFields`) em vez da linha item+versões do Prisma — o web tipa a resposta como `unknown` e não a lê.
- **Nomenclatura:** novos termos no mapa canônico do README (tirante → `GuyWire`/`guy_wire`/`guy-wires`).
- **Configuração/dependências:** nenhuma nova.
- **Premissas registradas:** (1) atributos de `DB_CTI` inferidos do levantamento (§05, família de aço) e não confirmados com os autores (§02) — modelo aditivo; (2) `DB_CTI` cobre "tirantes e interligação" — o catálogo único atende ambos os usos, sem campo distintivo nesta change; (3) campos obrigatórios para pendência espelham o tipo aço do catálogo de cabos de guarda (comuns + galvanização/grau/fios).
