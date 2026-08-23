# Proposta: convencao-codigo-ingles

## Why

Decisão do usuário sobre a convenção de idiomas do código: **identificadores, pastas, arquivos e nomes em inglês; comentários em português do Brasil**. A interface segue em pt-BR (RNF-14 trata do idioma da interface, não do código). O momento é o ideal: só existe um módulo de negócio implementado (piloto de cabos condutores) e nenhum consumidor externo da API — o custo da renomeação nunca será tão baixo quanto agora, e todas as changes futuras (demais catálogos M02/M03) já nascem na convenção definitiva.

## What Changes

- **Convenções registradas** (passam a valer para todas as changes): `openspec/config.yaml`, `README.md` e o agente `task-reviewer` atualizados — código/nomes em inglês, comentários em pt-BR, interface e mensagens ao usuário em pt-BR, cenários de specs e descrições de testes (`it(...)`) em pt-BR.
- **Libs renomeadas**: `libs/dominio` → `libs/domain` (`@lt-offers/domain`), `libs/motor-calculo` → `libs/calc-engine` (`@lt-offers/calc-engine`); `ValorDecimal` → `DecimalValue`, `GrafoDependencias` → `DependencyGraph`, políticas de arredondamento `'meio-para-cima'|'meio-para-par'` → `'half-up'|'half-even'`; tags de boundary `escopo:dominio|motor|app` → `scope:domain|engine|app`.
- **Banco de dados**: tabelas e colunas renomeadas por migration de **RENAME** (preserva dados): `cabo_condutor` → `conductor_cable`, `cabo_condutor_versao` → `conductor_cable_version`, colunas em inglês.
- **API** **BREAKING**: módulo `catalogos` → `catalogs`; rota `/api/catalogos/cabos-condutores` → `/api/catalogs/conductor-cables`; campos JSON em inglês (`pesoTonKm` → `weightTonPerKm` etc.); classes, métodos e DTOs em inglês. Mensagens de erro ao usuário permanecem em pt-BR. Sem consumidores externos — web e api mudam juntos.
- **Web**: pasta/feature `catalogos` → `catalogs`, componentes e identificadores em inglês, URLs do navegador em inglês (`/catalogs/conductor-cables`); todos os textos exibidos permanecem em pt-BR.
- **Fora do escopo**: qualquer mudança de comportamento observável na interface; specs existentes (escritos em pt-BR sobre comportamento, não sobre identificadores); artefatos históricos (reviews, qa, archive).

Fase do roadmap: transversal (convenção) — não corresponde a um módulo M; requisito relacionado: RNF-14 (interface pt-BR, preservada).

## Capabilities

### New Capabilities

Nenhuma. Refatoração pura de nomenclatura + atualização de convenções: nenhum comportamento observável pelo usuário muda (telas, mensagens, fluxos e regras idênticos). A change declara `skip_specs: true` em `.openspec.yaml`. A quebra da rota/payload da API é interna ao monorepo (web é o único consumidor e muda no mesmo commit).

### Modified Capabilities

Nenhuma — os specs de `catalogos/*` descrevem comportamento em prosa pt-BR e rótulos de interface, que não mudam.

## Impact

- **Código**: `prisma/schema.prisma` + 1 migration de rename; `apps/api/src/catalogos` → `catalogs`; `apps/web/src/app/catalogos` → `catalogs`; as duas libs renomeadas com import paths, `project.json`, jest `displayName` e `tsconfig.base.json` paths; `eslint.config.mjs` (tags).
- **Configuração**: `openspec/config.yaml`, `README.md`, `.claude/agents/task-reviewer.md`.
- **Dependências**: nenhuma nova.
- **Ordem recomendada**: arquivar `piloto-catalogo-cabos` (17/17, QA aprovado) antes de aplicar esta change, para que o sync dos specs ocorra sobre o estado que o QA validou.
- **Risco**: renomeação ampla sem mudança de comportamento — mitigada pela suíte existente (53 testes) e pelo script E2E do QA, que será adaptado e reexecutado como verificação final.
