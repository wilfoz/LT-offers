## MODIFIED Requirements

### Requirement: Aplicação de Fatores de Sobre-escavação, Desperdício e Reaterro (RN-12, RF-24)
O sistema SHALL (DEVE) aplicar os fatores regulamentares de sobre-escavação, empolamento e perdas sobre os volumes teóricos brutos:
1. Sobre-escavação por tipo de terreno: solo duro (10%), solo normal (5%), solo com água (20%), tubulão (5%);
2. Empolamento volumétrico para bota-fora e transporte de corte: solo normal (25%), solo duro/rocha (40%), solo saturado/lama (20%);
3. Desperdício de concreto estrutural e de regularização: 5%;
4. Desperdício de aço: 10% para aço de reforço/armadura e 3% para aço de tubulão;
5. Reaterro compactado calculado pela diferença entre o volume total escavado e o volume de concreto/estrutura enterrada, acrescido do fator de compactação de 15%.

#### Scenario: Aplicação de sobre-escavação em solo com água
- **WHEN** o volume teórico de escavação de uma fundação em solo com água for de 40.000 m³
- **THEN** o sistema aplica o acréscimo de 20% de sobre-escavação, totalizando 48.000 m³ com separação explícita entre valor teórico (40.000 m³) e sobre-escavação (8.000 m³)

#### Scenario: Aplicação de perdas de aço e concreto
- **WHEN** a armadura teórica da fundação for de 1.500,00 kg de aço e 12,000 m³ de concreto
- **THEN** o sistema calcula 1.650,00 kg de aço (10% de perda) e 12,600 m³ de concreto (5% de perda), mantendo as memórias de cálculo rastreáveis

#### Scenario: Balanço de reaterro compactado
- **WHEN** o volume escavado total for de 50,000 m³ e o volume de concreto enterrado for de 15,000 m³ em solo com fator de compactação de 15%
- **THEN** o sistema calcula o volume de reaterro compactado necessário em 35,000 m³

#### Scenario: Cálculo de volume de bota-fora com fator de empolamento
- **WHEN** o volume escavado excedente não aproveitado para reaterro for de 15,000 m³ em solo com empolamento de 25%
- **THEN** o sistema calcula o volume solto para transporte e bota-fora em $15,000 \times 1,25 = 18,750\text{ m³}$
