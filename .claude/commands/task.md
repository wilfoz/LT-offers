---
name: "Task"
description: "Implementar uma task do backlog: ler a spec e o PRD, planejar, implementar, passar no gate local, revisar com @task-reviewer e abrir PR. Use quando o usuário pedir para executar uma task BKL-###."
argument-hint: "[BKL-###]"
category: "Workflow"
---

Implementar uma task do backlog, do entendimento à PR.

**Leia primeiro o [AGENTS.md](../../AGENTS.md)** — ele define a Definition of Done e os caminhos deste repositório.

**Input**: o ID da task (ex: `/task BKL-042`). Sem argumento, pegue a próxima pendente em
`Docs/tasks/analise/` seguindo a ordem do [tasks.md](../../Docs/tasks/tasks.md) e **confirme com o usuário
antes de começar**.

## 1. Contexto

- Ler `Docs/tasks/analise/BKL-###.md`.
- Ler a **spec da feature** em `Docs/.specs/features/<feature>/spec.md` — é a **fonte de verdade de escopo**.
- Revisar o contexto em `Docs/PRD.json` e os ADRs relevantes em `Docs/adr/`.
- Verificar as dependências declaradas na task (`Depends on`, `Gate`). **Se um gate não foi satisfeito, pare
  e avise** — não comece uma task bloqueada.
- Conferir se alguma task anterior já mexeu na mesma área (`Docs/tasks/concluido/`) para não repetir erro
  conhecido nem desfazer decisão tomada.

## 2. Carregar as ferramentas certas

Identifique as tecnologias envolvidas e carregue as skills aplicáveis de `.claude/skills/`. As mais usadas
neste repositório:

- `nestjs-modular-monolith` — bounded contexts, módulos, CQRS no backend
- `domain-entities-audit` — entidades DDD/hexagonal, value objects, encapsulamento
- `coding-guidelines`, `best-practices`, `security-best-practices`
- `nx-run-tasks`, `nx-generate` — execução e scaffolding no monorepo
- `frontend-design`, `accessibility` — telas Angular

Quando a API de uma biblioteca for incerta, consulte a documentação oficial. Se o **Context7 MCP** estiver
disponível no ambiente, use-o; se não estiver, **não tente instalá-lo** — use a documentação oficial ou o
código já existente no repositório como referência.

## 3. Resumo da task

Antes de escrever código, apresente:

```
ID:            [BKL-###]
Nome:          [nome]
Spec:          [caminho da spec + IDs dos requisitos cobertos]
Requisitos:    [requisitos técnicos principais]
Dependências:  [tasks e gates]
Objetivos:     [o que precisa ser verdade ao final]
Riscos:        [o que pode dar errado / o que é ambíguo]
```

## 4. Plano de abordagem

Passos numerados, do primeiro ao último, com os arquivos que serão tocados. **Se o plano revelar que a task
exige mudar a spec, o PRD ou o escopo, pare e peça decisão ao usuário.**

## 5. Implementar

- Causa raiz, nunca gambiarra.
- Seguir [CONVENTIONS.md](../../Docs/.specs/codebase/CONVENTIONS.md), incluindo a seção *Limites de código*.
- Todo comportamento novo tem teste; todo bug corrigido tem teste de regressão que falha sem a correção.
- Commits atômicos e Conventional Commits ao longo do caminho (skill `commit-work`).

## 6. Gate local — antes de qualquer push

Rode da raiz o **espelho exato do [ci.yml](../../.github/workflows/ci.yml)**:

```bash
npx nx affected -t lint typecheck depcruise test build --parallel=3
```

E, se tocou repositório, schema Prisma, controller ou mensageria (exige Docker):

```bash
npx nx affected -t test-int test-e2e --parallel=1
```

<critical>Rode a suíte inteira do app afetado, não só os arquivos alterados: mock quebrado e erro de tipo em
outro arquivo só aparecem na suíte completa. Não faça push com o gate vermelho.</critical>

## 7. Review

Camadas com focos diferentes, que **não se sobrepõem**. As duas primeiras são sempre; a terceira é
condicional:

1. **`/code-review`** — corretude e bugs no diff. É onde o `@task-reviewer` é mais fraco: ele é forte em
   padrões, convenções e escopo, não em caçar o caso de borda que quebra. Nível `high` para tasks `[G]`,
   o padrão para as demais.
2. **`@task-reviewer`** — padrões do projeto, arquitetura, cobertura de testes e aderência à spec.
   Produz o veredito.

3. **`security-review`** — **obrigatório** quando a task toca qualquer um destes:
   - guards, decorators de autorização ou claims (`@Roles`, `assigned_works`, escopo de obra);
   - upload, download ou signed URL;
   - rota nova ou mudança no roteamento do gateway;
   - schema de autenticação, sessão ou armazenamento de token.

   Não é zelo abstrato: o repositório tem histórico de IDOR (BKL-080, pilha de auditoria #83..#92) e uma
   pendência aberta de XFF spoofing (BKL-046).

4. Resolva os achados **no mesmo PR** — críticos e major são obrigatórios; minors, se não resolvidos, ficam
   registrados como follow-up nomeado.
5. O veredito entra como seção `## Review (AAAA-MM-DD) — VEREDITO` dentro do próprio `BKL-###.md`,
   registrando **quais** das camadas acima rodaram.

<critical>Não finalize a task com problema crítico ou major em aberto.</critical>

## 8. Encerrar

Em uma única passada, sem escrita duplicada:

1. Atualizar o `BKL-###.md` com status, o que foi de fato executado, **desvios em relação à spec** e gotchas
   novos que valham para a próxima task.
2. Mover o arquivo de `Docs/tasks/analise/` para `Docs/tasks/concluido/`.
3. Marcar a linha correspondente em `Docs/tasks/tasks.md` (`[x]`, data e link).
4. Commitar e abrir a PR.
5. Apresentar um resumo curto e **pedir permissão antes de seguir para a próxima task**.
