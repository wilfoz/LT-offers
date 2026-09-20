# Design - Arquitetura Hexagonal nos Contextos Risks e Checks

## Context

`risks` é um CRUD com regra de negócio (severidade = impacto × probabilidade; tratamento define contingência incorporada ao preço) e `checks` é um avaliador sem estado que junta dados da oferta e delega ao `ConsistencyEngine` do motor. São os dois últimos módulos do M12 fora de `contexts/`. Independentes entre si (nenhum importa o outro), migram juntos por afinidade de fase e tamanho (~415 linhas somadas).

## Goals / Non-Goals

**Goals:**
- Dois bounded contexts independentes, sem fachada entre eles.
- `risks` com repositório e exceções tipadas de domínio (`RiskNotFoundException`); severidade calculada como regra pura de domínio testada diretamente.
- `checks` somente-leitura: porta de consulta ampla + delegação ao motor; o envelope de health (status HEALTHY/WARNINGS_ONLY/CRITICAL_ERRORS) preservado byte a byte — é consumido pelo badge do cabeçalho da oferta na web.

**Non-Goals:**
- Não alterar as regras do `ConsistencyEngine` (RN-13) nem o cálculo de contingência no motor.
- Não unificar risks e checks num contexto único — fronteiras e ciclos de vida distintos (escrita × avaliação).
- Não alterar schema/migrations.

## Decisions

### 1. Severidade como regra de domínio, não coluna derivada
A severidade (impacto × probabilidade) é recalculada pela entidade `RiskItem` — nunca persistida como verdade. Elimina a classe de bug "editou impacto, severidade ficou velha". O presenter serializa o valor calculado com Decimal→string (RNF-08).

### 2. `checks` com porta única e ampla
Diferente dos contextos de cálculo (duas portas por origem), o motor de consistência precisa de um recorte transversal da oferta (linhas, estaqueamento, catálogos aplicados, preços, cronograma). Uma porta única `ChecksDataQueryPort` com um método por bloco de dados mantém o dublê de teste legível; fatiar em N portas espalharia o setup sem ganho — o consumidor é um só.

### 3. Escrita em `risks` com repositório direto, sem unit of work
As operações são de agregado único (um risco por vez) — transação explícita seria cerimônia. Precedente: contextos de catálogo usam repositório direto; unit of work ficou reservado a operações multi-agregado (offers, staking).

## Risks / Trade-offs

- **Risco**: o envelope de `checks` alimenta navegação por abas na web (CheckNavigationTarget) — qualquer renomeação de campo quebra o mapa de abas silenciosamente. **Mitigação**: testes de controller assertam o envelope completo por igualdade.
- **Risco**: erros de infraestrutura invisíveis aos testes puros — `npx nx build api` obrigatório na integração.
