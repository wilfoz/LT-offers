## Context

Ver `proposal.md` para motivação e `specs/cronograma/spec.md` e `specs/histograma/spec.md` para contratos de comportamento.

A Fase F4 do projeto substitui as abas de cronograma e histograma da planilha original (`CR1..CR10`, `Precip`, `Canteiros`, `H1..H10`, `HT`) por um sistema unificado. O planejamento físico conecta os quantitativos físicos consolidados no Módulo M05 (toneladas de torres, km de cabos, m³ de escavação e concreto, unidades de isoladores) com o catálogo de equipes de trabalho (`WorkCrew`) de M03, aplicando os custos de mão de obra e benefícios por UF (RN-14), taxas de produção nominal/máxima (RN-15), curvas de precipitação pluviométrica histórica (RN-16) e balanceamento de equipamentos (RN-17).

## Goals / Non-Goals

**Goals:**
- Implementar motor de cálculo puro em `libs/calc-engine` para cronograma físico, parametrização de produtividade com redutor de chuva (5 faixas), distribuição de custos temporais (mobilização, mensal recorrente, desmobilização) e agregação de histogramas mensais.
- Modelar canteiros principal e avançados com estrutura de custos fixos, implantação e quadro de pessoal de apoio (mão de obra indireta).
- Gerar curvas analíticas de histograma de mão de obra (por cargo e tipo) e de equipamentos (próprios, alugados e déficit) no nível da linha e consolidado no projeto.
- Fornecer API REST em `apps/api` e interface gráfica em `apps/web` com visualização de Gantt, grid mensal configurável e gráficos interativos de histogramas.

**Non-Goals:**
- Algoritmos de nivelamento automático por inteligência artificial ou substituição de ferramentas de gestão de portfólio corporativo (Primavera/MS Project) — o objetivo é a orçamentação e planejamento da proposta EPC conforme a planilha de referência.
- Cálculo de serviços terceirizados, medições contratuais e folha de preços do edital — estes pertencem ao Módulo M09 (Fase F5).
- Desembolso financeiro, fluxo de caixa e cálculo de BDI — estes pertencem aos Módulos M10 e M11 (Fase F5).

## Decisions

### 1. Representação Temporal em Grid Mensal Discretizado
- **Decisão:** O motor de cálculo trabalhará com uma linha do tempo indexada por mês de projeto ($M_1, M_2, \dots, M_n$), suportando data base de início da obra e cálculo de datas reais de calendário para cruzamento com os meses climáticos (ex.: Janeiro a Dezembro).
- **Alternativa considerada:** Cronograma contínuo em milissegundos/dias absolutos. Rejeitado por aumentar desnecessariamente a complexidade e divergir da metodologia de orçamentação e fechamento mensal de propostas EPC de transmissão.

### 2. Vinculação Dinâmica entre Atividades de Cronograma e Quantitativos de M05
- **Decisão:** Cada atividade de cronograma possui uma referência explícita à fonte de quantitativo (`quantitySource`), podendo derivar automaticamente de:
  - `TOTAL_TOWERS` ou `TOWER_TONNAGE` (do inventário de estruturas M05);
  - `TOTAL_FOUNDATIONS`, `EXCAVATION_VOLUME` ou `CONCRETE_VOLUME` (de fundações M05);
  - `CONDUCTOR_KM`, `GROUND_WIRE_KM` ou `OPGW_KM` (de cabos M05);
  - `ROW_CLEARING_HA` ou `ACCESS_KM` (de serviços preliminares M05);
  - Quantidade manual informada para itens específicos.
- **Alternativa considerada:** Entrada puramente manual de quantidades no cronograma. Rejeitado para evitar inconsistências entre a engenharia eletromecânica/civil e o cronograma.

### 3. Matriz de Precipitação e Redutor de Produtividade (RN-16)
- **Decisão:** Criação de um catálogo de precipitação média histórica por UF e mês ($12 \times 27\text{ UFs}$), categorizado em 5 faixas de pluviosidade:
  - Nível 1: Seco / Muito Baixa ($< 50\text{ mm}$) $\rightarrow$ Fator de produtividade $1,00$;
  - Nível 2: Baixa ($50 - 100\text{ mm}$) $\rightarrow$ Fator $0,95$;
  - Nível 3: Média ($100 - 200\text{ mm}$) $\rightarrow$ Fator $0,85$;
  - Nível 4: Alta ($200 - 300\text{ mm}$) $\rightarrow$ Fator $0,75$;
  - Nível 5: Severa ($> 300\text{ mm}$) $\rightarrow$ Fator $0,65$.
- **Alternativa considerada:** Fator linear contínuo. Rejeitado para manter paridade com as faixas discretas da planilha `Precip`.

### 4. Modelo de Histograma e Balanço de Frota Própria (RN-17)
- **Decisão:** A agregação de recursos decompõe as equipes alocadas mês a mês em suas tabelas de mão de obra (`crew.members`) e equipamentos (`crew.equipment`). Para equipamentos, a demanda total é confrontada com o parque próprio disponível informado na oferta:
  $$\text{Déficit a Alugar}(mês) = \max(0, \text{Demanda Total}(mês) - \text{Frota Própria}).$$
- **Alternativa considerada:** Considerar todo equipamento como locação externa. Rejeitado pois distorce o custo real de propostas com frota interna amortizada.

### 5. Arquitetura Frontend de Visualização (Gantt & Histogramas)
- **Decisão:** Implementação de componentes Angular dedicados com layout SVG/CSS para o diagrama de Gantt interativo e renderização visual moderna de histogramas em barras empilhadas e curvas acumuladas, mantendo responsividade e fidelidade visual Swiss Design.

## Risks / Trade-offs

- **[Risco: Conflito de início de atividade antes de marcos contratuais LI/LO]** $\rightarrow$ *Mitigação:* O motor valida e sinaliza violações de predecessores e marcos como avisos impeditivos na API e na interface.
- **[Risco: Discrepância em anos bissextos ou contagem de dias úteis]** $\rightarrow$ *Mitigação:* Utilização de convenção padrão de 22 dias úteis / 220 horas por homem-mês, com precisão decimal exata (`DecimalValue`).
- **[Risco: Desempenho de agregação de histogramas em projetos com dezenas de linhas]** $\rightarrow$ *Mitigação:* Agregação em memória via motor puro TypeScript com complexidade $O(N_{linhas} \times N_{atividades} \times N_{meses})$, executando em menos de 10 ms.
