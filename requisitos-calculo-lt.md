# Requisitos para substituir a planilha Calculo LT

> Levantamento de requisitos derivado da leitura completa, aba a aba, do modelo de orçamentação usado nas propostas EPC de linhas de transmissão no Brasil. O documento descreve o que a planilha faz hoje, as regras de negócio que ela codifica, os requisitos de um sistema que a substitua e as evidências técnicas que justificam a substituição.

| | |
|---|---|
| **Arquivo** | `Calculo LT - AXIA-INSTALACAO DE PR - OPGW-2025-029_R2.xlsm` |
| **Origem** | criado em 07/02/2000 · revisado em 22/06/2026 |
| **Base da análise** | OOXML integral (150 planilhas, VBA, nomes definidos, validações) |
| **Versão web** | https://claude.ai/code/artifact/4bbb36a5-e74a-4f45-921a-27223c815902 |

---

## 01. Sumário executivo

### Uma plataforma de estimativa disfarçada de planilha

O arquivo não é um orçamento. É um **sistema de estimativa paramétrica completo** para propostas EPC de linhas de transmissão no Brasil: parte da lista de estruturas exportada do PLS-CADD, calcula quantitativos de engenharia, aplica um motor tributário brasileiro por unidade federativa, monta cronograma físico mês a mês, dimensiona equipes e equipamentos, gera histogramas de recursos, projeta o desembolso e fecha com preço de venda por linha e por lote.

| Indicador | Valor | Detalhe |
|---|---|---|
| planilhas | **150** | 70 visíveis / 80 ocultas |
| fórmulas | **1,88 M** | em 3,1 M de células |
| compactado | **37,2 MB** | ~400 MB em XML |
| células em erro | **15.665** | no estado salvo |

O modelo cobre **até 10 linhas de transmissão simultâneas** dentro de um mesmo lote de leilão, replicando o mesmo bloco de cálculo dez vezes (`E1..E10`, `CR1..CR10`, `S1..S10`, `H1..H10`, `R1..R10`, `D1..D10`, `Risk1..Risk10`) e consolidando em abas totalizadoras (`HT`, `RT`, `DT`). Essa replicação por cópia é a principal causa estrutural do tamanho, da lentidão e da fragilidade do arquivo.

A conclusão da análise é direta: **o conhecimento de engenharia e comercial embutido no arquivo tem alto valor e deve ser preservado; o veículo Excel chegou ao fim da vida útil.** Há 888 mil ocorrências de funções voláteis (`OFFSET`, `INDIRECT`, `TODAY`), 26.320 nomes definidos — dos quais 18.217 apontam para `#REF!` — e uma cadeia de cálculo (`calcChain.xml`) de 52 MB. O modelo já opera com cálculo manual forçado por macro para permanecer utilizável.

> **Recomendação**
>
> Migrar para uma aplicação web com motor de cálculo em servidor e banco relacional, preservando a planilha como formato de entrada e saída (importação de estaqueamento, exportação de BOQ e planilha de preços do edital). A migração deve ser faseada e validada por paridade numérica contra revisões históricas reais, não por reescrita de uma vez só.

---

## 02. Método da análise

### O que foi lido e como

A análise foi feita sobre o pacote OOXML descompactado, sem abrir o arquivo no Excel — o que evita recálculo, preserva os valores em cache e permite inspecionar partes que a interface esconde.

- **Estrutura** — `workbook.xml`, relações e estado de visibilidade das 150 abas.
- **Conteúdo** — as 150 planilhas foram parseadas célula a célula (fórmula + valor em cache + strings compartilhadas), gerando um dump legível de cabeçalhos, primeiras linhas de dados e amostras de fórmulas.
- **Grafo de dependências** — contagem de referências entre abas extraída das fórmulas, usada para inferir a ordem real do pipeline de cálculo.
- **Semântica** — nomes definidos, tabelas estruturadas, validações de dados (listas suspensas) e formatação condicional.
- **Automação** — extração de strings do `vbaProject.bin` para identificar módulos, formulários e gatilhos.
- **Saúde** — contagem de erros em cache por aba, funções voláteis e nomes quebrados.

As abas replicadas por linha foram amostradas pelos representantes de cada família (`E1`, `CR1`, `S1`, `H1`, `R1`, `D1`, `Risk1`, `M1`, `PU1`) e comparadas com as demais para confirmar que são cópias estruturais.

> **Limite do levantamento**
>
> Este documento descreve *o que o modelo faz*, extraído do próprio modelo. Não substitui a validação com os autores: parte das constantes (produtividades, preços de referência, coeficientes de venda) carrega premissas de obras anteriores — Solaris, Tucano, leilões de 2021–2025 — que precisam ser confirmadas antes de virarem regra de sistema.

---

## 03. Anatomia do artefato

### Números que definem o problema

| Dimensão | Valor | Leitura |
|---|---|---|
| Planilhas | 150 | 70 visíveis, 80 ocultas — metade da complexidade é invisível ao usuário |
| Células materializadas | 3.101.572 | inclui células formatadas vazias, que também pesam no arquivo |
| Fórmulas | 1.877.471 | a lógica de negócio está distribuída em quase 1,9 milhão de pontos |
| Células mescladas | 52.764 | principal obstáculo a leitura programática e a validação |
| Formatações condicionais | 7.220 | regras visuais que carregam significado de negócio não documentado |
| Nomes definidos | 26.320 | 15.160 únicos; apenas ~360 tem semântica de negócio |
| Nomes apontando para `#REF!` | 18.217 | 69% do catálogo de nomes está quebrado |
| Funções voláteis | 888.198 | `OFFSET`, `INDIRECT`, `TODAY` — recalculam a cada edição |
| Células em erro (estado salvo) | 15.665 | 6.058 `#N/A`, 4.199 `#DIV/0!`, 3.854 `#VALUE!`, 1.554 `#REF!` |
| Gráficos incorporados | 264 | histogramas de recursos e curvas de desembolso |
| Tabelas estruturadas | 24 | as únicas areas com contrato de dados explícito |
| Validações de dados | 201 | listas suspensas — o domínio controlado de entrada |
| Cadeia de cálculo | 52 MB | `calcChain.xml` sozinho — indicador direto do custo de recálculo |
| Proteção de planilha | 1 aba | praticamente nenhuma célula de fórmula está protegida contra sobrescrita |
| Vínculos externos | 0 | o arquivo é autocontido — ponto favorável a migração |

#### Automação VBA existente

O projeto VBA contém três módulos (`Codigo`, `Histogramas`, `Cronogramas`), seis formulários (`FormResumen`, `FormHistogramaPersonal`, `FormHistogramaEquipamentos`, `FormSeleccionFila`, `FormBorradoEquipo`, `FormCronoChange`) e uma faixa de opções customizada. As funções identificadas revelam requisitos implícitos que precisam existir no sistema novo:

- carimbo automático de **usuário e data da última modificação** no salvamento;
- modo **"mostrar apenas abas em uso"**, que oculta as linhas não utilizadas do lote;
- alternância de **cálculo manual** para tornar a edição viável;
- propagação em cascata da **renomeação de cargos e equipamentos** para a aba de composições;
- navegação guiada entre cronograma, histograma e resumo;
- uso de **atingir meta** para fechar preço de venda a partir de margem alvo.

---

## 04. Mapa de domínios

### As 150 abas em doze domínios funcionais

Toda aba do arquivo pertence a um destes doze domínios. A coluna "replicação" indica onde a estrutura foi copiada por linha de transmissão — e portanto onde o sistema novo deve usar uma única implementação parametrizada.

|   | Domínio | Abas | Replicação | Responsabilidade |
|---|---|---|---|---|
| A | Configuração da oferta | 5 | — | Identificação do leilão, prazos ANEEL, matriz de responsabilidade escopo × contratante, câmbio, tributos e listas derivadas |
| B | Bases de dados de engenharia | 10 | — | Catálogos mestres: cabos, torres, isoladores, solos e fundações, mão de obra, equipamentos, custos fixos |
| C | Equipes e composições | 2 | — | Catálogo de equipes com produção teórica e composição analítica de pessoal e equipamento |
| D | Estaqueamento | 10 | `E1..E10` | Lista de estruturas importada do PLS-CADD com solo, fundação, acesso e cabo por torre |
| E | Quantitativos de engenharia | 15 | — | Condutores, cabos de guarda, torres, tirantes, cadeias, aterramento, fundações, acessos, limpeza, travessias |
| F | Preços e tributos de materiais | 9 | — | Preços por fornecedor e moeda, curva de commodities, motor ICMS/IPI/PIS-COFINS/DIFAL/FECOEP |
| G | Indiretos e canteiros | 7 | — | Estrutura de obra, canteiros, insumos, engenharia, clima, meio ambiente e fundiário |
| H | Cronograma e recursos | 21 | `CR1..CR10`, `H1..H10`, `HT` | Cronograma físico mensal por atividade e histograma de pessoal e equipamentos |
| I | Serviços e orçamento contratual | 25 | `S1..S10`, `M/PU`, `BOQ` | Consolidação de serviços, decisão própria × subcontratada, planilhas no formato do edital |
| J | Resultado econômico | 19 | `R1..R10`, `RT` | Custo, impostos, coeficientes de venda, BDI, margem e simulações de preço |
| K | Desembolso e fluxo de caixa | 15 | `D1..D10`, `DT` | Distribuição mensal de custo e faturamento, entregas de materiais, cashflow do contratante |
| L | Risco e controle de qualidade | 12 | `Risk1..Risk10` | Matriz de riscos ponderada e painéis de verificação de consistência interna |

O inventário completo, aba por aba, com contagem de células e fórmulas, esta no anexo.

---

## 05. Modelo de domínio

### As entidades que o sistema precisa persistir

O modelo conceitual abaixo foi inferido das tabelas estruturadas, das listas de validação e dos padrões de `INDEX/MATCH` entre abas. Ele separa **catálogo** (dados corporativos, compartilhados entre ofertas) de **oferta** (dados de uma proposta específica).

#### Catálogo corporativo — versionado, compartilhado

| Entidade | Atributos-chave | Origem |
|---|---|---|
| Cabo condutor | codigo, peso ton/km, bobina, diâmetro, UTS | `DB_CAL` |
| Cabo de guarda (aço / OPGW / aço para tirante) | codigo, classe de galvanização, resistência, fios, I²t, fibras, peso, bobina, UTS | `DB_CGA`, `DB_OPGW`, `DB_CTI` |
| Série de estrutura | nome, projetista, tensão, circuitos, cabos por fase, vento de projeto, tipo de isolador, SIL | `DB_TOR` |
| Tipo de torre | série, sigla, função (suspensão / ancoragem), peso por altura, quantidade de estais | `DB_TOR`, `DB_Estructuras` |
| Isolador | tipo, fabricante, perfil, ruptura kN, diâmetro, passo, linha de fuga | `DB_AIS` |
| Tipo de solo | codigo (I, II, III, IV, IVS, R, E, IA...), tensão admissível, peso específico, ângulo de atrito, coesão, faixa NSPT, submerso | `DB_FUN` |
| Tipo de fundação | sapata, tubulão, pré-moldado, ancoragem em rocha, estaca (helicoidal / metálica / concreto / raiz), hélice continua, micropilote | `DB_TPF`, `DB_VOL` |
| Cargo | nome, salário base, periculosidade, hora extra, DSR, encargos, alimentação, tipo de alojamento, folgas, viagem, plano de saúde, seguro de vida | `DB_MO` (280 cargos) |
| Equipamento | codigo, aluguel externo, aluguel interno, preço de compra, anos de amortização, disponibilidade própria, combustível, manutenção | `DB_EQ` (~295 itens) |
| Custo fixo | item, tipo (EPI, exames, mob/demob, roupa, viagens), custo, descrição | `DB_FI` |
| Equipe de trabalho | descrição, produção máxima teórica por unidade e período, composição de cargos e equipamentos com quantidades | `Equipos` + `DesEquipos` |
| Alíquota tributária | ICMS intra e interestadual por par origem–destino, base dupla DIFAL, FECOEP, IPI por NCM, PIS/COFINS | `Datos`, `Aux_ICMS`, `Aux_IPI` |
| Parâmetro regional | cesta básica e salário-teto por UF, custo de alojamento por categoria, custo de viagem | `Datos` |

#### Oferta — escopo de uma proposta

| Entidade | Atributos-chave | Cardinalidade |
|---|---|---|
| Oferta / Lote | leilão, lote, cliente, data da oferta, data do leilão, início do cronograma, entrada em operação (edital), CAPEX ANEEL, RAP máxima e vencedora, moeda | 1 |
| Revisão | número, data de fechamento, data de entrega, observações, autor | 1..n por oferta |
| Matriz de responsabilidade | por item de escopo: responsável (cliente / contratada), aceita faturamento direto, risco cambial, risco LME/Midwest | ~22 itens |
| Linha de transmissão | tensão, extensão, circuitos, cabos por fase, UF de destino 1 e 2 com percentual, função de transmissão, prazo de LI, prazo de construção, % RAP | 1..10 por oferta |
| Estrutura (torre) | número, estaca, coordenadas E/N, cota, tipo, altura, extensão de perna, solo, tipo de fundação, tipo de acesso, vão | centenas a milhares por linha |
| Quantitativo de material | codigo, artigo, unidade, quantidade teórica, extra (%), sobressalente, por linha | ~330 itens por linha |
| Cotação de material | fornecedor, moeda, fator de conversão, preço, UF de origem | 1..n por item |
| Atividade de cronograma | grupo, atividade, quantidade, unidade, equipe alocada, produção, duração, mês de início, custo mensal | ~900 linhas por linha de LT |
| Item de serviço | codigo, descrição, unidade, quantidade, custo próprio, custo subcontratado, resultado final, codigo CIP do contratante | ~175 por linha |
| Risco | categoria, situação na proposta, consideração, impacto sobre custo, ponderação, extra-custo | ~35 por linha |
| Coeficiente de venda | garantias, seguros, produção, IDDE, risco país, financeiros, contingências, estrutura, margem | por linha e consolidado |

---

## 06. Cadeia de cálculo

### Do estaqueamento ao preço de venda

O grafo de dependências entre abas revela um pipeline de nove estágios. Cada seta representa referências reais medidas nas fórmulas — não um fluxo idealizado.

```
ENTRADA        1 Estaqueamento (E1..E10 <- PLS-CADD)
               2 Configuração (Info&Cond / Datos / Aux)
               3 Catálogos (DB_* / Equipos / DesEquipos)
               + camada de listas derivadas (LU / Aux -- UNIQUE, FILTER, INDIRECT)
                          |
QUANTITATIVOS  4 Quantitativos de engenharia ----> 5 Consolidação de materiais
                 Torres, Conductores, CG,            Cantidades -> Precios
                 Cadenas, Suelos, Fundaciones,       -> Impuestos -> Materiales
                 Accesos                                        |
                          |                                     |
PLANEJAMENTO   6 Cronograma físico ----> 7 Histograma de recursos
                 CR1..CR10                H1..H10 -> HT
                          |                        |
FECHAMENTO     8 Serviços e resultado --> 9 Desembolso e caixa --> Saídas contratuais
                 S1..S10 -> R1..R10          D1..D10 -> DT           BOQ CIP
                 -> RT, K, BDI               ENTREGAS, Cashflow      Planilha com BDI
                                                    |               Folha de medição
                                                    +--- realimentação: as entregas
                                                         ponderam a curva de commodities
```

#### Dependências mais pesadas medidas

| Aba | Depende de | Referências | Natureza do acoplamento |
|---|---|---|---|
| `DesEquipos` | `CR1`, `CR2`, `CR3` | ~2,9 M | `OFFSET` + `COUNTIFS` por equipe e por mês — o ponto mais caro do arquivo |
| `HT` | `H1..H10` | ~485 k | soma dos histogramas de todas as linhas com deslocamento por mês |
| `H1` | `DesEquipos`, `Indirectos` | ~121 k | `SUMIFS` sobre janela deslizante de 4.036 linhas |
| `DT` | `D1..D10` | ~47 k | consolidação linha a linha do desembolso |
| `Materiales` | `Impuestos`, `Cantidades` | ~25 k | aplicação do resultado tributário sobre o quantitativo |
| `Equipos` | `DesEquipos` | 9.000 | `INDEX/MATCH` por equipe para trazer o custo diário |
| `Aux` | `Torres`, `Cadenas`, `CG`, `Conductores` | ~12 k | montagem das listas usadas nas validações de entrada |

---

## 07. Regras de negócio

### O conhecimento a preservar

Regras extraídas diretamente das fórmulas. Cada uma precisa ser confirmada com os autores e depois implementada como regra explícita, testável e versionada — não como fórmula em célula.

| ID | Regra | Evidência |
|---|---|---|
| RN-01 | Um lote comporta até 10 linhas de transmissão. Cada linha tem tensão, extensão, circuitos, cabos por fase e até duas UFs de destino com percentual de rateio. | `Datos!B6:V15` |
| RN-02 | O prazo contratual é contado da assinatura do contrato de concessão; a data de entrada em operação do edital define o limite. O sistema alerta quando o prazo de construção ultrapassa a concessão ou quando a antecipação ocorre antes da necessidade. | `Datos!N27` |
| RN-03 | Para cada item de escopo define-se o responsável (cliente ou contratada). Itens de responsabilidade do cliente entram com custo zero, mas permanecem visíveis na estrutura de resultado marcados como "(Cliente)". | `Info&Cond!Q57:Q105`, `R1!C9` |
| RN-04 | O faturamento direto ao cliente altera a base tributária: PIS/COFINS só não incide quando o cliente detém REIDI *e* aceita faturamento direto, ou quando a contratada é cohabilitada no REIDI. | `Impuestos!E6:E11` |
| RN-05 | ICMS é calculado por par UF de origem × UF de destino, com tratamento de base dupla para DIFAL onde a UF exige, adicional FECOEP quando aplicável e alíquota de 4% para importados. | `Datos!D133:AE160`, `Aux_ICMS` |
| RN-06 | IPI é definido por NCM segundo a TIPI, com registro paralelo do valor do leilão anterior para comparação entre revisões. | `Datos!C102:I126`, `Aux_IPI` |
| RN-07 | O preço do condutor e do cabo de guarda de alumínio é formado por (LME + Midwest ou RTDU) × câmbio + prêmio do fabricante, e não por preço de tabela. | `Datos!I46`, `LMEUSD` |
| RN-08 | A escolha entre cotação spot e curva de futuros depende de quem assume o risco de commodity e de câmbio: se o risco é da contratada usa-se futuro; se e do cliente, spot. | `Datos!N42:N45` |
| RN-09 | A curva de futuros é ponderada pelas toneladas efetivamente entregues em cada mês, extraídas do cronograma de entregas — não pela média simples do período. | `Futuros!D6` (`SUMPRODUCT`) |
| RN-10 | Cada material recebe percentual de quantidade extra por linha, cobrindo quebras, perdas e desperdício (torres 0,5%; ferragens 1–2%; cabos de aço 3%). | `Datos!C56:O79` |
| RN-11 | Cabos recebem incremento adicional por flecha e, no OPGW, por descidas até a caixa de emenda. | `Datos!D88:O91` |
| RN-12 | O volume de escavação recebe sobre-escavação por tipo de terreno (duro 10%, normal 5%, com água 20%, tubulão 5%); concreto recebe 5%; aço de reforço 10% e aço de tubulão 3% de desperdício. | `Datos!C259:O276` |
| RN-13 | O tipo de fundação de cada torre resulta do cruzamento entre solo classificado e tipo de estrutura; volumes e armaduras vêm de tabela paramétrica por combinação. | `Suelos`, `DB_FUN`, `Fundaciones` |
| RN-14 | O custo mensal de um cargo agrega salário, periculosidade, hora extra, DSR sobre extras, encargos, cesta básica (apenas abaixo do salário-teto da UF), alimentação, alojamento por categoria, folgas com viagem, plano de saúde e seguro de vida. | `DB_MO!D:Q` |
| RN-15 | Cada equipe tem produção máxima teórica declarada em três unidades e períodos diferentes; a produção efetiva do cronograma não pode exceder a máxima, e a violação gera erro explícito. | `Equipos!D:L`, `CR1!K3` |
| RN-16 | A produtividade mensal é reduzida por faixa de precipitação da UF, classificada em cinco níveis de chuva. | `Precip`, `CR1!AR5` |
| RN-17 | Equipamentos podem ser precificados por aluguel externo, aluguel interno (fator sobre o externo), ou compra amortizada; a estratégia considera a disponibilidade própria por mês contra o pico do histograma. | `DB_EQ!D:S` |
| RN-18 | Os indiretos de projeto são rateados entre linhas por critério configurável (por padrão, extensão) e distribuídos no tempo pelo mês de início e fim de cada função. | `Indirectos!AI5:AR7` |
| RN-19 | Cada item de serviço pode ser executado por meios próprios, por subcontratado cotado, ou por custo de cronograma ajustado por fator; o resultado final é a combinação escolhida, com verificação de que as quantidades somam o total. | `S1!G:R` |
| RN-20 | Todo item de serviço e materiais carrega o codigo CIP do contratante, permitindo emitir a planilha de preços no formato exigido pelo edital. | `S1!Y`, `BOQ-EdoB-*` |
| RN-21 | O preço de venda é formado por coeficientes aplicados sobre a venda: garantias (adiantamento, cumprimento, qualidade), seguros, imposto sobre produção, risco país, financeiros, contingências e estrutura, além da margem. | `K`, `BDI`, `Sim` |
| RN-22 | Garantias são calculadas sobre percentual do contrato pelo período de LI mais construção, com opção de tratamento global ou por linha. | `K!E8:E15` |
| RN-23 | A contingência total resulta da matriz de riscos ponderada por categoria (fundiário, ambiental, prazo, clima, terceiros), gerando extra-custo somado ao coeficiente base. | `Risk1!G:L` |
| RN-24 | O desembolso de suprimentos segue curva percentual por item ao longo dos meses; o de serviços acompanha a curva física do cronograma. Marcos de LI e LO por função de transmissão ancoram o faturamento. | `D1!M9`, `ENTREGAS` |
| RN-25 | Quando o lote é tratado como "linhas independentes", engenharia e ensaios de torre não são compartilhados entre linhas; caso contrário, o projeto de torres é rateado. | `Datos!G18`, `Ingenieria!N14` |
| RN-26 | O preço de torres é reajustado anualmente ao longo do cronograma, aplicando índice sobre a parcela ainda não entregue. | `Precio torre rev. anual` |

---

## 08. Requisitos funcionais

### O que o sistema deve fazer

`obrigatório` paridade com a planilha atual · `importante` resolve limitação conhecida · `desejável` ganho incremental

#### M01 — Cadastro e versionamento de oferta

*Origem na planilha: Info&Cond · Datos · Aux*

| ID | Requisito | Prioridade |
|---|---|---|
| RF-01 | Criar oferta com leilão, lote, cliente, datas de oferta e leilão, início de cronograma, entrada em operação do edital, CAPEX estimado e RAP máxima e vencedora. | obrigatório |
| RF-02 | Manter histórico de revisões com número, data de fechamento, data de entrega, autor e observações, permitindo comparar duas revisões item a item. | obrigatório |
| RF-03 | Registrar automaticamente autor e data da última alteração de cada entidade. | obrigatório |
| RF-04 | Editar a matriz de responsabilidade por item de escopo, com os quatro eixos: responsável, aceite de faturamento direto, risco cambial e risco de commodity. | obrigatório |
| RF-05 | Configurar linhas do lote (1 a n, sem o limite artificial de 10) com tensão, extensão refinada e de relatório, circuitos, cabos por fase e UFs de destino com rateio. | importante |
| RF-06 | Clonar uma oferta inteira como ponto de partida de nova proposta, preservando rastreabilidade da origem. | importante |

#### M02 — Catálogos de engenharia

*Origem na planilha: DB_CAL · DB_CGA · DB_OPGW · DB_CTI · DB_TOR · DB_AIS · DB_FUN*

| ID | Requisito | Prioridade |
|---|---|---|
| RF-07 | Manter catálogos de cabos (condutor, guarda de aço, OPGW, aço para tirante) com peso, bobina, diâmetro e UTS. | obrigatório |
| RF-08 | Manter catálogo de séries de estruturas com projetista, tensão, circuitos, cabos por fase, vento de projeto e tipo de isolamento, e o detalhamento de tipos de torre com peso por altura. | obrigatório |
| RF-09 | Manter catálogo de tipos de solo com parâmetros geotécnicos e faixa de NSPT, e a matriz solo × tipo de fundação com volumes e armaduras. | obrigatório |
| RF-10 | Versionar cada catálogo com data de vigência, de modo que uma oferta fechada continue reproduzindo os valores usados na época. | importante |
| RF-11 | Impedir exclusão de item de catálogo referenciado por oferta ativa e sinalizar itens sem dados obrigatórios. | obrigatório |

#### M03 — Recursos: mão de obra, equipamentos e equipes

*Origem na planilha: DB_MO · DB_EQ · DB_FI · Equipos · DesEquipos*

| ID | Requisito | Prioridade |
|---|---|---|
| RF-12 | Calcular o custo mensal de empresa por cargo conforme RN-14, com parâmetros regionais de cesta básica, alojamento e viagem por UF. | obrigatório |
| RF-13 | Manter equipamentos com as três estratégias de precificação (aluguel externo, aluguel interno, compra amortizada) e recomendar a estratégia por comparação com a disponibilidade própria. | obrigatório |
| RF-14 | Compor equipes de trabalho a partir de cargos e equipamentos com quantidades, calculando custo diário, hora-homem e hora-máquina. | obrigatório |
| RF-15 | Declarar produção máxima teórica de cada equipe em múltiplas unidades e períodos, com conversão automática entre hora, dia, semana e mês. | obrigatório |
| RF-16 | Renomear cargo ou equipamento propagando a alteração para todas as composições, sem quebra de vínculo. | obrigatório |
| RF-17 | Reajustar salários em lote por índice ou percentual, registrando a data e a origem do reajuste. | importante |

#### M04 — Estaqueamento e dados por torre

*Origem na planilha: E1..E10*

| ID | Requisito | Prioridade |
|---|---|---|
| RF-18 | Importar a lista de estruturas exportada do PLS-CADD (número, estaca, ajuste de altura, offset, ângulo, coordenadas E/N, cota) validando tipos e duplicidades. | obrigatório |
| RF-19 | Atribuir a cada torre solo, tipo de fundação, tipo de acesso e cabo, por seleção individual ou por regra em lote (faixa de estacas, trecho, tipo de estrutura). | obrigatório |
| RF-20 | Validar que a quantidade de torres do estaqueamento coincide com a quantidade declarada na linha e que toda combinação solo × fundação existe no catálogo. | obrigatório |
| RF-21 | Suportar entrada manual quando o estaqueamento ainda não existe, com distribuição percentual estimada de solos e tipos de fundação. | obrigatório |
| RF-22 | Reimportar um estaqueamento revisado preservando as atribuições já feitas nas torres que não mudaram. | importante |

#### M05 — Quantitativos de engenharia

*Origem na planilha: Torres · Conductores · CG · Cadenas · Fundaciones · Cantidades*

| ID | Requisito | Prioridade |
|---|---|---|
| RF-23 | Calcular quantitativos de torres por tipo e peso, condutores e cabos de guarda em toneladas e km, tirantes, cross-rope, cadeias, amortecedores, sinalização e aterramento. | obrigatório |
| RF-24 | Calcular volumes de escavação, concreto, aço e reaterro por tipo de fundação, aplicando sobre-escavação, incrementos e desperdícios (RN-12). | obrigatório |
| RF-25 | Calcular acessos por grau de dificuldade, limpeza de faixa por tipo de vegetação e travessias. | obrigatório |
| RF-26 | Consolidar o quantitativo por item de material separando teórico, extra e sobressalente, por linha e no total. | obrigatório |
| RF-27 | Rastrear, para qualquer quantidade consolidada, a lista de torres e a regra que a originaram. | importante |

#### M06 — Preços, commodities e tributos

*Origem na planilha: Precios · Futuros · LMEUSD · Impuestos · Materiales*

| ID | Requisito | Prioridade |
|---|---|---|
| RF-28 | Registrar cotações por item, fornecedor, moeda e UF de origem, com conversão pela tabela de câmbio da oferta e seleção do fornecedor vencedor. | obrigatório |
| RF-29 | Sinalizar todo item com quantidade e sem preço, bloqueando o fechamento da revisão enquanto houver pendência. | obrigatório |
| RF-30 | Formar preço de alumínio por LME + Midwest/RTDU + prêmio, com escolha entre spot e curva de futuros conforme a alocação de risco (RN-07, RN-08). | obrigatório |
| RF-31 | Ponderar a curva de commodities pelas toneladas entregues por mês, a partir do cronograma de entregas (RN-09). | obrigatório |
| RF-32 | Calcular ICMS de origem e destino, DIFAL com base dupla quando aplicável, FECOEP, IPI por NCM e PIS/COFINS, respeitando REIDI e faturamento direto. | obrigatório |
| RF-33 | Manter as tabelas tributárias como dado versionado com vigência e base legal, atualizável sem alterar o motor de cálculo. | importante |
| RF-34 | Demonstrar, para qualquer item, a memória de cálculo tributário tributo a tributo. | importante |

#### M07 — Cronograma físico

*Origem na planilha: CR1..CR10 · Precip · Canteiros*

| ID | Requisito | Prioridade |
|---|---|---|
| RF-35 | Montar cronograma por linha com a estrutura de grupos: indiretos, pátios e canteiros, preliminares, obras civis, montagem de torres, lançamento de cabos e comissionamento. | obrigatório |
| RF-36 | Alocar equipes a cada atividade, calcular duração a partir da quantidade e da produção, e distribuir custo mês a mês com mobilização, custo recorrente, anual e desmobilização. | obrigatório |
| RF-37 | Aplicar fator de produtividade por precipitação mensal da região (RN-16). | obrigatório |
| RF-38 | Sinalizar atividade cuja produção exigida excede a produção máxima da equipe ou cuja quantidade não é cumprida no prazo. | obrigatório |
| RF-39 | Marcar no cronograma os marcos de licença de instalação e entrada em operação de cada função de transmissão. | obrigatório |
| RF-40 | Permitir escala de tempo em dia, semana ou mês sem refazer o cronograma. | desejável |
| RF-41 | Modelar canteiros (principal e avançados) com quadro de pessoal, mobilização, custo mensal e desmobilização. | obrigatório |

#### M08 — Histograma de recursos

*Origem na planilha: H1..H10 · HT*

| ID | Requisito | Prioridade |
|---|---|---|
| RF-42 | Gerar histograma mensal de pessoal por função e de equipamentos por tipo, por linha e consolidado no projeto. | obrigatório |
| RF-43 | Separar no histograma o pessoal direto do pessoal indireto e identificar a atividade que gera cada pico. | importante |
| RF-44 | Comparar o pico de cada equipamento com a disponibilidade própria e apontar o déficit a contratar por mês. | obrigatório |
| RF-45 | Exportar histogramas em gráfico e em tabela para uso na proposta técnica. | obrigatório |

#### M09 — Serviços e orçamento contratual

*Origem na planilha: S1..S10 · BOQ · M/PU · planilhas do edital*

| ID | Requisito | Prioridade |
|---|---|---|
| RF-46 | Consolidar cada item de serviço com as três origens de custo (cronograma próprio, cronograma ajustado por fator, subcontratado cotado) e validar que as quantidades fecham com o total. | obrigatório |
| RF-47 | Associar cada item ao codigo CIP do contratante e emitir a planilha de preços no layout do edital, com BDI e subtotais hierárquicos. | obrigatório |
| RF-48 | Gerar folha de medição e folha de preços unitários por linha a partir do mesmo orçamento. | obrigatório |
| RF-49 | Calcular indicadores de custo por km e por torre por grupo de serviço, comparáveis entre linhas e entre ofertas históricas. | importante |
| RF-50 | Suportar múltiplos layouts de planilha do edital sem alterar o motor de cálculo. | importante |

#### M10 — Resultado econômico e formação de preço

*Origem na planilha: R1..R10 · RT · K · BDI · Sim*

| ID | Requisito | Prioridade |
|---|---|---|
| RF-51 | Apresentar o resultado por linha e consolidado com as colunas custo líquido, PIS/COFINS, IPI, ICMS origem, DIFAL, FECOEP, custo com impostos, faturamento direto, custo próprio, sobressalentes e venda. | obrigatório |
| RF-52 | Parametrizar coeficientes de venda por linha: garantias, seguros, imposto sobre produção, IDDE, risco país, financeiros, contingências, estrutura e margem. | obrigatório |
| RF-53 | Simular preço de venda a partir de margem alvo e, inversamente, calcular a margem resultante de um preço imposto, comparando com revisões anteriores. | obrigatório |
| RF-54 | Projetar a corrosão do resultado pelo IPCA acumulado ao longo do contrato. | obrigatório |
| RF-55 | Avaliar contingências construtivas (troca de tipo de torre, de fundação ou de solo) e medir o impacto no resultado. | importante |
| RF-56 | Comparar duas revisões da mesma oferta mostrando a variação por grupo e a causa raiz (quantidade, preço unitário, tributo ou coeficiente). | importante |

#### M11 — Desembolso e fluxo de caixa

*Origem na planilha: D1..D10 · DT · ENTREGAS · Cashflow*

| ID | Requisito | Prioridade |
|---|---|---|
| RF-57 | Distribuir custo e faturamento mês a mês por item, com curva percentual editável para suprimentos e curva física para serviços. | obrigatório |
| RF-58 | Gerar cronograma de entregas de materiais em percentual por mês, realimentando a ponderação da curva de commodities. | obrigatório |
| RF-59 | Consolidar o fluxo de caixa do projeto com marcos contratuais e apontar o pico de exposição financeira. | obrigatório |
| RF-60 | Exportar o cronograma de faturamento no formato exigido pelo contratante. | obrigatório |

#### M12 — Risco, verificação e governança

*Origem na planilha: Risk1..Risk10 · Checks · ToDo*

| ID | Requisito | Prioridade |
|---|---|---|
| RF-61 | Manter matriz de riscos por linha com categoria, situação na proposta, consideração adotada, impacto sobre o custo, ponderação e extra-custo resultante. | obrigatório |
| RF-62 | Executar uma bateria de verificações de consistência e exibir o resultado em painel único, com link direto para o dado que falhou. | obrigatório |
| RF-63 | Bloquear o fechamento de uma revisão enquanto houver verificação crítica em falha, permitindo exceção justificada e registrada. | importante |
| RF-64 | Controlar acesso por perfil: engenharia (quantitativos), suprimentos (preços), planejamento (cronograma), comercial (coeficientes e margem), administrador (catálogos). | importante |
| RF-65 | Registrar trilha de auditoria de toda alteração em dado de oferta e em catálogo. | importante |

---

## 09. Requisitos não funcionais

### As restrições que decidem a arquitetura

| ID | Requisito | Critério de aceite |
|---|---|---|
| RNF-01 | Recálculo completo de uma oferta com 2 linhas e ~500 torres | abaixo de 30 s; recálculo incremental após edição pontual abaixo de 2 s |
| RNF-02 | Capacidade de estaqueamento | suportar ao menos 5.000 torres por linha sem degradação perceptível |
| RNF-03 | Número de linhas por lote | sem limite fixo de 10; o limite passa a ser de dados, não de estrutura |
| RNF-04 | Determinismo | a mesma oferta com os mesmos catálogos produz exatamente o mesmo resultado, em qualquer máquina e em qualquer data |
| RNF-05 | Reprodutibilidade histórica | reabrir uma oferta fechada há dois anos reproduz seus números originais, mesmo com catálogos já atualizados |
| RNF-06 | Rastreabilidade | qualquer valor exibido permite abrir a memória de cálculo até os dados de entrada |
| RNF-07 | Colaboração | vários usuários editando módulos distintos da mesma oferta simultaneamente, sem bloqueio de arquivo |
| RNF-08 | Precisão numérica | aritmética decimal em valores monetários; arredondamento explícito e documentado por tipo de valor |
| RNF-09 | Ausência de estados de erro | nenhum valor propagado pode ser indefinido; toda ausência de dado é tratada e sinalizada, nunca convertida em zero silencioso |
| RNF-10 | Importação | aceitar arquivo PLS-CADD e planilhas de cotação com relatório de erros linha a linha antes de gravar |
| RNF-11 | Exportação | gerar XLSX no layout do edital e do contratante, com formatação e hierarquia preservadas |
| RNF-12 | Auditabilidade | trilha imutável com autor, data, valor anterior e novo |
| RNF-13 | Backup e retenção | ponto de recuperação diário e retenção das ofertas por, no mínimo, o prazo de garantia dos contratos |
| RNF-14 | Idioma e localização | interface em português do Brasil, com dicionário de equivalência para os termos em espanhol herdados do modelo |
| RNF-15 | Portabilidade das regras | regras tributárias, coeficientes e produtividades são configuração versionada, alteráveis sem novo deploy |
| RNF-16 | Testabilidade | o motor de cálculo executa sem interface, permitindo suite automatizada por regra de negócio |
| RNF-17 | Segurança | autenticação corporativa, autorização por perfil e por oferta; dados de custo e margem restritos |
| RNF-18 | Continuidade | exportação integral de uma oferta em formato aberto, garantindo que o dado não fique preso ao novo sistema |

---

## 10. Integrações

### As fronteiras do sistema

| Interface | Direção | Conteúdo | Situação hoje |
|---|---|---|---|
| PLS-CADD | entrada | lista de estruturas com estaca, coordenadas, cotas, tipo e altura | copiar e colar manual nas abas `E1..E10` |
| Projeto de fundações | entrada | volumes e armaduras por combinação solo × fundação | tabela paramétrica em `DB_FUN`, atualizada a mão |
| Cotações de fornecedores | entrada | preço por item, moeda, UF de origem, condição | digitação em `Precios`, uma coluna por fornecedor |
| Cotações de commodities | entrada | curva LME, Midwest/RTDU e câmbio futuro | colagem manual em `Futuros`, sem carimbo de origem |
| Tabelas tributárias | entrada | ICMS por par de UF, TIPI por NCM, FECOEP, base dupla | abas auxiliares atualizadas manualmente (TIPI de 13/06/2025) |
| Planilha de preços do edital | saída | itens com BDI no layout do contratante | abas dedicadas por lote, montadas a mão |
| BOQ padrão CIP | saída | orçamento por codigo CIP do contratante | `BOQ-EdoB-*`, com fórmulas em erro |
| Cronograma de faturamento | saída | desembolso mensal por função de transmissão | `SIMULACAO CELEO`, `CASHFLOW` |
| Proposta técnica | saída | histogramas, cronograma físico, plano de canteiros | gráficos incorporados, copiados manualmente |
| ERP corporativo | bidirecional | orçamento aprovado vira baseline de execução | **inexistente** — há reinício completo do dado ao ganhar a obra |

> **Oportunidade de maior retorno**
>
> A ausência de ponte entre a proposta e a execução é a lacuna mais cara do processo atual. O modelo já produz, na proposta, a estrutura analítica, o cronograma, o histograma de recursos e a curva de desembolso — exatamente os artefatos que a obra reconstrói do zero. Persistir esse dado em banco torna a baseline de execução uma consequência da proposta, e não um novo trabalho.

---

## 11. Achados de qualidade

### Evidências que sustentam a decisão de migrar

#### Catálogo de nomes corrompido — `AQ-01 · crítico`

Dos 26.320 nomes definidos, 18.217 apontam para `#REF!`. O catálogo acumulou lixo de décadas: nomes legados do Lotus 1-2-3 (`__123Graph_*`) replicados com prefixos de sublinhado crescentes, nomes de ferramentas de BI antigas e centenas de nomes de teste (`asdf`, `aaaa`, `abc`). Além do peso, há risco funcional real: nomes com escopo de planilha apontando para `#REF!` podem sombrear o nome global correspondente dentro daquela aba.

*evidência · 15.160 nomes únicos, 11.215 com escopo de planilha, ~360 com semântica de negócio*

#### Volatilidade que inviabiliza o recálculo — `AQ-02 · crítico`

888.198 ocorrências de `OFFSET`, `INDIRECT` e `TODAY`. Funções voláteis recalculam a cada alteração de qualquer célula, independentemente de dependência. A aba `DesEquipos` concentra 726 mil pares `OFFSET`+`COUNTIFS`. O uso de `TODAY()` em `LMEUSD` e em datas padrão significa que **abrir o arquivo em outro dia pode mudar o resultado**.

*evidência · calcChain.xml de 52 MB; macro de cálculo manual presente no VBA "para ganhar rapidez"*

#### Erros propagados no estado salvo — `AQ-03 · crítico`

15.665 células gravadas em erro. Concentrações relevantes: `Impuestos` com 3.410 `#N/A`, `Torres` com 1.633 `#VALUE!`, `Tirantes` com 1.334 `#VALUE!`, `Materiales` com 670 erros mistos. A aba `IPCa` tem `VLOOKUP` apontando para `'D1'!#REF!`. O painel `Checks` exibe 300 `#REF!` — ou seja, **o mecanismo de verificação está ele próprio quebrado**.

*evidência · #N/A 6.058 · #DIV/0! 4.199 · #VALUE! 3.854 · #REF! 1.554*

#### Verificações reportando falha sem bloqueio — `AQ-04 · alto`

A aba `Check cantid. TOTAL y canteiros` mostra `ERROR` em várias linhas de comparação entre as abas de serviço e o total esperado; `Fundaciones` reporta `Error qtd.` em múltiplos blocos; `E1` alerta que o número de torres não coincide com a lista. Nada disso impede o fechamento da oferta — a validação é informativa, e sua leitura depende de o usuário abrir abas ocultas.

*evidência · 80 das 150 abas estão ocultas, incluindo os dois painéis de verificação*

#### Replicação por cópia como mecanismo de escala — `AQ-05 · alto`

Sete famílias de abas replicadas dez vezes cada. Uma correção de regra exige dez edições idênticas, e as cópias já divergiram: `H7` tem 6.259 fórmulas contra 6.499 das demais; `Tabla_HistogramaPorActividad7` aponta para `'H7'!$C$64:$BK$637` enquanto todas as outras apontam para `$C$637:$BK$642`. São divergências silenciosas que produzem números errados sem qualquer sinal.

*evidência · E, CR, S, H, R, D e Risk — 70 abas geradas por cópia*

#### Ausência de proteção das fórmulas — `AQ-06 · alto`

Apenas uma das 150 abas tem proteção de planilha. Qualquer usuário pode sobrescrever uma fórmula com um valor digitado, e o modelo continuará operando e produzindo um número — errado, mas plausível. Não há separação visual ou técnica confiável entre célula de entrada e célula calculada.

*evidência · 1 aba protegida · 201 validações de dados para ~3,1 M de células*

#### Regra de negócio embutida em constante literal — `AQ-07 · médio`

Valores de negócio aparecem escritos dentro de fórmulas: `N11 = 2172685,19` em `S1`, `(45*180)/10000` como produção de limpeza em `Equipos`, `D34 = 250000` como custo por travessia. São decisões comerciais sem data, sem autor e sem justificativa, invisíveis a qualquer revisão.

*evidência · notas de origem espalhadas: "Solaris MG", "marzo 2022", "Mail de Frank 02/07/2025"*

#### Bilinguismo estrutural — `AQ-08 · médio`

O modelo mistura espanhol (estrutura e nomes: `Cantidades`, `Suelos`, `Fundaciones`) e português (dados operacionais: cargos, canteiros, tributos), com termos equivalentes coexistindo — `Tipos_Suelo` e `Tipos_Solo`, `Lista_TiposSuelo` e `Lista_TiposSuelos`. Isso aumenta o erro de digitação em campos com correspondência exata e dificulta a manutenção por equipe local.

*evidência · nomes duplicados com grafias divergentes no catálogo de listas*

#### Conhecimento concentrado — `AQ-09 · médio`

A aba `ToDo` registra pendências estruturais em aberto pelo próprio autor. O VBA credita "Funciones básicas. Por Igor Salazar". A propriedade de criação aponta um autor de 2000 e a última modificação um usuário atual. Não há documentação do modelo além das notas em células.

*evidência · 26 anos de evolução acumulada, sem especificação escrita*

---

## 12. Arquitetura-alvo

### Separar dado, regra e apresentação

A planilha falha porque mistura as três camadas na mesma célula. A arquitetura proposta as separa, mantendo o Excel apenas como formato de intercâmbio.

| Camada | Responsabilidade | Consequência para os requisitos |
|---|---|---|
| **Dados** — banco relacional | catálogos versionados por vigência, ofertas, revisões, estaqueamento, cotações, trilha de auditoria | atende RNF-05, RNF-07, RNF-12 |
| **Regras** — motor de cálculo em servidor | quantitativos, tributos, cronograma, histograma, resultado; cada regra é uma unidade testável com identificador | atende RNF-04, RNF-08, RNF-16 |
| **Configuração** — parâmetros versionados | alíquotas, coeficientes, produtividades, percentuais de extra e desperdício, curvas de desembolso | atende RNF-15, remove AQ-07 |
| **Apresentação** — aplicação web | edição por módulo, painel de verificações, memória de cálculo, comparação de revisões | atende RF-62, RNF-06 |
| **Intercâmbio** — importadores e exportadores | PLS-CADD, cotações, planilha do edital, BOQ CIP, cronograma de faturamento | atende RNF-10, RNF-11, RNF-18 |

#### Decisões de projeto que a análise já permite fixar

- **Grafo de dependência explícito.** O motor deve declarar dependências entre cálculos e recalcular apenas o subgrafo afetado — o oposto do modelo volátil atual.
- **Sem replicação estrutural.** Uma única implementação de cada módulo, parametrizada por linha. Elimina AQ-05 na origem.
- **Ausência de dado é estado de primeira classe.** Distinguir "zero" de "não informado" e de "não aplicável", propagando a pendência até o painel de verificações em vez de convertê-la em zero.
- **Catálogos com vigência.** Toda oferta referência a versão de catálogo vigente na data da revisão, garantindo reprodutibilidade histórica.
- **Aritmética decimal.** Valores monetários em decimal de precisão fixa, com política de arredondamento declarada por tipo de valor.

---

## 13. Roadmap

### Migração por fatias verificáveis

Reescrever 1,9 milhão de fórmulas de uma vez é inviável. A sequência abaixo entrega valor em cada fase e mantém a planilha operando até a fase final.

| Fase | Entrega | Módulos | Como se prova |
|---|---|---|---|
| F0 | Estabilização da planilha atual: limpeza do catálogo de nomes, correção dos erros propagados, proteção das células de fórmula, painel de verificações visível e bloqueante | — | zero `#REF!` em nomes; zero erro em célula que alimenta resultado |
| F1 | Catálogos corporativos em banco, com versionamento por vigência e interface de manutenção | M02, M03 | a planilha passa a consumir os catálogos exportados do sistema |
| F2 | Estaqueamento e quantitativos de engenharia | M04, M05 | paridade numérica com `Cantidades` em três ofertas históricas |
| F3 | Motor de preços e tributos | M06 | paridade com `Materiales`, item a item, incluindo DIFAL e FECOEP |
| F4 | Cronograma, histograma e canteiros | M07, M08 | paridade de duração, custo mensal e pico de recursos |
| F5 | Serviços, resultado econômico e desembolso | M09, M10, M11 | paridade de venda total e de fluxo de caixa |
| F6 | Risco, governança, perfis de acesso e exportadores contratuais | M12 | oferta completa emitida pelo sistema, sem uso da planilha |
| F7 | Ponte com a execução: baseline de obra derivada da proposta ganha | — | primeira obra iniciada com cronograma e curva vindos da proposta |

> **Sobre a fase F0**
>
> A estabilização não é trabalho jogado fora. Ela reduz o risco das propostas em andamento durante toda a migração e, ao forçar a correção dos erros, revela regras que hoje estão mascaradas por células em `#N/A` — informação necessária para especificar as fases seguintes.

---

## 14. Validação e aceite

### Paridade numérica como critério

Nenhuma fase é aceita por inspeção visual. O critério é a reprodução dos números de ofertas reais já fechadas.

- **Conjunto de referência** — selecionar de três a cinco ofertas históricas de perfis distintos: uma linha única, um lote com múltiplas linhas, uma com predominância de estrutura estaiada e uma com fundação especial.
- **Congelamento de entradas** — para cada oferta, extrair e versionar as entradas (estaqueamento, cotações, parâmetros, coeficientes) como fixtures de teste.
- **Tolerância declarada** — paridade exata em quantitativos discretos (torres, bobinas, cadeias); tolerância de 0,01% em valores monetários agregados, sempre com justificativa da diferença.
- **Teste por regra** — cada regra RN recebe casos de teste próprios, incluindo os limites: linha com duas UFs de destino, cliente com REIDI, risco de commodity do cliente, torre em rocha, mês com precipitação máxima.
- **Teste de reprodução histórica** — reabrir oferta antiga após atualização de catálogos e confirmar que os números não mudaram.
- **Teste de não regressão de desempenho** — medir o tempo de recálculo a cada fase contra RNF-01.

> **Cuidado necessário na comparação**
>
> As ofertas de referência contém, elas próprias, células em erro e verificações em falha. Antes de usar uma oferta como baseline é preciso decidir, caso a caso, se o número da planilha é o valor correto ou o valor histórico. Divergências em que o sistema novo estiver certo devem ser registradas como correções, não como falhas de paridade.

---

## 15. Glossário

### Termos do modelo

| Termo | No modelo | Significado |
|---|---|---|
| BDI | `BDI` | Beneficios e despesas indiretas — percentual sobre o custo que forma o preço de venda |
| Canteiro | `Canteiros` | Base de apoio a obra; principal ou avançado, com alojamento e pátio de materiais |
| Cesta básica | `Datos` | Beneficio alimentar por convenção coletiva, devido abaixo de um salário-teto por UF |
| CIP | `S1!Y` | Codigo de item padronizado do contratante, usado no BOQ (ex.: `GR02.04.05`) |
| Cross-rope | `Crossrope` | Estrutura estaiada com mastros interligados por cabo, sem treliça convencional |
| DIFAL | `Impuestos` | Diferencial de alíquota de ICMS entre origem e destino em operação interestadual |
| Estaiada | `Torres` | Torre sustentada por tirantes ancorados no solo |
| FECOEP | `Impuestos` | Fundo estadual de combate a pobreza — adicional de ICMS em algumas UFs |
| Folgas | `DB_MO` | Período de descanso do trabalhador alojado, com custo de viagem associado |
| Fundiário | `Fundiario` | Liberação de faixa de servidão e indenização a proprietários |
| Histograma | `H1..HT` | Curva de pessoal ou equipamento ao longo dos meses de obra |
| LI / LO | `Datos` | Licença de instalação / entrada em operação — marcos contratuais |
| LME / Midwest / RTDU | `Futuros` | Referências de preço do alumínio: bolsa de metais e prêmios regionais |
| OPGW | `DB_OPGW` | Cabo de guarda com fibras ópticas embutidas |
| RAP | `Info&Cond` | Receita anual permitida — remuneração da concessão definida no leilão |
| REIDI | `Impuestos` | Regime especial que suspende PIS/COFINS em obras de infraestrutura |
| Sobre-escavação | `Datos` | Volume escavado acima do teórico, por folga construtiva |
| Tirante | `Tirantes` | Cabo de aço que estaia a torre, ancorado em fundação própria |
| UTS | `DB_CAL` | Carga de ruptura do cabo |
| Vão médio | `Torres` | Distância média entre estruturas consecutivas |

---

## 16. Anexo

### Inventário completo das 150 abas

Ordem original do arquivo. A coluna de domínio remete a seção 04. Contagens medidas diretamente no XML.

| # | Aba | Dom. | Estado | Células | Fórmulas | Papel no modelo |
|---|---|---|---|---|---|---|
| 1 | `Info&Cond` | A | visível | 1.232 | 9 | Cabeçalho da oferta, revisões e matriz de responsabilidade escopo x contratante |
| 2 | `Datos` | A | visível | 3.685 | 282 | Parâmetros globais: linhas, prazos, câmbio, ICMS/IPI/PIS-COFINS, cesta básica, alojamento, sobre-escavações |
| 3 | `Futuros` | F | visível | 1.211 | 865 | Curva de futuros LME / Midwest / RTDU / dólar ponderada pelas toneladas entregues por mês |
| 4 | `Equipos` | C | visível | 6.536 | 4.698 | Catálogo de equipes de trabalho com produções teóricas e custo diário consolidado |
| 5 | `DesEquipos` | C | visível | 920.009 | 795.339 | Composição analítica de cada equipe (mão de obra por cargo + equipamentos por codigo) |
| 6 | `DB_CAL` | B | visível | 2.109 | 351 | Base de cabos de alumínio (peso, bobina, diâmetro, UTS) |
| 7 | `DB_CGA` | B | visível | 461 | 49 | Base de cabos de guarda de aço (classe de galvanização, resistência, fios) |
| 8 | `DB_OPGW` | B | visível | 461 | 49 | Base de cabos OPGW (fabricante, I2t, fibras, bobina) |
| 9 | `DB_CTI` | B | visível | 911 | 99 | Base de cabos de aço para tirantes e interligação |
| 10 | `DB_TOR` | B | visível | 35.429 | 15.007 | Base de séries de estruturas e torres (projetista, tensão, circuitos, vento, isolador) |
| 11 | `DB_AIS` | B | visível | 410 | 49 | Base de isoladores (fabricante, ruptura, passo, linha de fuga) |
| 12 | `DB_FUN` | B | visível | 87.502 | 12.724 | Base de fundações: solos, tipos, volumes e armaduras paramétricas |
| 13 | `DB_MO` | B | visível | 4.954 | 2.027 | Base de mão de obra: salário, periculosidade, HE, encargos, alimentação, alojamento, folgas, saúde |
| 14 | `DB_EQ` | B | visível | 9.849 | 4.191 | Base de equipamentos: aluguel externo/interno, compra, amortização, disponibilidade |
| 15 | `DB_FI` | B | visível | 515 | 100 | Base de custos fixos (EPI, exames, mob/demob, roupa, viagens) |
| 16 | `E4` | D | oculta | 35.438 | 3.026 | Tabela de estaqueamento da linha 4 (saída PLS-CADD): estrutura, estaca, coordenadas, solo, fundação, acesso |
| 17 | `E5` | D | oculta | 39.374 | 3.005 | Tabela de estaqueamento da linha 5 (saída PLS-CADD): estrutura, estaca, coordenadas, solo, fundação, acesso |
| 18 | `E6` | D | oculta | 34.598 | 3.005 | Tabela de estaqueamento da linha 6 (saída PLS-CADD): estrutura, estaca, coordenadas, solo, fundação, acesso |
| 19 | `E7` | D | oculta | 34.598 | 1.505 | Tabela de estaqueamento da linha 7 (saída PLS-CADD): estrutura, estaca, coordenadas, solo, fundação, acesso |
| 20 | `E8` | D | oculta | 34.573 | 1.505 | Tabela de estaqueamento da linha 8 (saída PLS-CADD): estrutura, estaca, coordenadas, solo, fundação, acesso |
| 21 | `E9` | D | oculta | 34.573 | 1.505 | Tabela de estaqueamento da linha 9 (saída PLS-CADD): estrutura, estaca, coordenadas, solo, fundação, acesso |
| 22 | `E10` | D | oculta | 34.573 | 1.505 | Tabela de estaqueamento da linha 10 (saída PLS-CADD): estrutura, estaca, coordenadas, solo, fundação, acesso |
| 23 | `Conductores` | E | visível | 2.055 | 730 | Consolidação de condutores por linha e toneladas totais |
| 24 | `CG` | E | visível | 4.528 | 2.390 | Consolidação de cabos de guarda (aço, alumínio, OPGW) e sobressalentes |
| 25 | `Torres` | E | visível | 42.374 | 27.107 | Inventário de torres por linha: tipo, quantidade, peso, vão médio, sobressalentes |
| 26 | `E1` | D | visível | 35.365 | 2.937 | Tabela de estaqueamento da linha 1 (saída PLS-CADD): estrutura, estaca, coordenadas, solo, fundação, acesso |
| 27 | `E2` | D | visível | 39.060 | 2.548 | Tabela de estaqueamento da linha 2 (saída PLS-CADD): estrutura, estaca, coordenadas, solo, fundação, acesso |
| 28 | `E3` | D | oculta | 39.214 | 3.005 | Tabela de estaqueamento da linha 3 (saída PLS-CADD): estrutura, estaca, coordenadas, solo, fundação, acesso |
| 29 | `Tirantes` | E | visível | 9.674 | 6.427 | Tirantes por linha e por tipo de cabo |
| 30 | `Crossrope` | E | oculta | 3.672 | 1.899 | Cabos de cross-rope (interligação de mastros e suspensão de fases) |
| 31 | `Cadenas` | E | visível | 9.978 | 3.943 | Cadeias e isoladores por tipo de torre e por cabo |
| 32 | `Amortiguacion` | E | visível | 3.047 | 840 | Sistema de amortecimento por condutor e vão médio |
| 33 | `Señalizacion` | E | visível | 245 | 176 | Sinalização (esferas, balizadores, placas) por linha |
| 34 | `Tierras` | E | visível | 1.102 | 275 | Malha de aterramento, hastes e cercas |
| 35 | `Impuestos` | F | visível | 49.043 | 38.408 | Motor tributário sobre materiais: ICMS origem/destino, DIFAL, FECOEP, IPI, PIS/COFINS, REIDI |
| 36 | `Precio torre rev. anual` | F | oculta | 1.568 | 1.446 | Reajuste anual do preço de torres ao longo do cronograma |
| 37 | `Cantidades` | E | visível | 13.693 | 10.301 | Quantitativos consolidados de materiais: teórico + extra + sobressalente por linha |
| 38 | `Precios` | F | visível | 7.502 | 2.682 | Preços unitários de materiais por fornecedor, moeda e estado de origem |
| 39 | `Materiales` | F | visível | 49.974 | 33.543 | Resumo de materiais por linha: quantidade, líquido, impostos, valor final |
| 40 | `Suelos` | E | visível | 2.783 | 1.386 | Distribuição de solos x tipo de fundação por linha e compactação |
| 41 | `Fundaciones` | E | visível | 222.724 | 201.121 | Motor de fundações: volumes, aço e concreto por torre com sobre-escavação e desperdício |
| 42 | `Travesias` | E | visível | 1.568 | 157 | Travessias de LT e de vias principais |
| 43 | `Limpieza` | E | visível | 1.400 | 447 | Limpeza de faixa de servidão (ha e km por tipo de vegetação) |
| 44 | `Accesos` | E | visível | 1.003 | 417 | Acessos por grau de dificuldade (plano / médio / difícil) |
| 45 | `Canteiros` | G | visível | 12.251 | 2.504 | Canteiros: implantação, custo mensal e desmobilização por tipo de canteiro |
| 46 | `Indirectos` | G | visível | 18.044 | 8.515 | Indiretos de projeto: quadro de estrutura, veículos, TI, EPI, viagens e rateio por linha |
| 47 | `Precip` | G | visível | 483 | 58 | Precipitação mensal por linha e classificação de perda de produtividade |
| 48 | `Ingenieria` | G | oculta | 425 | 367 | Engenharia: projeto básico, executivo e projeto de torres |
| 49 | `Insumos` | G | visível | 2.965 | 667 | Insumos por atividade (topografia, civil, montagem, lançamento) |
| 50 | `CR1` | H | visível | 59.728 | 50.446 | Cronograma de serviços mês a mês por linha: quantidades, equipes, durações e custos |
| 51 | `CR2` | H | visível | 54.638 | 44.099 | Cronograma de serviços da linha 2 |
| 52 | `CR3` | H | oculta | 47.354 | 40.427 | Cronograma de serviços da linha 3 |
| 53 | `BOQ-EdoB-1` | I | oculta | 7.623 | 2.143 | Planilha BOQ no padrão CIP do contratante |
| 54 | `BOQ-EdoB-2` | I | oculta | 7.627 | 2.042 | Planilha BOQ padrão CIP da linha 2 |
| 55 | `BOQ-EdoB-3` | I | oculta | 7.626 | 2.040 | Planilha BOQ padrão CIP da linha 3 |
| 56 | `CR4` | H | oculta | 46.674 | 29.095 | Cronograma de serviços da linha 4 |
| 57 | `CR5` | H | oculta | 46.670 | 29.094 | Cronograma de serviços da linha 5 |
| 58 | `CR6` | H | oculta | 46.674 | 29.098 | Cronograma de serviços da linha 6 |
| 59 | `CR7` | H | oculta | 46.672 | 29.095 | Cronograma de serviços da linha 7 |
| 60 | `CR8` | H | oculta | 46.672 | 29.095 | Cronograma de serviços da linha 8 |
| 61 | `CR9` | H | oculta | 46.672 | 29.095 | Cronograma de serviços da linha 9 |
| 62 | `CR10` | H | oculta | 46.672 | 29.095 | Cronograma de serviços da linha 10 |
| 63 | `S1` | I | visível | 4.898 | 2.809 | Total de serviços por linha: execução própria x subcontratado, com codigos CIP |
| 64 | `S2` | I | visível | 4.976 | 2.707 | Total de serviços da linha 2 |
| 65 | `S3` | I | visível | 4.674 | 2.510 | Total de serviços da linha 3 |
| 66 | `S4` | I | oculta | 3.156 | 1.517 | Total de serviços da linha 4 |
| 67 | `S5` | I | oculta | 3.530 | 1.512 | Total de serviços da linha 5 |
| 68 | `S6` | I | oculta | 3.317 | 1.511 | Total de serviços da linha 6 |
| 69 | `S7` | I | oculta | 3.314 | 1.510 | Total de serviços da linha 7 |
| 70 | `S8` | I | oculta | 3.315 | 1.510 | Total de serviços da linha 8 |
| 71 | `S9` | I | oculta | 3.314 | 1.510 | Total de serviços da linha 9 |
| 72 | `S10` | I | oculta | 3.314 | 1.510 | Total de serviços da linha 10 |
| 73 | `Ratios coste` | I | oculta | 3.631 | 1.440 | Ratios de custo por km e por torre para benchmarking entre linhas |
| 74 | `AXIA SUDESTE` | I | visível | 1.262 | 88 | Planilha de preços com BDI no formato do edital (por lote / linha) |
| 75 | `AXIA NORTE` | I | oculta | 1.146 | 43 | Planilha de preços com BDI para o lote NORTE |
| 76 | `AXIA NORDESTE` | I | oculta | 1.146 | 47 | Planilha de preços com BDI para o lote NORDESTE |
| 77 | `AXIA SUL` | I | visível | 1.198 | 91 | Planilha de preços com BDI para o lote SUL |
| 78 | `Aux_ICMS` | F | oculta | 6.479 | 0 | Tabela auxiliar de alíquotas ICMS intra e interestaduais com base legal |
| 79 | `Aux_IPI` | F | oculta | 6.096 | 0 | Tabela auxiliar TIPI (NCM x alíquota IPI) |
| 80 | `Serviço Eventual` | I | visível | 146 | 62 | Serviços eventuais com BDI |
| 81 | `H1` | H | visível | 48.221 | 47.143 | Histograma mensal de pessoal e equipamentos da linha |
| 82 | `H2` | H | visível | 43.535 | 42.850 | Histograma de recursos da linha 2 |
| 83 | `H3` | H | oculta | 43.535 | 42.603 | Histograma de recursos da linha 3 |
| 84 | `H4` | H | oculta | 43.535 | 6.499 | Histograma de recursos da linha 4 |
| 85 | `H5` | H | oculta | 43.535 | 6.499 | Histograma de recursos da linha 5 |
| 86 | `H6` | H | oculta | 43.535 | 6.499 | Histograma de recursos da linha 6 |
| 87 | `H7` | H | oculta | 43.535 | 6.259 | Histograma de recursos da linha 7 |
| 88 | `H8` | H | oculta | 43.535 | 6.499 | Histograma de recursos da linha 8 |
| 89 | `H9` | H | oculta | 43.535 | 6.499 | Histograma de recursos da linha 9 |
| 90 | `H10` | H | oculta | 43.535 | 6.499 | Histograma de recursos da linha 10 |
| 91 | `HT` | H | visível | 43.548 | 42.887 | Histograma consolidado de pessoal e equipamentos do projeto |
| 92 | `Fundiario` | G | visível | 347 | 130 | Fundiário: servidão, benfeitorias e compensação a proprietários |
| 93 | `MA` | G | visível | 548 | 396 | Gestão ambiental: licenciamento, estudos e programas |
| 94 | `IPCa` | J | visível | 137 | 63 | Projeção de IPCA acumulado ao longo do contrato |
| 95 | `Risk1` | L | visível | 710 | 174 | Análise de riscos da linha: fundiário, ambiental, prazo, clima, terceiros |
| 96 | `Risk2` | L | visível | 671 | 157 | Análise de riscos da linha 2 |
| 97 | `Risk3` | L | oculta | 656 | 144 | Análise de riscos da linha 3 |
| 98 | `Risk4` | L | oculta | 536 | 143 | Análise de riscos da linha 4 |
| 99 | `Risk5` | L | oculta | 535 | 145 | Análise de riscos da linha 5 |
| 100 | `Risk6` | L | oculta | 536 | 145 | Análise de riscos da linha 6 |
| 101 | `Risk7` | L | oculta | 538 | 145 | Análise de riscos da linha 7 |
| 102 | `Risk8` | L | oculta | 537 | 146 | Análise de riscos da linha 8 |
| 103 | `Risk9` | L | oculta | 478 | 111 | Análise de riscos da linha 9 |
| 104 | `Risk10` | L | oculta | 477 | 113 | Análise de riscos da linha 10 |
| 105 | `K` | J | visível | 593 | 237 | Coeficientes de venda: garantias, seguros, financeiros, contingências, estrutura |
| 106 | `R1` | J | visível | 1.317 | 607 | Resultado por linha: custo líquido, impostos, faturamento direto, venda |
| 107 | `M1` | I | oculta | 245 | 57 | Folha de medição contratual por linha |
| 108 | `PU1` | I | oculta | 556 | 151 | Folha de variações / preços unitários por linha |
| 109 | `R2` | J | visível | 1.369 | 608 | Resultado econômico da linha 2 |
| 110 | `M2` | I | oculta | 246 | 57 | Folha de medição da linha 2 |
| 111 | `PU2` | I | oculta | 548 | 120 | Folha de variações da linha 2 |
| 112 | `R3` | J | oculta | 1.321 | 642 | Resultado econômico da linha 3 |
| 113 | `R4` | J | oculta | 1.223 | 588 | Resultado econômico da linha 4 |
| 114 | `R5` | J | oculta | 1.220 | 587 | Resultado econômico da linha 5 |
| 115 | `R6` | J | oculta | 1.220 | 587 | Resultado econômico da linha 6 |
| 116 | `R7` | J | oculta | 1.220 | 587 | Resultado econômico da linha 7 |
| 117 | `R8` | J | oculta | 1.222 | 588 | Resultado econômico da linha 8 |
| 118 | `R9` | J | oculta | 1.220 | 587 | Resultado econômico da linha 9 |
| 119 | `R10` | J | oculta | 1.220 | 587 | Resultado econômico da linha 10 |
| 120 | `M3` | I | oculta | 235 | 50 | Folha de medição da linha 3 |
| 121 | `PU3` | I | oculta | 402 | 72 | Folha de variações da linha 3 |
| 122 | `RT` | J | visível | 1.287 | 482 | Resultado consolidado do lote (soma de R1..R10) |
| 123 | `R` | J | visível | 1.056 | 176 | Resumo executivo de custos do lote em M BRL |
| 124 | `BDI` | J | visível | 259 | 44 | BDI: decomposição da venda em custos Brasil, estrutura e margem |
| 125 | `Resumen` | J | visível | 2.504 | 1.298 | Resumo total por linha (custo, DIFAL, venda) montado via INDIRECT |
| 126 | `Sim` | J | visível | 168 | 135 | Simulações de venda e margem com desconto sobre revisões anteriores |
| 127 | `D1` | K | visível | 4.608 | 2.517 | Cronograma de desembolsos da linha (custo e venda mês a mês) |
| 128 | `D2` | K | visível | 4.550 | 2.510 | Cronograma de desembolsos da linha 2 |
| 129 | `D3` | K | oculta | 4.543 | 1.909 | Cronograma de desembolsos da linha 3 |
| 130 | `D4` | K | oculta | 4.107 | 1.667 | Cronograma de desembolsos da linha 4 |
| 131 | `D5` | K | oculta | 4.107 | 1.667 | Cronograma de desembolsos da linha 5 |
| 132 | `D6` | K | oculta | 4.107 | 1.667 | Cronograma de desembolsos da linha 6 |
| 133 | `D7` | K | oculta | 4.107 | 1.667 | Cronograma de desembolsos da linha 7 |
| 134 | `D8` | K | oculta | 4.107 | 1.667 | Cronograma de desembolsos da linha 8 |
| 135 | `D9` | K | oculta | 4.107 | 1.667 | Cronograma de desembolsos da linha 9 |
| 136 | `D10` | K | oculta | 4.107 | 1.667 | Cronograma de desembolsos da linha 10 |
| 137 | `DT` | K | visível | 5.295 | 3.601 | Cronograma de desembolsos consolidado do projeto |
| 138 | `REPUEST. CELEO` | K | oculta | 5.146 | 981 | Sobressalentes no formato do contratante |
| 139 | `SIMULAÇÃO CELEO` | K | oculta | 4.543 | 2.790 | Simulação de faturamento no formato do contratante |
| 140 | `CASHFLOW ELECNOR` | K | oculta | 6.885 | 4.527 | Cashflow do contratante com marcos LI/LO por função de transmissão |
| 141 | `Check cantid. TOTAL y canteiros` | L | oculta | 1.804 | 591 | Verificação cruzada de quantidades entre abas S, indiretos e canteiros |
| 142 | `Checks` | L | oculta | 9.655 | 6.675 | Painel central de verificações de consistência de todo o modelo |
| 143 | `ImpFactura` | J | visível | 106 | 10 | Exemplo didático de aplicação de ISS e PIS/COFINS sobre faturamento |
| 144 | `ToDo` | A | visível | 7 | 0 | Lista de pendências do próprio modelo |
| 145 | `Aux` | A | visível | 30.802 | 29.044 | Camada auxiliar: nomes de abas, listas derivadas, descrições de linha |
| 146 | `LU` | A | visível | 3.494 | 1.792 | Listas de valores únicos derivadas via UNIQUE / FILTER / INDIRECT |
| 147 | `Contingência` | J | visível | 275 | 42 | Análise de contingências construtivas (troca de tipo de torre, fundação, solo) |
| 148 | `Precios SIN seguro LME y USD` | F | oculta | 2.504 | 333 | Bruteamento de preços (líquido para bruto) sem seguro, para LME e USD |
| 149 | `LMEUSD` | F | oculta | 4.405 | 3.721 | Curva de preço do condutor atrelada a LME + Midwest + câmbio, mês a mês |
| 150 | `ENTREGAS` | K | oculta | 4.305 | 2.732 | Cronograma de entregas de materiais (% por mês) usado na ponderação de futuros |

---

*Levantamento de requisitos — Calculo LT · base: OPGW-2025-029_R2.xlsm · 150 planilhas · 1.877.471 fórmulas · análise por engenharia reversa do pacote OOXML.*
