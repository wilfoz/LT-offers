## Why

Durante o levantamento inicial de requisitos da migração da planilha "Calculo LT", registrou-se no §02 que as produtividades das frentes de obra, os coeficientes de terreno/acesso e as matrizes pluviométricas foram inicialmente tratados como hipóteses de trabalho simplificadas. 

Com a conclusão da cadeia de cálculo (F0 a F7) e a homologação da suíte de paridade (§14), torna-se necessário formalizar e calibrar finamente esses parâmetros de engenharia (§02, RF-14, RF-15, RF-21, RF-35..RF-39, RN-14..RN-16), permitindo que:
1. As taxas de produção padrão e limites máximos de equipes reflitam a realidade das frentes de campo para diferentes tipologias de linhas e relevos;
2. Os fatores de correção de produtividade por dificuldade de acesso (`NORMAL`, `DIFFICULT`, `CROSSING`) e relevo afetem diretamente o cálculo de duração e custos no cronograma;
3. Os coeficientes geotécnicos de perdas, empolamento e compactação sejam explicitamente parametrizados na quantificação de escavação e bota-fora de fundações;
4. As curvas de sazonalidade e perda de turno por precipitação pluviométrica (`PrecipitationCalculator`) incorporem o mapa consolidado por UF/Região geográfica.

## What Changes

- **Calibração de Taxas de Equipes de Trabalho**: Refinamento das taxas teóricas nominais (`standardProductionRate`) e limites de sobreprodução (`maxMonthlyProductionPerCrew`) para as composições de escavação, montagem de estruturas e lançamento de cabos (simples, 2x, 4x e 6x condutores por fase).
- **Fatores de Correção de Campo e Acesso no Cronograma**: Incorporação de multiplicadores de esforço e redução de produtividade baseados na severidade de acesso por torre/trecho (`NORMAL` = 1.0x, `DIFFICULT` = 1.25x, `CROSSING` = 1.60x) na determinação da duração e alocação de equipes (RN-15).
- **Parâmetros Geotécnicos de Empolamento e Perdas**: Adição e aplicação explícita dos fatores de empolamento (20%–30%) e perdas de escavação/concreto no motor de cálculo de fundações (`FoundationQuantityEngine`).
- **Matriz Pluviométrica Regional Aprimorada**: Calibração dos coeficientes mensais de redução por UF (`PrecipitationCalculator`) cobrindo as 27 unidades federativas brasileiras, alinhadas aos índices climatológicos do INMET para obras lineares de transmissão (RN-16).
- **Padronização e Validação de Unidades Físicas**: Garantia de integridade em todas as unidades de engenharia (UTS em kN, I²t em kA²·s, diâmetros em mm, pesos em ton/km, taxas em km/mês e fundações/mês).

## Capabilities

### New Capabilities
- `parametros-engenharia-campo`: Gestão centralizada e consulta de coeficientes de campo (fatores de acesso, relevo, empolamento e calibração de produtividade) aplicáveis ao planejamento físico e geotécnico de linhas de transmissão.

### Modified Capabilities
- `catalogos/equipes-trabalho`: Atualização dos requisitos de parametrização e validação de taxas nominais/máximas e unidades de produção para equipes especializadas de transmissão.
- `cronograma`: Atualização dos requisitos de cálculo de durações e velocidades de avanço considerando fatores de acesso ponderados e matriz pluviométrica regional completa (RF-35..RF-39, RN-15, RN-16).
- `fundacoes`: Atualização dos requisitos de cálculo de volumes de escavação, reaterro e bota-fora considerando fatores de empolamento e perdas por tipo de solo (RF-21, RN-13).

## Impact

- **Motor de Cálculo (`libs/calc-engine`)**: Atualização do `ScheduleCalculator`, `PrecipitationCalculator` e `FoundationQuantityEngine` com suporte aos novos coeficientes e cálculo ponderado de acesso.
- **Domínio (`libs/domain`)**: Novos contratos e tipos para coeficientes de campo (`FieldAdjustmentFactors`, `SoilExpansionConfig`).
- **Serviços & API (`apps/api`)**: Suporte a endpoints e migrações para coeficientes de campo e atualização dos seeders/catálogos padrão.
- **Frontend (`apps/web`)**: Exibição e ajuste de coeficientes nos painéis de cronograma e visualização de impacto nos histogramas.
- **Compatibilidade & Paridade**: Compatibilidade retroativa garantida; ofertas já congeladas mantêm histórico íntegro sem mutação retroativa (RNF-05).
