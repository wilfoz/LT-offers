# Design: fundacao-tecnica

## Context

Ver `proposal.md — Why`. O repositório hoje contém apenas o levantamento de requisitos e a estrutura do OpenSpec; não há código nem git inicializado. As restrições que moldam este design vêm da arquitetura-alvo do levantamento (§12): separação dado/regra/apresentação, motor determinístico com aritmética decimal e testável sem interface, e catálogos futuros versionados por vigência. Ambiente de desenvolvimento primário: Windows 11.

## Goals / Non-Goals

**Goals:**

- Workspace onde a fronteira do motor de cálculo é **imposta por ferramenta** (lint de boundaries), não por convenção verbal.
- Toda change futura encontra pronto: geração de código (Nx generators), testes, lint, migrations e CI.
- Ambiente local reproduzível em um comando (Docker Compose para o Postgres).

**Non-Goals:**

- Nenhuma regra RN-xx, requisito RF-xx ou modelo de dados de negócio (nem esboço de tabelas de catálogo — isso é da change F1).
- Autenticação, autorização e perfis (RNF-17, RF-64) — change futura dedicada.
- Deploy/infra de produção; CI cobre apenas verificação de qualidade.

## Decisions

### D1 — Workspace Nx integrado, npm como package manager

Nx no modo integrado (single `package.json` na raiz, tsconfig paths para as libs), gerado com os plugins oficiais `@nx/angular` e `@nx/nest`. *(Confirmado na implementação: o preset `ts` do Nx 23 gera o setup de project references, que o Angular não suporta — o workspace foi criado a partir do template `angular-monorepo`, que produz exatamente o modo integrado clássico deste design.)* **npm** como package manager: menor atrito no Windows e zero configuração extra; pnpm fica como otimização futura se o install pesar. Alternativa considerada: repositórios separados front/back — rejeitada porque o motor e o domínio precisam ser compartilhados com type-safety entre API e web, e a paridade numérica (§14) pede uma suíte única.

### D2 — Layout do workspace

```
apps/
  web/            Angular (interface pt-BR)
  api/            NestJS (REST; health check nesta change)
libs/
  motor-calculo/  TS puro: tipos decimais, esqueleto do grafo de dependências
  dominio/        tipos e contratos compartilhados (sem lógica)
prisma/           schema.prisma + migrations (escopo do app api)
docker-compose.yml  Postgres 16 local
```

Nomes de projeto em pt-BR onde são conceito de domínio (`motor-calculo`, `dominio`) e em inglês onde são infraestrutura genérica (`web`, `api`) — coerente com RNF-14 sem traduzir jargão técnico.

### D3 — Fronteiras impostas por lint

Regra `@nx/enforce-module-boundaries` com tags:

- `escopo:motor` (`motor-calculo`) só pode depender de `escopo:dominio`. Proibido importar de apps, NestJS, Angular ou qualquer módulo de I/O (fs, http, Prisma).
- `escopo:dominio` não depende de ninguém.
- `apps` podem depender de qualquer lib.

É isso que materializa RNF-16 (motor headless) como erro de build, e não como intenção. Alternativa: disciplina de code review — rejeitada por ser exatamente o modo de falha da planilha (regra sem enforcement).

### D4 — Aritmética decimal: `decimal.js`

`decimal.js` como dependência do `motor-calculo`, com um wrapper próprio (`ValorDecimal` ou similar) exportado pelo motor, para que o resto do sistema nunca importe `decimal.js` diretamente — isola a biblioteca e dá ponto único para política de arredondamento (RNF-08). Alternativas: `big.js` (API menor, sem configuração de precisão suficiente para tributos encadeados) e `bigint` escalado (performático, mas ergonomia ruim para 26 regras de negócio). Prisma usa `Decimal` nativo (`@prisma/client` já embute decimal.js), o que mantém uma só semântica ponta a ponta.

### D5 — Determinismo como contrato de teste desde o dia zero

O esqueleto do motor já nasce com dois testes-sentinela: (1) mesma entrada ⇒ mesmo resultado byte a byte em execuções repetidas; (2) nenhuma API de tempo/aleatoriedade (`Date.now`, `Math.random`) referenciada no código do motor — verificado por regra de lint (`no-restricted-globals`/`no-restricted-imports`) no escopo `escopo:motor`. Isso ancora RNF-04 antes de existir qualquer regra de negócio; datas serão sempre parâmetro de entrada.

### D6 — Prisma com migration inicial mínima

`schema.prisma` apontando para o Postgres do Compose, com uma única tabela de infraestrutura (`_healthcheck` ou equivalente) apenas para provar o ciclo migrate → generate → query no CI. Nenhuma entidade de negócio. Alternativa: já esboçar tabelas de catálogo — rejeitada; o modelo de dados de M02/M03 merece design próprio na change F1.

### D7 — Testes com os defaults dos generators, CI com GitHub Actions + `nx affected`

Adotar os defaults dos generators para minimizar manutenção. *(Atualizado na implementação: no Nx 23 o default do Angular passou a ser Vitest; o resultado é Vitest no `web` e Jest no `api` e nas libs — a racional se mantém.)* CI em GitHub Actions (o repositório já tem `.github/`): workflow único com `nx affected -t lint,test,build` em push/PR, mais um job com serviço Postgres para validar `prisma migrate deploy`. Node 22 LTS fixado via `.nvmrc`/`engines`.

### D8 — Git inicializado nesta change

O diretório ainda não é repositório git. A primeira task inicializa o git com `.gitignore` adequado (node_modules, dist, .env) — pré-requisito do CI e do próprio Nx (`nx affected` depende de git).

## Risks / Trade-offs

- [Versões de Angular/Nx/NestJS avançam rápido e o scaffold pode nascer desatualizado] → usar as últimas versões estáveis no momento da implementação via `create-nx-workspace@latest`, sem fixar versões neste design; o lockfile passa a ser a verdade.
- [decimal.js pode ser gargalo quando o motor crescer (RNF-01: recálculo < 30 s)] → o wrapper do D4 isola a biblioteca; se benchmark futuro reprovar, troca-se a implementação interna sem tocar os consumidores. Medir só quando houver cálculo real — não otimizar agora.
- [Docker no Windows como pré-requisito pode travar dev sem Docker Desktop] → documentar alternativa no README: apontar `DATABASE_URL` para um Postgres instalado localmente; nada no código depende do Compose em si.
- [Monorepo integrado acopla upgrades (uma versão de TS para tudo)] → aceito deliberadamente: consistência vale mais que independência nesta escala de equipe; Nx suporta migração assistida (`nx migrate`).
- [skip_specs nesta change pode virar precedente para pular specs em changes de negócio] → o proposal registra explicitamente que a próxima change (F1) volta ao fluxo completo com capabilities.

## Migration Plan

Greenfield — não há dados nem usuários a migrar. Ordem segura: git init → workspace Nx → apps → libs → boundaries → Prisma/Compose → CI → README. Rollback de qualquer passo é apagar o que ele criou; nada externo é provisionado.

## Open Questions

- Nome definitivo do produto (afeta apenas branding no `web` e o nome do pacote raiz; pode ser decidido em qualquer change futura sem retrabalho estrutural).
