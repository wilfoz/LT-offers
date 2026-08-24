# Review dos Grupos 2–5 (consolidado)

**Revisor**: AI Code Reviewer (executado inline — o agente task-reviewer atingiu o limite de sessão; mesmas verificações aplicadas)
**Data**: 2026-08-23
**Change / Grupos**: convencao-codigo-ingles / grupos 2 a 5

## Resumo

Renomeação pt-BR → inglês em libs, banco, API e web, sem mudança de comportamento. Verificações executadas: grep amplo por identificadores antigos em código ativo, consistência com o mapa de nomenclatura do README entre todas as camadas (schema ↔ API ↔ domain ↔ web ↔ script E2E), e `npx nx run-many -t lint test build` (verde nos 4 projetos, 60 testes).

## Problemas Encontrados

### ⛔ Críticos

Nenhum.

### 🟡 Major

1. **Sobra de nomenclatura no schema**: o modelo `VerificacaoSaude` (tabela `verificacao_saude`, coluna `criado_em`) da change fundacao-tecnica permaneceu em pt-BR — o escopo das tasks citava apenas o catálogo. **Corrigido no próprio review**: renomeado para `HealthCheck`/`health_check`/`created_at` com migration de RENAME (`20260823213000_rename_health_check`), aplicada e verificada.

### 🟢 Minor

1. Comentário em `apps/api/src/catalogs/effectiveness.ts` referencia o caminho de spec `catalogos/versionamento-vigencia` — **não é violação**: os specs OpenSpec permanecem em pt-BR por convenção, e o caminho citado é o real.

## Verificações de consistência (sem problemas)

- Grep por `CaboCondutor|vigenciaInicio|criadoPor|versaoVigente|camposPendentes|pesoTonKm|ValorDecimal|GrafoDependencias|escopo:|catalogos|cabos-condutores|busca=|vigenteEm` em `apps/`, `libs/` e `prisma/`: zero ocorrências em identificadores ativos após a correção acima.
- Mesmo termo → mesmo nome em todas as camadas (ex.: `effectiveFrom` no schema (`effective_from`), no client Prisma, nos DTOs, no domain, no web e no script E2E).
- Textos de interface conferidos em pt-BR (rótulos, mensagens de erro, pendências) — nenhuma tradução acidental para inglês (RNF-14 preservado).
- Descrições de testes (`describe`/`it`) em pt-BR, identificadores em inglês — 60 testes, nenhum removido ou com asserção enfraquecida na tradução (comparação 1:1 com os specs anteriores).
- Dados do banco preservados pelas migrations de RENAME (verificado com SELECT após cada uma).

## Veredito

**APROVADO** (major corrigido no ato). Prosseguir para o grupo 6 (verificação final com E2E).
