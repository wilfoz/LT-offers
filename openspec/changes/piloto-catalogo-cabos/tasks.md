# Tasks: piloto-catalogo-cabos

## 1. Rotina de implementação (setup, vale para esta e as próximas changes)

- [x] 1.1 Adicionar `operations.apply.guidance` ao `openspec/config.yaml` com o ciclo por task do design D5: entender task e dependências → plano curto → implementar → review com agente `task-reviewer` ao fim de cada grupo → corrigir antes de marcar → commit por grupo
- [x] 1.2 Criar a skill `.claude/skills/executar-qa/SKILL.md` a partir de `ref/execute_qa.md`, adaptando caminhos ao OpenSpec (proposal/specs da change como fonte dos critérios; evidências e `qa.md` em `openspec/changes/<change>/qa/`; portas e limpeza de ambiente mantidas)
- [x] 1.3 Verificar a rotina: `openspec instructions apply --change piloto-catalogo-cabos --json` deve exibir o guidance; a skill deve aparecer na lista de skills do projeto

## 2. Modelo de dados

- [x] 2.1 Modelar `cabo_condutor` e `cabo_condutor_versao` no `schema.prisma` conforme design D1 (código único, campos Decimal anuláveis para distinguir não informado de zero — RNF-09, `vigencia_inicio`, `criado_por`, `criado_em`) e gerar a migration
- [x] 2.2 Aplicar a migration no Postgres local e regenerar o Prisma Client, confirmando os tipos Decimal no client

## 3. API de cabos condutores

- [x] 3.1 Criar o módulo `catalogos` no `apps/api` com endpoints: criar item (primeira versão), editar (nova versão com vigência), listar vigentes com busca, obter item com `?vigenteEm=`, histórico de versões — datas de referência resolvidas na borda (design D2)
- [x] 3.2 Implementar DTOs com class-validator e mensagens em pt-BR: código obrigatório/único, numéricos como string decimal positiva, `null` para não informado; rejeição de código duplicado com erro claro
- [x] 3.3 Registrar `criado_por` via cabeçalho `X-Usuario` com fallback `"sistema"` (design D6) e expor autor/instante no histórico
- [x] 3.4 Escrever testes do service e do controller cobrindo os cenários dos dois specs: nova versão preserva anterior, versão histórica imutável, resolução de vigência (atual, passada, anterior à primeira), duplicidade, validação numérica
- [x] 3.5 Verificar os endpoints ao vivo contra o Postgres do Compose (criar, editar, consultar com `vigenteEm`, histórico)

## 4. Interface de manutenção

- [x] 4.1 Criar a feature `catalogos` no `apps/web` com rota `/catalogos/cabos-condutores` e navegação a partir da página inicial
- [x] 4.2 Implementar a listagem com busca por código/descrição e sinalização visível de itens com dados obrigatórios ausentes, distinguindo vazio de zero (RNF-09)
- [x] 4.3 Implementar o formulário de criação/edição gerando nova versão com data de vigência, validação em pt-BR espelhando a API
- [x] 4.4 Implementar a tela de histórico de versões (vigência, autor, valores por versão)
- [x] 4.5 Escrever testes de componente cobrindo listagem com pendências, validação do formulário e exibição do histórico

## 5. QA e fechamento

- [x] 5.1 Executar a skill `/executar-qa` para a change: validar cada cenário dos specs com evidências, corrigir bugs na causa raiz com testes de regressão, gerar `qa.md`
- [x] 5.2 Rodar a suíte completa (`npx nx run-many -t lint test build`) limpa e confirmar o CI verde no push
