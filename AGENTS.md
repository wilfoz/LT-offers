# AGENTS.md — contrato de trabalho neste repositório

Ponto de entrada único para agentes de IA (Claude Code, Copilot, Codex) e para quem está chegando agora.
Este arquivo **não duplica** o [README.md](README.md) nem `Docs/.specs/codebase/` — ele aponta e define o
**contrato**: onde está o quê, o que é fonte de verdade e quando uma task está pronta.

## Onde está o quê

| Preciso de… | Vá para |
|---|---|
| Setup do ambiente, stack, comandos completos | [README.md](README.md) |
| **Escopo de uma feature (fonte de verdade)** | `Docs/.specs/features/<feature>/spec.md` |
| Backlog e índice de tasks | [Docs/tasks/tasks.md](Docs/tasks/tasks.md) |
| Task pendente / concluída | `Docs/tasks/analise/BKL-###.md` → `Docs/tasks/concluido/BKL-###.md` |
| Produto, requisitos de negócio | [Docs/PRD.json](Docs/PRD.json) |
| Arquitetura, convenções, testes | [ARCHITECTURE.md](Docs/.specs/codebase/ARCHITECTURE.md) · [CONVENTIONS.md](Docs/.specs/codebase/CONVENTIONS.md) · [TESTING.md](Docs/.specs/codebase/TESTING.md) |
| Decisões arquiteturais | [Docs/adr/](Docs/adr/) |
| Diagramas, índice geral da doc | [Docs/_index.md](Docs/_index.md) |

**Regra de precedência:** quando a spec da feature e o PRD divergirem, a `spec.md` vence — e a divergência
deve ser registrada na task. Quando o código e a spec divergirem, **pare e pergunte**; não normalize a
divergência em silêncio.

## Fluxos

| Comando | Quando |
|---|---|
| `/task [BKL-###]` | Implementar uma task do backlog |
| `/executar-qa --feature <slug>` | Validar uma feature/épico contra os critérios de aceitação |
| `@task-reviewer` | Revisar uma task concluída (chamado pelo `/task`, passo 7) |

## Definition of Done

Uma task só está concluída quando **todos** os itens abaixo são verdadeiros.

1. **Escopo conferido** — a `spec.md` da feature foi lida e o que foi implementado corresponde a ela.
   Desvios são registrados no arquivo da task, não escondidos.
2. **Implementação sem gambiarra** — causa raiz, não sintoma; segue [CONVENTIONS.md](Docs/.specs/codebase/CONVENTIONS.md),
   incluindo os limites de código da seção *Limites de código*.
3. **Testes** — todo comportamento novo tem teste; todo bug corrigido tem um teste de regressão que
   **falha sem a correção**.
4. **Gate local verde — espelho exato do [ci.yml](.github/workflows/ci.yml)**, rodado da raiz antes do push:

   ```bash
   npx nx affected -t lint typecheck depcruise test build --parallel=3
   ```

   E, se a mudança tocou repositório, schema Prisma, controller ou mensageria (exige Docker):

   ```bash
   npx nx affected -t test-int test-e2e --parallel=1
   ```

   > Rodar a suíte inteira do app afetado, não só os arquivos que você mexeu: um mock quebrado ou um erro
   > de tipo em outro arquivo só aparece na suíte completa.

5. **Review** em camadas, achados resolvidos **no mesmo PR**, veredito registrado como seção
   `## Review (AAAA-MM-DD) — VEREDITO` dentro do `BKL-###.md`, dizendo quais camadas rodaram:
   - `/code-review` — corretude e bugs no diff (sempre);
   - `@task-reviewer` — padrões, arquitetura, testes e aderência à spec; produz o veredito (sempre);
   - `security-review` — **obrigatório** se a task tocou guards/claims, upload ou signed URL, rota nova ou
     roteamento do gateway, ou schema de autenticação. O repositório tem histórico de IDOR (BKL-080) e
     pendência aberta de XFF spoofing (BKL-046).
6. **Rastro atualizado** — arquivo da task com status/desvios, movido para `Docs/tasks/concluido/`, e a
   linha correspondente marcada em `Docs/tasks/tasks.md`.
7. **Commit + PR** — Conventional Commits, branch `feat/bkl-0xx-<slug>` (ou `fix/`, `chore/`, `refactor/`).

## Hooks locais

Instalados por `npm install` (script `prepare`). Para ligar sem reinstalar:
`git config core.hooksPath .githooks`.

> O `prepare` chama o `git` **por dentro de um `node -e` com `try/catch`**, e não direto. Não é
> preciosismo: `prepare` roda em todo `npm ci`, inclusive **dentro do build das imagens Docker**, onde não
> existe git — a versão direta derrubou todo o build de imagem com `sh: git: not found` e `exit 127`
> (2026-09-19). Qualquer coisa que você acrescentar ao `prepare` precisa sair com 0 num contêiner sem git e
> sem `.git`.

| Hook | O que roda | Custo |
|---|---|---|
| `pre-commit` | `eslint` nos arquivos **staged** (backend e `frontend/src`) | segundos |
| `pre-push` | `npx nx affected -t lint typecheck --parallel=3` | dezenas de segundos |

O `pre-commit` **não** corrige automaticamente: um `--fix` seguido de `git add` sobrescreve staging parcial
(`git add -p`). Ele reporta e diz o comando a rodar.

Os hooks são uma rede de segurança rápida, **não** substituem a Definition of Done: teste, build e
`depcruise` continuam fora deles de propósito, para não travar o push por minutos. Rode a DoD completa antes
de abrir a PR.

> **No frontend, quase toda regra é `warning` por decisão** (política warn-first do BKL-087; hoje ~1017
> avisos e 0 erros). Na prática o `pre-commit` só **barra** o frontend em violação de
> `@nx/enforce-module-boundaries` — que é exatamente a fronteira construída nas BKL-092/098/100. No backend,
> `prettier/prettier` e `no-unused-vars` são erro e barram.

Escape pontual: `git commit --no-verify` / `git push --no-verify`. Use com parcimônia e diga na PR.

## Gotchas que já custaram tempo

- **Depois de `npm install`, rode `npm run prisma:generate`** — senão o `tsc` quebra com erros fantasma.
- **Rota nova dando 404 em dev** = imagem antiga ou gateway sem reload, nessa ordem:
  `docker compose up -d --build <svc>` e depois `docker exec ltbudget-gateway nginx -s reload`.
- **A suíte de `planning` é flaky em paralelo** — valide com `--runInBand` antes de acreditar numa falha.
- **PowerShell 5.1**: `Out-File -Encoding utf8` grava BOM e quebra `JSON.parse`; use
  `[IO.File]::WriteAllText(...)`. E `--projects=a,b` precisa de aspas.
- **Mover um componente Angular é mover o template junto** — um `.html` esquecido derruba o build com
  `NG2012` em cascata nos consumidores, sem apontar o arquivo faltante.
- **Não existe `start:dev` com watch no backend**: dev roda em container, código novo exige rebuild da imagem.

## Convenções

- **Idioma**: código, identificadores e comentários em **inglês**; documentação, tasks e reviews em **PT-BR**.
- **Respostas da API** são embrulhadas em `{ data }` pelo interceptor global; o frontend desembrulha com
  `res?.data ?? res`.
- **Escopo de obra**: serviço de entidade por obra usa `WorkScopedCrudService`. `getAll()` num serviço flat
  vaza dados de todas as obras — confira antes de usar.
- Detalhes de nomenclatura, imports, estrutura de arquivo e Prisma: [CONVENTIONS.md](Docs/.specs/codebase/CONVENTIONS.md).
