## Purpose

Define os requisitos e regras de cálculo para a Matriz de Riscos analítica por linha de transmissão e consolidada no lote (Módulo M12, RF-61, RF-55), abrangendo categorização de incertezas, valoração de impacto financeiro, severidade ponderada e alimentação direta das contingências do BDI.

## ADDED Requirements

### Requirement: Registro e Categorização de Riscos por Linha (RF-61)
O sistema SHALL permitir o cadastro e manutenção de itens de risco associados a cada linha de transmissão da oferta (`Risk1..Risk10`), categorizados em: Fundiário/Servidão, Ambiental/Licenciamento, Prazo/Cronograma, Clima/Precipitação, Geotécnico/Solo, Engenharia/Interface e Terceiros/Subcontratação.

#### Scenario: Cadastro de risco fundiário com potencial atraso
- **WHEN** o orçamentista cadastra um risco na categoria "Fundiário" relativo a faixa de servidão com alta densidade urbana
- **THEN** o sistema registra o item com descrição detalhada, situação na proposta, ação de mitigação proposta e linha de transmissão vinculada

---

### Requirement: Quantificação de Impacto e Severidade Ponderada de Risco (RF-61)
O sistema SHALL calcular o valor de risco ponderado ($\text{Severidade} = \text{Impacto Estimado (R\$)} \times \text{Probabilidade (\%)})$ para cada item cadastrado, totalizando os montantes por categoria e por linha de transmissão.

#### Scenario: Cálculo de risco ponderado com impacto monetário
- **WHEN** um risco geotécnico de travessia especial tem impacto financeiro estimado em R$ 2.000.000 e probabilidade avaliada em 30%
- **THEN** o sistema calcula a severidade ponderada de R$ 600.000 e soma ao montante de riscos da linha correspondente

---

### Requirement: Integração de Riscos com Contingências de Venda e BDI (RF-55, RF-61)
O sistema SHALL permitir que o orçamentista defina o tratamento de cada risco (alimentar a taxa de contingência da proposta ou ser assumido como premissa comercial sem adição de custo), transferindo automaticamente o somatório dos riscos ponderados selecionados para a linha de contingências dos coeficientes de venda $K$ e do BDI da oferta.

#### Scenario: Transferência automática de riscos para contingência do BDI
- **WHEN** a soma dos riscos ponderados elegíveis para contingência em uma linha atinge R$ 1.500.000
- **THEN** o sistema atualiza a parcela monetária de contingência no cálculo dos coeficientes $K$, refletindo o valor no preço final de venda da linha
