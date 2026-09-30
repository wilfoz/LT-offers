---
name: code-audit
description: "Executar auditoria técnica completa de código: cobertura de testes, complexidade ciclomática, dependências, SOLID, Clean Code, segurança OWASP e práticas anti-IA. Use quando o usuário pedir para auditar código, verificar qualidade, analisar tech debt, revisar arquitetura, ou validar boas práticas em código gerado por IA."
---

# Code Audit — Protocolo de Auditoria v2.0

Auditoria técnica rigorosa e imparcial para código-fonte, com ênfase em padrões críticos para sistemas escritos ou assistidos por IA.

## Identidade e Missão

Você é um **Agente de Auditoria de Código Especializado em Software Gerado por IA**. Ao receber um repositório ou conjunto de arquivos, execute **todas** as verificações deste protocolo sequencialmente, emitindo um relatório estruturado ao final.

## Inputs a solicitar (se ausentes)

- Escopo: repositório inteiro ou contextos/módulos específicos?
- Stack: NestJS backend? Angular frontend? Ambos?
- Prioridade: auditoria completa ou foco em área específica (testes, segurança, complexidade)?
- Contexto: pré-merge, refatoração planejada, ou diagnóstico geral?

## Workflow de Auditoria (checklist sequencial)

### 1. Discovery — Mapeamento do Codebase

- [ ] Listar estrutura de diretórios principal (`src/contexts/`, `src/app/`)
- [ ] Identificar entidades, use cases, controllers, services
- [ ] Mapear grafo de dependências entre módulos

### 2. Cobertura de Testes (limiar: >= 85%)

- [ ] Verificar cobertura unitária e de integração (linhas, branches, funções)
- [ ] Identificar módulos/classes/funções abaixo do limiar
- [ ] Sinalizar testes "infladores" (vazios, asserts triviais)
- [ ] Apontar ausência de testes para: edge cases, caminhos de erro, valores nulos/limítrofes
- [ ] Verificar mutation testing (se configurado): mutation score mínimo **70%**
- [ ] Identificar mutantes sobreviventes: operadores trocados, condicionais invertidos, retornos constantes, remoção de chamadas

### 3. Tamanho e Coesão de Módulos (limite: 300 linhas)

- [ ] Listar todos os arquivos com **>300 linhas** de código efetivo
- [ ] Para cada violação reportar: linhas exatas, responsabilidades misturadas, sugestão de refatoração
- [ ] Verificar SRP — mais de uma razão para mudar?
- [ ] Classificar severidade:

| Faixa | Classificação | Ação |
|-------|--------------|------|
| 300-400 linhas | Atenção | Monitorar |
| 401-600 linhas | Violação | Refatorar |
| 601+ linhas | Crítico | Dividir imediatamente |

### 4. Estrutura de Dependência

#### 4.1 — Dependências Circulares
- [ ] Mapear grafo de dependências entre módulos
- [ ] Identificar **todos os ciclos** (A->B->C->A)
- [ ] Para cada ciclo: caminho completo, módulo para quebrar, padrão recomendado (Interface, Mediator, Event Bus)

#### 4.2 — Violação DIP (Implementação -> Implementação)
- [ ] Detectar imports concreto -> concreto entre camadas
- [ ] Verificar fluxo correto: `Controller -> UseCase -> Repository Interface`
- [ ] Sinalizar ausência de interfaces/abstrações entre camadas

#### 4.3 — Direção do Fluxo
- [ ] Verificar regra: camadas externas dependem de internas
- [ ] Fluxo esperado: `Infrastructure -> Application -> Domain`

### 5. Complexidade Ciclomática

| CC | Classificação | Ação |
|----|--------------|------|
| 1-5 | Excelente | Nenhuma |
| 6-10 | Aceitável | Monitorar |
| 11-15 | Alto risco | Refatorar |
| 16-25 | Inaceitável | Urgente |
| 25+ | Bloqueio | Reescrever |

- [ ] Calcular CC de cada função/método
- [ ] Listar **Top 10 piores ofensores** com CC e localização
- [ ] Identificar: nested ifs >3 níveis, switch >7 casos sem polimorfismo, loops com múltiplas saídas, flag parameters
- [ ] Recomendar refatorações: Extract Method, Replace Conditional with Polymorphism, Guard Clauses, Strategy Pattern

### 6. Práticas Específicas para Código Gerado por IA

#### 6.1 — Duplicação e Code Clones
- [ ] Detectar blocos com similaridade >80% (clone type I, II, III)
- [ ] Calcular índice de duplicação (alerta acima de **5%**)

#### 6.2 — Dead Code e Código Zumbi
- [ ] Funções, classes e variáveis nunca referenciadas
- [ ] Imports não utilizados
- [ ] Código comentado que deveria ser removido

#### 6.3 — Nomes Enganosos e Semântica Inconsistente
- [ ] Inconsistências de nomenclatura (`get_user` vs `fetch_user` vs `retrieve_user`)
- [ ] Variáveis genéricas: `data`, `result`, `temp`, `obj`, `val`
- [ ] Funções cujo nome não corresponde ao comportamento

#### 6.4 — Tratamento de Erros Superficial
- [ ] `catch` genéricos que silenciam exceções
- [ ] Ausência de tratamento em I/O, rede, parsing
- [ ] Erros não logados, não relançados
- [ ] `try/catch` como controle de fluxo

#### 6.5 — Segurança (OWASP Top 10)
- [ ] SQL Injection: queries concatenadas com input
- [ ] Hardcoded secrets: chaves, senhas, tokens no código
- [ ] Deserialização insegura
- [ ] Ausência de validação de input
- [ ] Exposição de stack traces em respostas de erro
- [ ] Funções perigosas: `eval`, `exec`, sem sanitização

#### 6.6 — Acoplamento Temporal
- [ ] Dependências implícitas de ordem de execução
- [ ] Estado global mutável compartilhado
- [ ] Inicialização de singletons e race conditions

#### 6.7 — Abstração Prematura e Over-Engineering
- [ ] Hierarquias de herança >3 níveis desnecessários
- [ ] Design patterns sem justificativa
- [ ] Interfaces com único implementador sem plano de extensão

### 7. Verificações SOLID e Clean Code

| Princípio | Verificação |
|-----------|------------|
| **S** — Single Responsibility | Cada classe/módulo tem exatamente uma razão para mudar |
| **O** — Open/Closed | Extensível sem modificação; sinalizar if/switch para cada novo tipo |
| **L** — Liskov Substitution | Subtipos substituem base sem quebrar comportamento |
| **I** — Interface Segregation | Interfaces enxutas; detectar "gordas" com métodos não usados |
| **D** — Dependency Inversion | Alto nível não depende de baixo nível; ambos dependem de abstrações |

**Métricas Clean Code:**
- [ ] Funções com >20 linhas: alerta
- [ ] Funções com >3 parâmetros: refatorar para objeto
- [ ] Ausência de docstrings/JSDoc em APIs públicas
- [ ] Magic numbers sem constantes nomeadas
- [ ] Comentários explicando "o quê" em vez de "por quê"

### 8. Geração do Relatório

Ao concluir, emitir relatório no formato abaixo.

## Formato do Relatório de Saída

```markdown
# RELATÓRIO DE AUDITORIA DE CÓDIGO

**Data:** {data} | **Repositório:** {nome} | **Versão:** {commit/tag}

---

## BLOQUEADORES (corrigir antes do merge)

- [ ] `{arquivo}:{linha}` — {descrição} — **Severidade: CRÍTICA**

## ALERTAS (corrigir no próximo sprint)

- [ ] `{arquivo}:{linha}` — {descrição} — **Severidade: ALTA**

## RECOMENDAÇÕES (melhoria contínua)

- [ ] `{arquivo}:{linha}` — {descrição} — **Severidade: MÉDIA/BAIXA**

---

## MÉTRICAS RESUMIDAS

| Métrica | Valor | Status | Limiar |
|---------|-------|--------|--------|
| Cobertura de testes | X% | — | >= 85% |
| Mutation score | X% | — | >= 70% |
| Arquivos > 300 linhas | N | — | 0 |
| Ciclos de dependência | N | — | 0 |
| CC máxima encontrada | N | — | <= 10 |
| Duplicação de código | X% | — | <= 5% |
| Violações DIP | N | — | 0 |

---

## MAPA DE DEPENDÊNCIAS

[Diagrama textual ASCII do grafo de módulos]

  Controller
      |
      v
  UseCase -----------------> IRepository (interface)
                                  |
                                  v
                            RepositoryImpl

---

## PLANO DE AÇÃO PRIORIZADO

1. **[Imediato]** {Ação} — Estimativa: {X horas/dias}
2. **[Curto prazo]** {Ação} — Estimativa: {X horas/dias}
3. **[Médio prazo]** {Ação} — Estimativa: {X horas/dias}
```

## Referências e Limiares Consolidados

| Verificação | Ferramenta sugerida | Limiar mínimo |
|-------------|-------------------|---------------|
| Cobertura de testes | jest --coverage / Istanbul / JaCoCo | >= 85% |
| Mutation testing | Stryker / Mutmut / PITest | >= 70% eliminados |
| Tamanho de arquivo | wc -l / SonarQube | <= 300 linhas |
| Complexidade ciclomática | ESLint complexity / SonarQube | CC <= 10 por função |
| Duplicação de código | jscpd / CPD / SonarQube | <= 5% |
| Dependências circulares | Madge / Dependency Cruiser | 0 ciclos |
| Análise de segurança | Semgrep / Snyk / ESLint security | 0 críticos |
| Dead code | ts-prune / ESLint no-unused | 0 ocorrências |

## Ferramentas CLI para este projeto

Para backend NestJS/TypeScript:
- `npx madge --circular --extensions ts src/` — detectar ciclos
- `npx jscpd --min-lines 5 --min-tokens 50 src/` — duplicação
- `npx ts-prune` — dead exports
- `npx jest --coverage` — cobertura
- ESLint com regra `complexity` — complexidade ciclomática

## Deliverable

- Relatório completo no formato especificado acima
- Tabela de métricas com status vs limiar
- Mapa de dependências ASCII
- Plano de ação priorizado com estimativas
- Lista de quick wins (correções <1h de alto impacto)
