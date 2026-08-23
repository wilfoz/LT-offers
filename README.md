# LT Offers — Orçamentação de Linhas de Transmissão

Aplicação web que substitui a planilha **Calculo LT** de orçamentação de
propostas EPC de linhas de transmissão. O levantamento completo de requisitos
— regras de negócio, requisitos funcionais e não funcionais, arquitetura-alvo
e roadmap — está em [`requisitos-calculo-lt.md`](./requisitos-calculo-lt.md).
O planejamento por mudança fica em [`openspec/`](./openspec/).

## Stack

| Camada           | Tecnologia                                        |
| ---------------- | ------------------------------------------------- |
| Frontend         | Angular (`apps/web`) — interface em pt-BR         |
| Backend          | NestJS (`apps/api`)                               |
| Banco de dados   | PostgreSQL 16 + Prisma 7                          |
| Motor de cálculo | TypeScript puro (`libs/motor-calculo`)            |
| Monorepo         | Nx (formato integrado: tsconfig paths + projetos) |

## Estrutura do workspace

```
apps/
  web/            Angular — apresentação
  api/            NestJS — API REST (GET /api/health)
libs/
  motor-calculo/  Motor determinístico: ValorDecimal (decimal.js),
                  grafo de dependências de cálculo. Sem framework, sem I/O.
  dominio/        Tipos e contratos compartilhados
prisma/           schema.prisma + migrations
```

As fronteiras entre projetos são **impostas por lint** (`@nx/enforce-module-boundaries`):
o motor só enxerga o domínio e não pode importar NestJS, Angular, Prisma nem
APIs de I/O ou de relógio (`Date.now`, `Math.random` são erro de lint no motor).

## Pré-requisitos

- **Node 22** (ver `.nvmrc`)
- **Docker** (para o Postgres local) — alternativa: um PostgreSQL 16 instalado
  localmente; ajuste `DATABASE_URL` no `.env`

## Subir o ambiente local

```bash
# 1. Dependências
npm ci

# 2. Variáveis de ambiente
cp .env.example .env        # PowerShell: Copy-Item .env.example .env

# 3. Banco de dados
docker compose up -d
npx prisma migrate dev
npx prisma generate

# 4. Aplicações
npx nx serve api            # http://localhost:3000/api/health
npx nx serve web            # http://localhost:4200
```

## Verificação

Comando canônico — o mesmo que o CI executa:

```bash
npx nx run-many -t lint test build
```

Testes de um projeto específico: `npx nx test motor-calculo` (ou `api`,
`web`, `dominio`). O CI (GitHub Actions) roda lint, testes e build dos
projetos afetados em todo push/PR, mais um job que valida as migrations
contra um Postgres real.

## Convenções

- Código de domínio, mensagens e interface em **português do Brasil** (RNF-14);
  termos técnicos de infraestrutura permanecem em inglês.
- Valores monetários **nunca** usam `number`/float: sempre `ValorDecimal`
  do motor, com política de arredondamento explícita (RNF-08).
- Toda regra de negócio implementada referencia seu ID (`RN-xx`) do documento
  de requisitos e tem testes próprios (§14).
- O motor de cálculo é determinístico (RNF-04): datas e qualquer entrada
  variável chegam sempre como parâmetro.
