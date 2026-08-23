# Proposta: fundacao-tecnica

## Why

O levantamento `requisitos-calculo-lt.md` define o sistema que substituirá a planilha Calculo LT, mas o repositório ainda não tem nenhum código: não há onde implementar a fase F1 do roadmap (catálogos corporativos, módulos M02/M03). Esta change cria a fundação técnica — monorepo, aplicações, biblioteca do motor de cálculo, persistência e CI — para que as changes de negócio subsequentes nasçam com estrutura, convenções e verificação automatizada já estabelecidas.

## What Changes

- Criação do monorepo **Nx** (workspace TypeScript) na raiz do repositório, com inicialização do git.
- App **frontend** em Angular (`apps/web`), em português do Brasil (RNF-14).
- App **backend** em NestJS (`apps/api`) com endpoint de health check.
- Lib **motor de cálculo** (`libs/motor-calculo`): TypeScript puro, sem dependência de Angular/NestJS ou de I/O, preparada para determinismo (RNF-04), aritmética decimal via `decimal.js` (RNF-08) e execução headless em suíte de testes (RNF-16). Nesta change a lib contém apenas a infraestrutura base (tipos de valor decimal, esqueleto do grafo de dependências) — nenhuma regra RN-xx é implementada.
- Lib **domínio compartilhado** (`libs/dominio`): tipos e contratos usados por frontend, backend e motor.
- **Prisma + PostgreSQL** configurados no backend, com migration inicial vazia/mínima e ambiente local via Docker Compose.
- **CI mínimo** (GitHub Actions): lint, testes e build em todo push/PR.
- Documentação de bootstrap (`README`): pré-requisitos, subir ambiente local, rodar testes.

Fase do roadmap: **passo zero, anterior à F1** — não corresponde a nenhum módulo M01..M12; é pré-requisito de todos.

Requisitos não funcionais que esta fundação viabiliza (sem implementá-los por completo): RNF-04 (determinismo), RNF-08 (precisão decimal), RNF-14 (idioma pt-BR), RNF-16 (testabilidade headless do motor).

## Capabilities

### New Capabilities

Nenhuma. Esta change é exclusivamente de tooling e scaffold: não introduz comportamento de negócio observável nem implementa requisitos funcionais (RF) ou regras de negócio (RN). Por isso a change declara `skip_specs: true` em `.openspec.yaml`. As primeiras capabilities (catálogos M02/M03) chegarão na change da fase F1.

### Modified Capabilities

Nenhuma — não existem specs anteriores.

## Impact

- **Código**: repositório passa de vazio para monorepo Nx com 2 apps e 2 libs.
- **Dependências novas**: Nx, Angular, NestJS, Prisma, decimal.js, Jest/Vitest, ESLint/Prettier, Docker Compose (Postgres local).
- **Sistemas**: nenhum sistema externo afetado; banco PostgreSQL apenas local nesta fase.
- **Decisões em aberto não resolvidas aqui**: autenticação corporativa e perfis (RNF-17, RF-64) ficam para change futura; nenhuma constante da planilha é incorporada (ressalva §02 do levantamento).
