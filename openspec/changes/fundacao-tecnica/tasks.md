# Tasks: fundacao-tecnica

## 1. Repositório e workspace

- [x] 1.1 Inicializar git na raiz com `.gitignore` para Node/Nx/Prisma (node_modules, dist, .nx, .env) e fazer o commit inicial com o conteúdo existente (requisitos, openspec, ref)
- [x] 1.2 Criar o workspace Nx integrado na raiz com `create-nx-workspace@latest` (preset TypeScript, npm), Node 22 LTS fixado em `.nvmrc` e `engines` do `package.json`
- [x] 1.3 Configurar Prettier e ESLint na raiz conforme defaults do Nx, verificando que `npx nx format:check` e lint rodam limpos

## 2. Aplicações

- [x] 2.1 Gerar o app `apps/api` com `@nx/nest`, com endpoint `GET /health` retornando status e versão; teste unitário do endpoint passando
- [x] 2.2 Gerar o app `apps/web` com `@nx/angular`, com página inicial mínima em português do Brasil (RNF-14); teste unitário default passando
- [x] 2.3 Verificar `nx serve api` e `nx serve web` subindo localmente sem erros

## 3. Bibliotecas e fronteiras

- [x] 3.1 Gerar a lib `libs/dominio` (TS puro, tag `escopo:dominio`) com um tipo/contrato placeholder exportado
- [x] 3.2 Gerar a lib `libs/motor-calculo` (TS puro, tag `escopo:motor`) com `decimal.js` como dependência e o wrapper `ValorDecimal` expondo criação, soma, multiplicação e arredondamento com política explícita (design D4, RNF-08)
- [x] 3.3 Implementar o esqueleto do grafo de dependências no motor: tipos de nó/aresta e ordenação topológica mínima, sem regra de negócio (arquitetura §12)
- [x] 3.4 Configurar `@nx/enforce-module-boundaries` com as tags do design D3 e provar com um teste de lint que import de NestJS/Prisma dentro de `motor-calculo` falha o build
- [x] 3.5 Adicionar regra de lint no escopo `escopo:motor` proibindo `Date.now`, `new Date` sem argumento e `Math.random` (design D5, RNF-04)
- [x] 3.6 Escrever os testes-sentinela de determinismo do motor: mesma entrada produz resultado idêntico em execuções repetidas (design D5)

## 4. Persistência

- [x] 4.1 Criar `docker-compose.yml` com Postgres 16, volume nomeado e variáveis em `.env.example` (nunca `.env` versionado)
- [x] 4.2 Configurar Prisma no `apps/api` (`schema.prisma`, `DATABASE_URL`) com a migration inicial mínima do design D6
- [x] 4.3 Integrar o ciclo completo: `prisma migrate dev` + `prisma generate` + query de health do banco exposta no `GET /health`; testar contra o Postgres do Compose

## 5. CI

- [ ] 5.1 Criar workflow GitHub Actions com `nx affected -t lint,test,build` em push/PR, cache de npm e do Nx
- [ ] 5.2 Adicionar job com serviço Postgres validando `prisma migrate deploy` e os testes que tocam banco
- [ ] 5.3 Confirmar o workflow verde em um push real (ou via `act`/execução local documentada, se o remoto ainda não existir)

## 6. Documentação e fechamento

- [ ] 6.1 Escrever `README.md`: pré-requisitos (Node 22, Docker ou Postgres local), subir ambiente, rodar testes, estrutura do workspace e link para `requisitos-calculo-lt.md`
- [ ] 6.2 Rodar a suíte completa (`nx run-many -t lint,test,build`) limpa e registrar no README o comando canônico de verificação
