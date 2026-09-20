## Context

O motor de cálculo e os catálogos do monorepo atingiram paridade numérica completa (§14) com os modelos de referência. No entanto, os parâmetros de produtividade de campo, os fatores de acesso, o empolamento de solos e a matriz pluviométrica foram originalmente registrados como hipóteses de trabalho preliminares (§02).

Esta especificação técnica detalha a implementação da calibração fina desses coeficientes de campo, assegurando determinismo decimal absoluto (RNF-04, RNF-08) e compatibilidade com o grafo de dependências do motor de cálculo (RNF-16).

## Goals / Non-Goals

**Goals:**
- Implementar modelo e cálculos determinísticos para fatores de dificuldade de acesso de terreno (`NORMAL` = 1.0, `DIFFICULT` = 1.25, `CROSSING` = 1.60) no cálculo de durações do cronograma (RF-36, RN-15).
- Expandir e consolidar o catálogo pluviométrico (`PrecipitationCalculator`) para cobrir todas as 27 UFs brasileiras com fatores mensais de produtividade padronizados (RF-37, RN-16).
- Implementar os coeficientes geotécnicos de empolamento (20% a 40%) e compactação (15%) na consolidação de volumes de fundação e bota-fora (`FoundationQuantityEngine`).
- Calibrar o catálogo de equipes com taxas nominais e limites de sobreprodução para frentes complexas (ex.: montagem de torres estaiadas e lançamento de feixes 4x/6x condutores).

**Non-Goals:**
- Alterar as fórmulas financeiras de BDI, tributos ou matriz de risco (M09, M10).
- Quebrar compatibilidade retroativa com revisões de propostas já congeladas (RNF-05).

## Decisions

### 1. Modelo de Fator Ponderado de Acesso no Domínio e Cronograma
- **Decisão**: O índice de severidade de acesso da linha de transmissão será calculado como a média ponderada dos fatores das torres estaqueadas ($w_i \in \{1.00, 1.25, 1.60\}$). Quando não houver estaqueamento detalhado, o usuário poderá informar o fator médio global da linha.
- **Alternativa Considerada**: Aplicar o fator de acesso apenas torre a torre. Rejeitada para o cronograma macro, pois as equipes de obra operam em lotes/trechos contínuos de linha, tornando a média ponderada do trecho a métrica operacional correta para dimensionamento de prazos.

### 2. Expansão da Matriz Pluviométrica Regional
- **Decisão**: Estruturar `PrecipitationCalculator` com matrizes de 12 meses para todas as 27 UFs brasileiras, classificando a produtividade em 5 patamares discretos determinísticos:
  - Nível 1 (Seco / < 50mm): Fator 1.00
  - Nível 2 (Moderado Baixo / 50–120mm): Fator 0.90
  - Nível 3 (Moderado Alto / 120–180mm): Fator 0.80
  - Nível 4 (Chuvoso / 180–250mm): Fator 0.65
  - Nível 5 (Severo / > 250mm): Fator 0.55
- **Alternativa Considerada**: Interpolação linear contínua por milímetro de chuva. Rejeitada para preservar simplicidade de auditoria e conformidade com as regras operacionais de campo da engenharia civil.

### 3. Integração de Empolamento e Perdas Geotécnicas
- **Decisão**: `FoundationQuantityEngine` calculará explicitamente:
  - $V_{\text{escavado bruto}} = V_{\text{teórico}} \times (1 + \text{fator sobre-escavação})$
  - $V_{\text{solto bota-fora}} = (V_{\text{escavado bruto}} - V_{\text{concreto enterrado}}) \times \text{fator empolamento}$
  - $V_{\text{reaterro compactado}} = (V_{\text{escavado bruto}} - V_{\text{concreto enterrado}}) \times (1 + \text{fator compactação})$
- **Alternativa Considerada**: Aplicar empolamento fixo de 25% para todos os solos. Rejeitada porque rocha/solo duro tem expansão volumétrica de até 40%, impactando significativamente o custo de transporte em caminhões basculantes.

## Risks / Trade-offs

- **[Risco] Variação nos prazos calculados de cronogramas existentes**  
  *Mitigação*: Fator de acesso padrão configurado como neutro (1.00) na ausência de classificação específica, mantendo compatibilidade total com fixtures históricas.
- **[Risco] Sobrecarga de dados de UF na API**  
  *Mitigação*: Matriz pluviométrica compilada estaticamente no `calc-engine` e disponibilizada como serviço puro, com zero custo de query I/O no banco de dados.
