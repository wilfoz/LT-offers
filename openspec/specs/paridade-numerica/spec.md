## Purpose

Estabelece os critérios formais, contratos de dados, matrizes de tolerância e cenários de teste para a validação de paridade numérica ponta a ponta do motor de cálculo contra propostas históricas reais de Linhas de Transmissão (§14, RNF-01, RNF-04, RNF-05, RNF-08).

## Requirements

### Requirement: Avaliação de Paridade Numérica em Múltiplos Níveis de Tolerância
O sistema SHALL avaliar a aderência matemática dos cálculos do motor (`calc-engine`) contra os valores esperados das propostas de referência conforme a matriz de tolerâncias declarada (§14 e RNF-08): tolerância 0 (exata) para grandezas discretas (contagem de estruturas, vãos, bobinas, cadeias, equipes alocadas), tolerância relativa menor ou igual a 0,001% para grandezas físicas contínuas (toneladas de cabos, m³ de escavação/concreto, kg de aço) e tolerância relativa menor ou igual a 0,01% para valores financeiros consolidados (custo líquido de materiais, tributos calculados, custo de serviços, BDI, preço de venda e fluxo de caixa).

#### Scenario: Avaliação de conformidade dentro da tolerância permitida
- **WHEN** o avaliador de paridade compara a saída do cálculo de uma proposta com a baseline de referência
- **THEN** o sistema classifica cada métrica como `CONFORME` quando a variação absoluta ou relativa estiver dentro da tolerância estabelecida para sua categoria

#### Scenario: Identificação de desvio acima do limite
- **WHEN** uma grandeza discreta apresenta diferença de 1 unidade ou uma grandeza monetária apresenta desvio relativo superior a 0,01%
- **THEN** o sistema sinaliza a métrica como `DESVIO_DETECTADO` e inclui o valor calculado, o valor de referência e a diferença no relatório de auditoria

---

### Requirement: Fixtures de Ofertas Históricas Reais Versionadas
O sistema SHALL disponibilizar fixtures de teste padronizadas e versionadas cobrindo os perfis representativos do setor elétrico:
1. *Perfil Linha Única (Solaris MG 500 kV)*: extensão de ~200 km, terreno misto, estruturas autoportantes e estaiadas, alíquotas normais de ICMS/DIFAL e BDI padrão;
2. *Perfil Lote Multilinhas (Lote Tucano)*: múltiplas linhas (2 a 3) simultâneas, canteiro central compartilhado, curva de entregas mensais com ponderação de futuros de commodities (LME/Midwest) e rateio de indiretos (RN-05, RN-09);
3. *Perfil Regime Especial REIDI & Faturamento Direto*: suspensão de PIS/COFINS na aquisição de materiais de infraestrutura e separação de itens faturados diretamente pelo cliente (RN-07, RN-10).

#### Scenario: Execução ponta a ponta com fixture de proposta real
- **WHEN** o motor executa o cálculo completo a partir da fixture de uma oferta histórica
- **THEN** o motor produz os quantitativos, tributos, cronograma, histogramas, orçamento de serviços, resultado econômico e desembolso sem erros de propagação ou estados indefinidos (RNF-09)

---

### Requirement: Registro de Correções Técnicas Homologadas
O sistema SHALL registrar formalmente no relatório de paridade as divergências originadas por correções de bugs, erros de fórmulas legadas ou imprecisões de ponto flutuante do arquivo Excel original, categorizando-as como `CORRECAO_HOMOLOGADA` acompanhadas de justificativa técnica e base de cálculo.

#### Scenario: Registro de correção de erro legado da planilha
- **WHEN** a divergência numérica decorre da substituição de fórmula com `#REF!` ou arredondamento incorreto do Excel pela regra matemática correta em aritmética decimal
- **THEN** o sistema aprova a paridade e anexa a justificativa técnica correspondente na memória de cálculo do relatório

---

### Requirement: Validação de Casos Limite de Regras de Negócio
O sistema SHALL verificar o comportamento determinístico e a integridade do cálculo em situações extremas das regras de negócio (RN-01 a RN-26):
1. Linhas com múltiplas UFs de destino e rateio proporcional de extensão e DIFAL (RN-05, RN-06);
2. Meses com precipitação pluviométrica histórica máxima com redução programada de produtividades (RN-16);
3. Imutabilidade histórica: reexecução de proposta antiga com garantia de números inalterados mesmo após inclusão de novas vigências em catálogos (RNF-05).

#### Scenario: Verificação de imutabilidade com catálogos atualizados
- **WHEN** uma proposta histórica fechada em data pretérita é recalculada
- **THEN** o motor utiliza estritamente as versões de catálogo vigentes na data da proposta e reproduz 100% dos valores originais homologados

---

### Requirement: Benchmark de Desempenho e Não-Regressão
O sistema SHALL assegurar que o tempo de recálculo completo de uma oferta complexa (2 linhas, ~500 estruturas) permaneça abaixo de 30 segundos e que o recálculo incremental após alteração pontual execute em menos de 2 segundos (RNF-01 e RNF-16).

#### Scenario: Medição de tempo de recálculo completo
- **WHEN** o pipeline executa o recálculo completo de uma oferta de 500 estruturas
- **THEN** o tempo total de processamento é medido e validado contra o limite de 30 segundos
