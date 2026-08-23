---
name: executar-qa
description: "QA de uma change OpenSpec implementada — valide cada cenário dos specs da change com testes de unidade, integração e E2E (ferramenta de navegador disponível), acessibilidade e responsividade; corrija bugs na causa raiz com testes de regressão e gere qa.md com evidências. Use quando o usuário pedir para executar QA de uma change, tipicamente após o /opsx:apply e antes do /opsx:archive. Não use para implementar tasks nem para code review (agente task-reviewer)."
argument-hint: nome-da-change
---

O argumento identifica a change em `openspec/changes/<nome-da-change>/`. Sem argumento, use a única change ativa (`openspec list --json`); se houver mais de uma, pergunte.

Fontes de verdade da change:

- **Critérios de aceitação** — os cenários (`#### Scenario:`) de cada spec em `openspec/changes/<change>/specs/**/spec.md`. Cada cenário é um item de verificação.
- **Contexto e decisões** — `proposal.md` e `design.md` da change.
- **Comandos e convenções do projeto** — `README.md` na raiz (comando canônico: `npx nx run-many -t lint test build`).

Saídas: mantenha `openspec/changes/<change>/qa/qa.md` com defeitos, correções, testes de regressão e resultados; salve todas as evidências (capturas da ferramenta de navegador) em `openspec/changes/<change>/qa/evidences/`. A pasta `qa/` é arquivada junto com a change no `/opsx:archive` — esse é o destino esperado do relatório.

O QA só está **APROVADO** quando todo cenário de todo spec da change estiver verificado e marcado como PASSOU, sem bugs não resolvidos. Se encontrar bugs, corrija na causa raiz, crie teste de regressão e revalide.

## Fluxo

1. **Analisar** — leia proposal, design e todos os specs da change; monte um checklist com um item por cenário, classificando cada um como fluxo de interface (E2E), integração (TI) ou unidade (TU).
   **Conclua quando:** todo cenário tiver um item de verificação e um tipo de teste associado.

2. **Preparar o ambiente** — suba os serviços necessários: banco via `docker compose up -d`, API com `npx nx serve api` (porta na faixa 3000–3099) e web com `npx nx serve web` (porta na faixa 4200–4299). Verifique cada porta antes de usar; se ocupada, escolha outra na faixa e configure as URLs entre os serviços. Registre portas e processos no `qa.md` e abra a aplicação pela ferramenta de navegador disponível.
   **Conclua quando:** os serviços responderem e a página inicial carregar.

3. **Testar cada fluxo (E2E)** — para cada cenário de interface, execute o fluxo na ferramenta de navegador e verifique o resultado esperado. Em comportamento inesperado, investigue interface, console do navegador, requisições/respostas da API e logs do backend antes de registrar o bug. Capture evidência visual em `qa/evidences/`, marque PASSOU ou FALHOU e registre falhas no `qa.md`.
   **Conclua quando:** todo cenário de interface estiver marcado, com evidência.

4. **Executar testes de unidade e integração** — rode os testes dos projetos afetados (`npx nx test <projeto>`) e a suíte completa. Quando o projeto tiver meta de cobertura definida, verifique-a e registre o resultado no `qa.md`. Registre resultados no checklist e falhas no `qa.md`.
   **Conclua quando:** todos os testes associados aos cenários tiverem sido executados ou estiverem explicitamente bloqueados.

5. **Verificar acessibilidade** — em cada tela nova ou alterada:
   - [ ] Navegação por teclado (Tab, Enter, Esc)
   - [ ] Elementos interativos com rótulos descritivos
   - [ ] Imagens com `alt` apropriado
   - [ ] Contraste de cores adequado
   - [ ] Formulários com rótulos associados aos campos
   - [ ] Mensagens de erro claras, acessíveis e em pt-BR
   - [ ] Fontes com tamanho apropriado

   **Conclua quando:** cada item tiver sido verificado em cada tela.

6. **Verificar visual e responsividade** — capture as telas principais nos estados vazio, com dados e erro, e nos principais breakpoints; salve em `qa/evidences/` e documente inconsistências.
   **Conclua quando:** estados e breakpoints estiverem capturados.

7. **Corrigir os bugs encontrados** — para cada bug no `qa.md`: corrija a causa raiz sem mascarar o sintoma; crie um teste de regressão que falhe sem a correção; registre status, correção e teste. Se a correção exigir mudança de spec, proposal ou escopo, pare e solicite decisão ao usuário.
   **Conclua quando:** cada bug tiver correção e regressão, ou estiver bloqueado por decisão do usuário.

8. **Revalidar** — repita os fluxos que falharam, rode as regressões e reverifique os cenários afetados. Se algo falhar, volte ao passo 7.
   **Conclua quando:** todos os cenários estiverem PASSOU, sem bugs abertos.

9. **Reportar** — finalize o `qa.md` com: resumo (APROVADO/REPROVADO), checklist por cenário com resultado e evidência, bugs encontrados/corrigidos com seus testes de regressão, portas usadas e observações.
   **Conclua quando:** o `qa.md` refletir o estado final.

10. **Encerrar o ambiente** — pare os processos de serve iniciados por esta execução e confirme as portas liberadas (o Postgres do Compose pode permanecer). Faça a limpeza também se o QA for interrompido ou reprovado.
