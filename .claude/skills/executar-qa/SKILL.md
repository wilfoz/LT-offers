---
name: executar-qa
description: "QA — valide e estabilize uma feature ou épico já implementado contra a spec e os critérios de aceitação: testes de unidade, integração e E2E com a ferramenta de navegador disponível, acessibilidade, responsividade, correção dos bugs encontrados na causa raiz e um relatório com evidências. Use quando o usuário pedir para executar QA. Não use para implementar tasks novas (/task) nem para revisar código (@task-reviewer)."
argument-hint: "--feature <slug> | --tasks BKL-###,BKL-###"
---

# Executar QA

Valida uma feature ou um épico **já implementado**, do checklist de critérios de aceitação ao relatório
com evidências.

**Leia primeiro o [AGENTS.md](../../../AGENTS.md)** — caminhos, Definition of Done e gotchas do repositório.

## Escopo

O argumento define o alvo:

- `--feature <slug>` → a spec em `Docs/.specs/features/<slug>/spec.md` e as tasks que a implementaram;
- `--tasks BKL-###,...` → um conjunto explícito de tasks (útil ao fechar uma seção do backlog).

Sem argumento, pergunte ao usuário qual feature ou épico validar. **Rode QA por feature/épico, não por task
isolada** — por task o custo não se paga, e foi por isso que o QA por task foi abandonado.

## Onde o resultado mora

| Artefato | Caminho |
|---|---|
| Relatório (append de uma rodada nova no topo) | `Docs/tasks/concluido/qa.md` |
| Evidências (saídas de teste, capturas) | `Docs/tasks/concluido/evidences/` |
| Template da rodada | [references/TEMPLATE.md](references/TEMPLATE.md) |

Nomeie cada evidência como `qa-AAAA-MM-DD-<assunto>.{txt,png}`, seguindo o padrão já existente na pasta.

## Critério de aprovação

O QA só está **APROVADO** quando todo critério de aceitação da spec foi verificado e está atendido. Bugs
encontrados são corrigidos na causa raiz, ganham teste de regressão e a validação é repetida.

Um critério que **não pôde** ser verificado nunca é marcado como PASSOU: marque `🚫 BLOQUEADO` com o motivo.

> **Bloqueio conhecido:** os fluxos de navegador autenticados estão barrados pelo gate Auth0 — o
> `Auth0JwtGuard` valida RS256 contra o issuer real e não há emissor de teste. O desbloqueio está
> rastreado em [`BKL-101`](../../../Docs/tasks/analise/BKL-101.md). **Enquanto não for resolvido, reporte
> esses critérios como `🚫 BLOQUEADO (Auth0)` no veredito — nunca os pule em silêncio nem os declare
> aprovados por inspeção de código.**

## Fluxo

1. **Analisar** — leia o `AGENTS.md`, as convenções em `Docs/.specs/codebase/`, a `spec.md` da feature e cada
   `BKL-###.md` envolvido; monte um checklist com um item de verificação por critério de aceitação (`CA-*`) e
   associe os casos de teste correspondentes (unit, integração, E2E).
   **Conclua quando:** houver um item de verificação e pelo menos um teste associado a cada `CA-*` da spec.

2. **Preparar o ambiente** — suba os serviços necessários em um ambiente isolado da worktree. Use uma porta
   livre na faixa `30**` para o backend, uma na faixa `51**` para o frontend e uma faixa própria para cada
   banco ou serviço adicional. **Verifique cada porta antes de subir**; se estiver ocupada, escolha outra
   dentro da faixa. Configure as URLs entre os serviços, registre portas e processos iniciados e abra a
   aplicação pela ferramenta de navegador.

   Ferramenta de navegador: o **Claude Browser** (`preview_start`, `.claude/launch.json`) ou a skill
   `playwright-skill`. Lembre que o backend em dev roda em container — código novo exige
   `docker compose up -d --build <svc>` e, se mexeu em rota, `docker exec ltbudget-gateway nginx -s reload`.
   **Conclua quando:** os serviços responderem, a página inicial carregar e portas/processos estiverem registrados.

3. **Testar cada fluxo (E2E)** — para cada `CA-*` com fluxo de interface, execute o caso pela ferramenta de
   navegador e verifique o resultado no estado da aplicação. Diante de comportamento inesperado, investigue
   antes de registrar: estado da interface, console do navegador, requisições/respostas da API e logs do
   backend. Capture evidência visual, salve em `Docs/tasks/concluido/evidences/`, marque PASSOU / FALHOU /
   BLOQUEADO e registre cada falha.
   **Conclua quando:** todo `CA-*` com interface tiver resultado e evidência.

4. **Executar os testes automatizados** — rode as suítes que cobrem os critérios, da raiz:

   ```bash
   npx nx test <projeto>                              # unit de um app
   npx nx affected -t test-int test-e2e --parallel=1   # integração e e2e (exige Docker)
   npm run test:cov -w web                             # frontend com catraca de cobertura
   ```

   A suíte de `planning` é flaky em paralelo — confirme qualquer falha dela com `--runInBand` antes de
   registrar como bug. Registre o comando, o resultado e a evidência de cada suíte.
   **Conclua quando:** todos os testes associados aos critérios tiverem rodado ou estiverem explicitamente bloqueados.

5. **Verificar acessibilidade** — em cada tela, pela ferramenta de navegador:
   - [ ] Navegação por teclado (Tab, Enter, Esc)
   - [ ] Elementos interativos com rótulos descritivos
   - [ ] Imagens com `alt` apropriado
   - [ ] Contraste de cores adequado
   - [ ] Formulários com rótulos associados aos campos
   - [ ] Mensagens de erro claras e acessíveis
   - [ ] Fontes com tamanho apropriado

   A skill `accessibility` cobre o roteiro WCAG em profundidade.
   **Conclua quando:** cada item tiver sido verificado em cada tela.

6. **Verificar visual e responsividade** — capture as telas principais nos estados vazio, com dados e erro, e
   nos principais breakpoints; salve em `evidences/` e documente as inconsistências.
   **Conclua quando:** estados e breakpoints principais estiverem capturados.

7. **Corrigir os bugs encontrados** — para cada bug registrado:
   - localize e corrija a **causa raiz**, sem mascarar o sintoma;
   - crie um teste de regressão que **falhe sem a correção**;
   - registre no `qa.md` o status, a correção aplicada e o teste criado;
   - se a correção exigir mudar a spec, o PRD ou o escopo, **pare e peça decisão ao usuário**.

   **Conclua quando:** cada bug tiver correção e teste de regressão, ou estiver bloqueado por decisão do usuário.

8. **Revalidar** — repita os fluxos que falharam, rode os testes de regressão e o gate do `AGENTS.md`
   (`npx nx affected -t lint typecheck depcruise test build --parallel=3`). Se algo falhar, volte ao passo 7.
   **Conclua quando:** todos os critérios estiverem PASSOU ou BLOQUEADO, sem bug não resolvido.

9. **Reportar** — acrescente a rodada no topo de `Docs/tasks/concluido/qa.md` seguindo
   [references/TEMPLATE.md](references/TEMPLATE.md), com bugs corrigidos, testes de regressão e evidências.
   **Conclua quando:** a rodada estiver escrita conforme o template.

10. **Encerrar o ambiente** — desligue os serviços que **esta execução** subiu, encerre os processos de forma
    graciosa e confirme que portas, bancos temporários e containers foram liberados. Não encerre processos de
    outra worktree nem do usuário. Faça essa limpeza também se o QA for interrompido, bloqueado ou reprovado.
