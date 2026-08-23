# Proposta: piloto-catalogo-cabos

## Why

A fundação técnica está pronta e a fase F1 do roadmap (catálogos corporativos, módulos M02/M03) precisa começar. Em vez de atacar todos os catálogos de uma vez, esta change implementa **um catálogo piloto de ponta a ponta — cabos condutores (`DB_CAL`)** — para estabelecer os padrões que os demais catálogos replicarão: versionamento por vigência (RNF-05), API NestJS, telas de manutenção Angular e testes. Também incorpora ao fluxo de trabalho a rotina de implementação e QA definida em `ref/` (execução de task com review e QA com evidências), que passa a valer para esta e para as próximas changes.

## What Changes

- **Rotina de implementação (setup, uma vez):**
  - Guidance de operação no `openspec/config.yaml` (`operations.apply.guidance`) codificando o ciclo por task de `ref/execute_task.md`: analisar → planejar → implementar → revisar com o agente `task-reviewer` → corrigir → marcar → commitar.
  - Skill `/executar-qa` criada a partir de `ref/execute_qa.md`, adaptada aos caminhos do OpenSpec (change em vez de `tasks/prd-*/`; proposal/specs em vez de PRD/TechSpec), para validação da change completa antes do archive.
- **Catálogo de cabos condutores (piloto F1):**
  - Modelo de dados com **versionamento por vigência**: itens de catálogo têm versões com data de início de vigência; versões vigentes em ofertas fechadas nunca são alteradas (RNF-05, RF-10).
  - Atributos do domínio (§05 do levantamento, `DB_CAL`): código, descrição, peso (ton/km), comprimento de bobina, diâmetro, UTS (carga de ruptura).
  - API REST no `apps/api` com CRUD, consulta da versão vigente por data e trilha de autor/data da última alteração (RF-03).
  - Telas de manutenção no `apps/web` em pt-BR: listagem com busca, criação/edição com validação, histórico de versões.
  - Sinalização de itens com dados obrigatórios ausentes (RF-11, parcial — bloqueio de exclusão referenciada por oferta fica para quando existirem ofertas).
- **Fora do escopo:** demais catálogos (torres, solos, isoladores, cargos, equipamentos — replicam este padrão em changes seguintes), importação/exportação Excel, autenticação e perfis (RNF-17), qualquer regra de cálculo RN-xx.

Fase do roadmap: **F1 (parcial — piloto de M02)**. Requisitos cobertos: RF-07 (parcial: condutores), RF-10, RF-11 (parcial), RF-03; RNF-05, RNF-08 (Decimal nos campos numéricos), RNF-14.

## Capabilities

### New Capabilities

- `catalogos/versionamento-vigencia`: comportamento comum de versionamento de catálogos por vigência — criação de versões, imutabilidade de versões vigentes referenciadas, resolução da versão vigente para uma data.
- `catalogos/cabos-condutores`: o catálogo de cabos condutores — atributos, validações, manutenção (CRUD), busca e histórico.

### Modified Capabilities

Nenhuma — estes são os primeiros specs do projeto.

## Impact

- **Código:** novas entidades Prisma + migration; módulo `catalogos` no `apps/api`; feature `catalogos` no `apps/web`; tipos em `libs/dominio`.
- **Configuração:** `openspec/config.yaml` (guidance de apply); nova skill em `.claude/skills/executar-qa/`.
- **Dependências:** nenhuma nova prevista (Prisma Decimal já disponível; validação com class-validator do próprio NestJS, a confirmar no design).
- **Premissa registrada:** os atributos de `DB_CAL` vêm do levantamento (§05) e ainda não foram confirmados com os autores da planilha (§02) — o modelo deve tolerar acréscimo de campos.
