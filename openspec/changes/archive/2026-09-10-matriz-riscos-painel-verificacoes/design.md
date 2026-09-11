## Context

Na planilha legada `Calculo LT`, a validação de consistência e o gerenciamento de incertezas estavam dispersos em abas ocultas (`Checks`, `Check cantid. TOTAL y canteiros`) e abas replicadas por linha (`Risk1..Risk10`). Esta mudança implementa a Fase F6.1 do roadmap (§13), criando a Matriz de Riscos analítica por linha e o Painel Central de Verificações de Consistência (M12, RF-61, RF-62, RF-63, RF-55, RNF-09).

## Goals / Non-Goals

**Goals:**
- Implementar modelo e motor determinístico para cadastro e valoração de riscos por linha de transmissão (`libs/domain`, `libs/calc-engine`).
- Conectar a severidade ponderada de riscos elegíveis à linha de contingências do Quadro de Coeficientes de Venda $K$ e BDI (`EconomicResultCalculator`).
- Implementar o motor de diagnósticos cruzados (`ConsistencyEngine`) cobrindo as 6 frentes de verificação da planilha legada.
- Implementar a regra impeditiva de fechamento de revisão da oferta quando houver pendências críticas (RF-63).
- Desenvolver interfaces web no Angular (`OfferRisksComponent`, `OfferChecksComponent`, `HealthBadge`) com suporte a navegação direta (*deep linking*) para a causa-raiz dos erros.

**Non-Goals:**
- Controle avançado de permissões RBAC e perfis de acesso (escopo da Fase F6.2).
- Trilha imutável de auditoria corporativa e snapshots históricos (escopo da Fase F6.2).
- Exportação em layouts contratuais de editais (escopo da Fase F6.3).

## Decisions

### 1. Motor de Verificações como Pipeline Puro em `calc-engine`
- **Decisão:** Implementar `ConsistencyEngine` na biblioteca pura `libs/calc-engine`, recebendo o agregado de dados da oferta e retornando uma estrutura imutável de `CheckFinding[]` e `OfferHealthSummary`.
- **Alternativas consideradas:**
  - *Validação via queries de banco no NestJS:* Rejeitado pois violaria RNF-16 (testabilidade do motor de cálculo sem infraestrutura de banco/web) e impediria validações em memória no frontend durante edições ativas.
  - *Validação distribuída em cada componente web:* Rejeitado pois duplicaria lógica de negócio e fragilizaria a garantia de fechamento de revisão no backend.

### 2. Integração Bidirecional/Paramétrica de Riscos no BDI
- **Decisão:** Cada item de risco possui a flag `treatment: 'contingency_bdi' | 'commercial_assumption'`. Apenas os riscos marcados como `'contingency_bdi'` somam no montante ponderado de contingência que alimenta os coeficientes $K$.
- **Alternativas consideradas:**
  - *Somar 100% dos riscos ao BDI indiscriminadamente:* Rejeitado pois certos riscos são premissas de qualificação contratual que a diretoria comercial prefere assumir na margem em vez de onerar o preço do edital.

### 3. Classificação Rigorosa de Severidade (Crítica vs Alerta)
- **Decisão:** Achados de consistência são divididos em:
  - `CRITICAL`: Inconsistências de dados que corrompem o cálculo (itens sem preço, divergência de torres, descumprimento de datas LI/LO, diferença no fluxo de desembolso). Bloqueiam o fechamento da revisão.
  - `WARNING`: Desvios operacionais aceitáveis com justificativa (produção de equipe excedida com horas extras, déficit pontual de equipamento). Exigem justificativa para fechar.
  - `INFO`: Recomendações e notas informativas.

## Risks / Trade-offs

- [Desempenho de recálculo em ofertas com milhares de torres] → O `ConsistencyEngine` executará apenas validações agregadas e filtros lineares $O(N)$, mantendo a execução bem abaixo de 50ms para atender RNF-01.
- [Deep linking para abas complexas com paginação] → O payload do `CheckFinding` incluirá metadados de localização (`tab`, `lineId`, `entityId`, `field`), permitindo ao roteador e aos componentes da web focar e rolar até o elemento alvo.
