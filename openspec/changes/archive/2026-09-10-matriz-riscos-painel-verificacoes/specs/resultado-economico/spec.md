## MODIFIED Requirements

### Requirement: Parametrização dos Coeficientes de Venda K e BDI (RF-52)
O sistema SHALL permitir a parametrização dos coeficientes de venda $K$ por linha e grupo de custo: taxa de garantias e cauções contratuais, taxa de seguros (riscos de engenharia e responsabilidade civil), imposto sobre produção, taxa de IDDE, risco país/cliente, custo financeiro de capital, contingências de obra (alimentadas diretamente pelo cálculo ponderado da Matriz de Riscos ou definidas manualmente), taxa de administração central/estrutura e margem de lucro líquido alvo.

#### Scenario: Composição da taxa de BDI da proposta
- **WHEN** o orçamentista define as taxas de estrutura (4,5%), riscos/garantias (2,0%), financeiro (1,8%) e margem líquida (8,0%)
- **THEN** o sistema calcula o multiplicador de BDI e os coeficientes de venda aplicáveis a cada grupo de fornecimento e serviço

#### Scenario: Composição da taxa de BDI da proposta com contingências de risco
- **WHEN** o orçamentista define as taxas de estrutura (4,5%), seguros/garantias (2,0%), financeiro (1,8%), margem líquida (8,0%) e importa a contingência ponderada da Matriz de Riscos (RF-61)
- **THEN** o sistema calcula o multiplicador de BDI e os coeficientes de venda incorporando a parcela calculada de risco a cada grupo de fornecimento e serviço

---

### Requirement: Avaliação de Impacto por Contingências Construtivas (RF-55)
O sistema SHALL permitir a simulação de contingências técnicas e geotécnicas (ex.: aumento de 15% em solo rochoso, acréscimo de extensões de acessos difíceis ou substituição de torres autoportantes por estaiadas) integradas à Matriz de Riscos (RF-61), computando o reflexo financeiro imediato no custo, na contingência e na margem.

#### Scenario: Simulação de cenário com maior incidência de rocha
- **WHEN** o orçamentista testa a hipótese de 20% das fundações em solo tipo 3 (rocha com perfuração) em vez de 10%
- **THEN** o sistema recalcula o custo adicional de perfuração/concreto e indica a contingência monetária requerida

#### Scenario: Simulação de cenário com maior incidência de rocha e reflexo no BDI
- **WHEN** o orçamentista testa a hipótese de 20% das fundações em solo tipo 3 (rocha com perfuração) em vez de 10% e classifica a incerteza na Matriz de Riscos
- **THEN** o sistema recalcula o custo adicional de perfuração/concreto, atualiza a severidade ponderada do risco e ajusta automaticamente a contingência do BDI
