# Tasks: catalogo-cabos-guarda-opgw

## 1. Nomenclatura e modelo de dados

- [x] 1.1 Acrescentar ao mapa canônico do README os termos do design D5 (cabo de guarda → `GroundWire`/`ground_wire`/`ground-wires`, `GroundWireType`: `STEEL`|`OPGW`, `galvanizationClass`, `strengthGrade`, `wireCount`, `manufacturer`, `i2tKa2s`, `fiberCount`)
- [x] 1.2 Modelar no `schema.prisma` o enum `GroundWireType` e as tabelas `ground_wire` (código único + tipo na identidade) e `ground_wire_version` conforme design D1 — campos Decimal/específicos anuláveis para distinguir não informado de zero (RNF-09), `effective_from` como `@db.Date`, `@@unique([groundWireId, effectiveFrom])` — e gerar a migration
- [x] 1.3 Aplicar a migration no Postgres local e regenerar o Prisma Client, confirmando enum e tipos Decimal no client

## 2. Contratos compartilhados

- [ ] 2.1 Criar `libs/domain/src/lib/catalogs/ground-wires.ts` com o enum de tipo e os contratos de request/response (decimais como string, campos anuláveis), exportado pelo index da lib, seguindo o padrão de `conductor-cables.ts`

## 3. API de cabos de guarda

- [ ] 3.1 Criar `ground-wires.controller/service` no módulo `catalogs` do `apps/api` com endpoints do design D2: criar item com tipo (primeira versão), nova versão (tipo fixo — rejeitar tentativa de troca), listar vigentes com `?search=` e `?type=`, obter item com `?effectiveOn=`, histórico — datas resolvidas na borda com `civil-date.ts` (validação de calendário round-trip) e vigência via `effectiveness.ts`, sem alterá-los
- [ ] 3.2 Implementar DTOs com class-validator e mensagens em pt-BR: tipo obrigatório e restrito ao enum, numéricos como string decimal positiva, `wireCount`/`fiberCount` inteiros positivos, `null` para não informado; validação de aplicabilidade por tipo no service (campo do outro tipo → 400 apontando o campo)
- [ ] 3.3 Aplicar os padrões herdados das reviews do piloto (design D3): `P2002` → 409 no create, `ParseIntPipe` com `exceptionFactory` pt-BR, um único decorador HTTP por método, `pendingFields` calculado por tipo (comuns + específicos obrigatórios; `manufacturer`/`description` fora), autor via `X-User` com fallback `"sistema"`
- [ ] 3.4 Escrever testes do service e do controller cobrindo os cenários do spec `cabos-guarda`: criação por tipo, código duplicado entre tipos, tipo inválido, troca de tipo rejeitada, campo do outro tipo rejeitado, contagens não inteiras, filtro por tipo, pendências por tipo, histórico
- [ ] 3.5 Verificar os endpoints ao vivo contra o Postgres do Compose (criar aço e OPGW, nova versão, listar com `search`+`type`, `effectiveOn` em data passada, histórico)

## 4. Interface de manutenção

- [ ] 4.1 Criar os componentes `ground-wire-list/-form/-history` na feature `catalogs` do `apps/web`, com rotas lazy sob `/catalogs/ground-wires` e navegação a partir da página inicial
- [ ] 4.2 Implementar a listagem com busca, filtro por tipo (todos/aço/OPGW) e sinalização de pendências por tipo, com callback de erro em todo subscribe de leitura (review grupo-4)
- [ ] 4.3 Implementar o formulário com seleção de tipo travada após a criação e bloco de campos específicos condicional ao tipo, branco→null via `orNull` com aviso (RNF-09), validação pt-BR espelhando a API
- [ ] 4.4 Implementar a tela de histórico exibindo também os atributos específicos do tipo; vigência com `date: 'dd/MM/yyyy' : 'UTC'` e `createdAt` sem timezone
- [ ] 4.5 Escrever testes de componente cobrindo filtro por tipo, campos condicionais do formulário, payload com `null`, pendências e histórico

## 5. QA e fechamento

- [ ] 5.1 Executar a skill `/executar-qa` para a change: validar cada cenário do spec com evidências, corrigir bugs na causa raiz com testes de regressão, gerar `qa.md`
- [ ] 5.2 Rodar a suíte completa (`npx nx run-many -t lint test build` e `npx nx format:check`) limpa e confirmar o CI verde no push
