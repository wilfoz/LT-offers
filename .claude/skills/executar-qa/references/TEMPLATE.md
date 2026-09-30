# Template — rodada de QA

Acrescente a rodada **no topo** de `Docs/tasks/concluido/qa.md`, logo abaixo do cabeçalho do arquivo,
separada da rodada anterior por `---`. Formato consolidado a partir das rodadas já registradas.

---

```markdown
# Rodada AAAA-MM-DD — <feature ou épico> (<BKL-###, BKL-###>)

> Escopo: branch `<branch>` (PR #<n>, commit `<sha curto>`) — spec `<feature>/spec.md` (`CA-1..CA-n`).
> <Uma linha de contexto: o QA rodou antes ou depois da review? sobre quais fixes?>

## Veredito da rodada

**APROVADO** | **APROVADO COM RESSALVAS** | **REPROVADO** — <um parágrafo: o que passou, o que ficou
bloqueado e por quê, e qual é a consequência prática para o merge/deploy.>

## 1. Resumo das execuções

| Suíte | Comando | Resultado | Evidência |
|---|---|---|---|
| <Backend unit — app> | `npx nx test <app>` | ✅ N/N suítes · N testes | `evidences/qa-AAAA-MM-DD-<assunto>.txt` |
| <Backend integração> | `npx nx affected -t test-int --parallel=1` | ✅ N/N | `evidences/...` |
| <Frontend + cobertura> | `npm run test:cov -w web` | ✅ N/N · St x ≥ y · Br … | `evidences/...` |
| <Lint / gate> | `npx nx affected -t lint typecheck depcruise test build --parallel=3` | ✅ / ⚠️ <n pré-existentes> | `evidences/...` |
| <Smoke de ambiente> | <comando> | ✅ <o que provou> | `evidences/...` |

> Falhas pré-existentes na `main` devem ser marcadas como tal, com a rodada em que já apareciam.

## 2. Checklist (critérios de aceitação × verificação)

### <Agrupamento: prioridade, tela ou task>

| CA | O que verifica | Como foi verificado | Resultado |
|---|---|---|---|
| CA-1 | <critério da spec> | <teste, suíte ou fluxo de navegador> | ✅ PASSOU |
| CA-2 | <critério> | <…> | ❌ FALHOU → bug #1 |
| CA-3 | <critério> | <…> | 🚫 BLOQUEADO (<motivo>) |
| CA-4 | <critério opcional da spec> | <…> | ➖ FORA DE ESCOPO (<onde está registrado>) |

### Edge cases da spec

| Caso | Verificação | Resultado |
|---|---|---|

## 3. Acessibilidade e responsividade

| Tela | Teclado | Rótulos | `alt` | Contraste | Formulários | Erros | Breakpoints | Evidência |
|---|---|---|---|---|---|---|---|---|

## 4. Bugs encontrados nesta rodada

### Bug 1 — <título>

- **Sintoma**: <o que o usuário vê>
- **Causa raiz**: <arquivo:linha e o porquê>
- **Correção**: <o que mudou, commit>
- **Teste de regressão**: <caminho do spec> — falha sem a correção
- **Status**: ✅ corrigido | 🚫 bloqueado por decisão do usuário

[Se nenhum: "Nenhum bug novo encontrado nesta rodada."]

## 5. Bloqueios e ressalvas

- <impedimento, dono e o que destrava>

## 6. Encerramento do ambiente

- Serviços subidos: <lista com portas>
- Encerrados: ✅ <como foi confirmado — portas liberadas, containers removidos>
```
