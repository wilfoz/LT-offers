# Design: piloto-catalogo-cabos

## Context

Ver `proposal.md — Why`. A fundação (change `fundacao-tecnica`, arquivada) entregou o monorepo com `apps/api` (NestJS + Prisma 7/Postgres), `apps/web` (Angular), fronteiras por lint e CI. Este é o primeiro código de negócio; as decisões de modelagem aqui viram o precedente dos demais catálogos M02/M03. Os requisitos de comportamento estão nos dois specs da change.

## Goals / Non-Goals

**Goals:**

- Padrão de versionamento por vigência reutilizável pelos próximos catálogos sem retrabalho de modelo.
- Padrão de módulo NestJS e de feature Angular que os catálogos seguintes copiam.
- Rotina de implementação (ref/) operacional a partir desta change.

**Non-Goals:**

- Generalizar prematuramente: nenhuma abstração "catálogo genérico" em código — o padrão é por convenção e será extraído quando o segundo catálogo existir (regra das três ocorrências).
- Autenticação: o autor da trilha vem de um cabeçalho/config provisório até a change de autenticação (registrado como dívida).
- Importar dados reais da planilha (fase de migração de dados própria).

## Decisions

### D1 — Modelo de dados: item + versões, vigência por data

Duas tabelas: `cabo_condutor` (identidade: id, código único) e `cabo_condutor_versao` (dados versionados: peso, bobina, diâmetro, UTS, `vigencia_inicio`, `criado_por`, `criado_em`, FK ao item). A versão vigente para uma data D é a de maior `vigencia_inicio <= D`. Campos numéricos em `Decimal` do Prisma (RNF-08). Alternativa considerada — coluna `vigencia_fim` materializada: rejeitada; intervalo fechado-aberto derivado da próxima versão evita atualização em duas linhas e estados inconsistentes. Editar = inserir nova versão; `UPDATE` em versão existente não é exposto pela API.

### D2 — Consulta com data de referência como parâmetro explícito

Endpoints de leitura aceitam `?vigenteEm=YYYY-MM-DD`; sem o parâmetro, a API usa a data atual **na borda** (controller) e a repassa como argumento — nenhuma camada interna lê o relógio, coerente com o contrato de determinismo do motor (RNF-04) que futuramente consumirá esses catálogos.

### D3 — Módulo NestJS `catalogos` com validação class-validator

`apps/api/src/catalogos/` com controller/service/DTOs do cabo condutor. Validação com `class-validator` + `ValidationPipe` global (mensagens em pt-BR nos DTOs). Valores decimais trafegam como **string** no JSON (evita float na serialização; o Angular exibe/edita como texto com máscara). Alternativa — números JSON: rejeitada por violar RNF-08 na borda.

### D4 — Feature Angular `catalogos` com standalone components e signals

`apps/web/src/app/catalogos/` com rota `/catalogos/cabos-condutores`: listagem (busca, sinalização de pendência), formulário de criação/edição (nova versão) e histórico. Componentes standalone + signals (padrão Angular atual), `HttpClient` direto — sem NgRx nesta escala. Pendência (RNF-09): o formulário distingue campo vazio (não informado) de `0` digitado; o DTO transporta `null` para não informado.

### D5 — Rotina de implementação: guidance no OpenSpec + agente + skill

- `openspec/config.yaml` ganha `operations.apply.guidance` com o ciclo por task de `ref/execute_task.md` adaptado: entender a task e dependências → plano curto → implementar → rodar o agente `task-reviewer` ao concluir cada **grupo** de tasks (por task seria proibitivo) → corrigir apontamentos antes de marcar o grupo como completo → commit por grupo.
- `ref/execute_qa.md` vira a skill `.claude/skills/executar-qa/SKILL.md`, com caminhos adaptados ao OpenSpec: PRD/TechSpec → `proposal.md` + `specs/` da change; critérios de aceitação → cenários dos specs; evidências em `openspec/changes/<change>/qa/evidences/`; relatório `qa.md` na pasta da change. Invocada manualmente ao fim da implementação, antes do archive.
- Alternativa considerada — hook automático: rejeitada; o guidance do OpenSpec já é injetado em todo `/opsx:apply` sem custo de infraestrutura, e QA é por change, não por task.

### D6 — Autor provisório da trilha

`criado_por` vem do cabeçalho `X-Usuario` quando presente, senão `"sistema"`. Documentado como provisório; a change de autenticação (RNF-17) o substituirá pelo usuário autenticado sem mudança de modelo.

## Risks / Trade-offs

- [Modelo de vigência errado vira precedente para todos os catálogos] → é exatamente o motivo do piloto: validar com um catálogo antes de replicar; o spec `versionamento-vigencia` fixa o contrato observável, não o schema.
- [Decimal como string no JSON pode surpreender consumidores futuros] → documentar no README do módulo; o motor de cálculo consome via `ValorDecimal.de(string)`, que é o caminho natural.
- [Guidance por grupo (não por task) pode deixar defeito passar entre tasks do mesmo grupo] → aceito; o QA da change (skill) cobre o todo antes do archive.
- [Atributos de DB_CAL não confirmados com os autores (§02)] → modelo aditivo: acrescentar coluna nova em `cabo_condutor_versao` é migration trivial; nada no código depende de lista fechada de campos.

## Migration Plan

Aditivo: nova migration Prisma (duas tabelas), novo módulo na API, nova rota no web. Nada existente muda; rollback = reverter a migration e remover os módulos. Ordem: rotina (grupo 0) → modelo/migration → API → UI → QA da change.

## Open Questions

- Unidade de exibição do UTS (kN vs kgf) na tela — o levantamento usa "carga de ruptura" sem unidade explícita em `DB_CAL`; adotar kN e confirmar com os autores junto com a validação §02 (não muda modelo nem tasks: campo é Decimal com rótulo).
