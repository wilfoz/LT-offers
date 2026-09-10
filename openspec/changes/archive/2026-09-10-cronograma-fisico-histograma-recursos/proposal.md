## Why

Na planilha original `Calculo LT`, o planejamento executivo da obra (abas `CR1` a `CR10`, `Precip`, `Canteiros`, `H1` a `H10` e `HT`) utiliza matrizes densas de fórmulas temporais com vínculos manuais, alto risco de fórmulas quebradas, limites artificiais de 10 linhas e ausência de simulação dinâmica de cenários de chuva e alocação de recursos. A produtividade real das frentes de serviço (abertura de acessos, escavação de fundações, concretagem, montagem de torres e lançamento de cabos) sofre forte variação climática sazonal dependendo da UF e da época do ano (RN-16), impactando diretamente as durações, custos de mobilização/desmobilização, canteiros de obra e os picos de demanda de mão de obra e equipamentos.

Esta change implementa a **Fase F4 (Módulos M07 — Cronograma Físico e M08 — Histograma de Recursos e Canteiros)** do roadmap de modernização (§13 de `requisitos-calculo-lt.md`), entregando um motor puro e determinístico de cronograma e histograma (`libs/calc-engine`), contratos de domínio para atividades, equipes, canteiros e curvas de recursos (`libs/domain`), serviços de persistência e orquestração (`apps/api`) e interface visual com gráficos de Gantt interativos, matrizes mensais e histogramas comparativos (`apps/web`).

## What Changes

- **Contratos de Domínio para Cronograma e Recursos (`libs/domain`):**
  - Definição de grupos de atividades do setor de transmissão: Indiretos, Pátios e Canteiros, Obras Preliminares, Obras Civis (Fundações e Escavações), Montagem Eletromecânica de Estruturas, Lançamento de Condutores/OPGW e Comissionamento/Testes (**RF-35**).
  - Entidades para atividades de cronograma, vínculo com quantitativos de engenharia de M05, equipes alocadas (`WorkCrew`), taxas de produção nominal e limites máximos de produção (**RN-15**, **RF-36**, **RF-38**).
  - Modelagem de canteiros de apoio à obra (canteiro central/principal e canteiros avançados) com custos de implantação, manutenção mensal, quadro de pessoal e desmobilização (**RF-41**).
  - Modelagem de marcos contratuais: Licença de Instalação (LI) e Licença de Operação / Entrada em Operação Comercial (LO) por função de transmissão (**RF-39**).
  - Estruturas de dados para curvas temporais: histograma mensal de pessoal por categoria/cargo (diretos vs indiretos) e histograma de equipamentos (próprios, alugados e déficit) (**RF-42**, **RF-43**, **RF-44**).

- **Motor de Cálculo Puro e Determinístico de Cronograma e Recursos (`libs/calc-engine`):**
  - Motor de produtividade e chuva: aplicação de matriz de precipitação histórica por UF/região, aplicando redutores de produtividade em 5 níveis climáticos (**RF-37**, **RN-16**).
  - Cálculo paramétrico de durações: determinação de meses/dias necessários a partir do quantitativo de engenharia, tamanho da equipe e produção efetiva ajustada por chuva (**RF-36**).
  - Validação de consistência operacional: alerta impeditivo quando a produção exigida no cronograma ultrapassa a capacidade máxima declarada da equipe ou quando a atividade extrapola o prazo da linha (**RF-38**, **RN-15**).
  - Distribuição temporal de custos de equipes e canteiros: cálculo de mobilização inicial, custo recorrente mensal (salários, encargos, benefícios, alimentação, viagens e alojamento conforme **RN-14**), custos anuais e desmobilização (**RF-36**, **RF-41**).
  - Agregador de histogramas: consolidação por linha e total do projeto, separando mão de obra direta de indireta e balanceando parque próprio de equipamentos contra déficit a locar (**RF-42**, **RF-43**, **RF-44**, **RN-17**).

- **Backend API & Serviços NestJS (`apps/api`):**
  - Endpoints REST para configuração e consulta de cronogramas: `/api/lines/:lineId/schedule`, `/activities`, `/crews/allocation`, `/camps` e `/milestones`.
  - Endpoints REST para histogramas analíticos: `/api/lines/:lineId/histograms/manpower`, `/histograms/equipment` e `/api/offers/:offerId/histograms/consolidated`.
  - Tabelas de precipitação histórica por UF e versionamento de calendários de obra.

- **Frontend Angular (`apps/web`):**
  - Aba e visualizador do **Cronograma Físico (M07)**: visualização em gráfico de Gantt e tabela temporal configurável (escala mensal/semanal), com indicação de marcos LI/LO e avisos de sobreprodução (**RF-35**, **RF-38**, **RF-39**, **RF-40**).
  - Módulo de **Canteiros de Obra**: painel de dimensionamento de canteiro central e avançados (**RF-41**).
  - Painel analítico de **Histograma de Recursos (M08)**: gráficos de barras empilhadas e curvas S de mão de obra (direta vs indireta) e equipamentos (próprios vs aluguel vs déficit), com filtros por linha e exportação de dados (**RF-42**, **RF-43**, **RF-44**, **RF-45**).

## Capabilities

### New Capabilities
- `cronograma`: Planejamento temporal físico de linhas de transmissão, decomposição de atividades em grupos padronizados, alocação de equipes, cálculo de durações ponderadas por precipitação (RN-16), marcos contratuais e modelagem de canteiros (M07).
- `histograma`: Consolidação de curvas mensais de mão de obra e equipamentos, segregação de diretos e indiretos, identificação de picos de alocação e balanço de disponibilidade própria vs locação (M08).

### Modified Capabilities
<!-- Nenhuma capability existente tem seus requisitos alterados. -->

## Impact

- **Código:**
  - `libs/domain`: novos modelos em `libs/domain/src/lib/schedule/`, `libs/domain/src/lib/camps/` e `libs/domain/src/lib/histogram/`.
  - `libs/calc-engine`: novos calculadores `PrecipitationCalculator`, `ScheduleCalculator`, `CampCalculator`, `HistogramCalculator` e fixtures de teste unitário.
  - `apps/api`: novos módulos `schedule` e `histogram` integrados aos módulos de ofertas, catálogos e quantitativos.
  - `apps/web`: novos componentes de Gantt, gestão de canteiros e histogramas interativos.
- **APIs:** Novos endpoints sob `/api/lines/:lineId/schedule` e `/api/lines/:lineId/histograms`.
- **Dependências:** Inclusão de biblioteca de visualização de dados e gráficos de alta performance no Angular se necessário (sem dependências externas que quebrem determinismo).
