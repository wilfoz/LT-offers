## Purpose

Gestão centralizada de ofertas de leilão de linhas de transmissão (origem: abas `Info&Cond`, `Datos` e `Aux` da planilha), contemplando o cadastro de parâmetros gerais do lote, controle formal de revisões imutáveis com histórico de auditoria (RF-01, RF-02, RF-03), parametrização flexível de linhas de transmissão (1 a n, sem limite fixo de 10 linhas — RF-05, RN-01, RNF-03), matriz de responsabilidade de escopo com 4 eixos de risco/tributos (RF-04, RN-03, RN-04) e clonagem integral de ofertas (RF-06).

## Requirements

### Requirement: Manter cadastro de ofertas

O sistema SHALL permitir criar e editar ofertas com leilão (ex.: `Leilão 01/2026`), lote (ex.: `Lote 1`), cliente/concessionária (ex.: `Axia Energia`), data da oferta, data do leilão, data de início do cronograma, data prevista de entrada em operação do edital, CAPEX estimado ANEEL (decimal monetário ≥ 0), RAP máxima (decimal monetário ≥ 0), RAP vencedora estimada (decimal monetário ≥ 0) e moeda base (código ISO ex.: `BRL`, `USD`). O sistema SHALL registrar automaticamente autor e data/hora da última alteração (RF-01, RF-03). O sistema SHALL emitir alerta quando a data de início de cronograma ou término for inconsistente com o prazo do edital (RN-02).

#### Scenario: Criação de oferta com dados válidos
- **WHEN** um usuário cria uma oferta com identificação do leilão, lote, cliente e parâmetros financeiros e de datas válidos
- **THEN** o sistema grava a oferta gerando a primeira revisão inicial (R0) e a exibe na listagem de ofertas

#### Scenario: Alerta de prazo do cronograma versus edital (RN-02)
- **WHEN** um usuário define uma data de início ou prazo cuja conclusão ultrapassa a data limite de entrada em operação do edital
- **THEN** o sistema alerta o usuário sobre a inconformidade de prazo mantendo a sinalização na revisão

---

### Requirement: Gerenciar histórico de revisões de oferta

O sistema SHALL manter um histórico de revisões para cada oferta (ex.: `R0`, `R1`, `R2`...), onde cada revisão registra número sequencial, status (em edição, fechada, entregue), data de fechamento, data de entrega ao cliente, autor responsável, notas descritivas das alterações realizadas e vínculo com a trilha de auditoria (RF-02, RF-03, RF-65). Quando uma revisão é marcada como fechada ou entregue, seus dados de parâmetros, linhas e matriz de escopo tornam-se imutáveis, permitindo comparações item a item entre revisões históricas (RNF-05). Toda transição de status ou criação de revisão SHALL emitir um evento para a trilha de auditoria com identificação do autor e timestamp UTC (RF-65, RNF-12).

#### Scenario: Criação de nova revisão a partir da anterior
- **WHEN** um usuário cria uma nova revisão `R1` a partir da revisão `R0` fechada
- **THEN** o sistema copia o estado integral de `R0` para `R1` em estado editável, preservando `R0` intacta para consulta histórica

#### Scenario: Bloqueio de edição em revisão fechada
- **WHEN** um usuário tenta alterar dados de uma revisão com status fechada ou entregue
- **THEN** o sistema rejeita a alteração informando que revisões concluídas são imutáveis

#### Scenario: Transição de status da revisão gera evento de auditoria
- **WHEN** o gestor comercial fecha a revisão `R0` da proposta
- **THEN** o sistema altera o status para fechada e emite automaticamente um evento de auditoria `FREEZE` contendo o autor, a data UTC e o número da revisão

---

### Requirement: Configurar linhas de transmissão do lote

O sistema SHALL permitir adicionar, editar e remover linhas de transmissão vinculadas a uma revisão de oferta sem limite artificial de quantidade (suportando de 1 a $n$ linhas — RF-05, RNF-03). Cada linha SHALL possuir nome/designação (ex.: `LT 500 kV Curitiba Leste - Blumenau`), tensão nominal em kV (decimal > 0), extensão refinada de engenharia em km (decimal > 0), extensão arredondada de relatório em km (decimal > 0), quantidade de circuitos (inteiro ≥ 1), quantidade de condutores por fase (inteiro ≥ 1) e alocação de até duas UFs de destino (UF 1 e UF 2) com seus respectivos percentuais de rateio (RF-05, RN-01).

#### Scenario: Linha com alocação em duas UFs somando 100% (RN-01)
- **WHEN** um usuário cadastra uma linha com UF 1 = `PR` (60%) e UF 2 = `SC` (40%)
- **THEN** o sistema valida que a soma dos rateios totaliza 100,00% e salva a linha com sucesso

#### Scenario: Rateio de UFs diferente de 100% é rejeitado
- **WHEN** um usuário informa percentuais de rateio entre UF 1 e UF 2 que não somam 100,00%
- **THEN** o sistema rejeita a gravação informando a inconsistência do rateio territorial em português

---

### Requirement: Gerenciar matriz de responsabilidade de escopo

O sistema SHALL manter uma matriz de responsabilidade por item padronizado de escopo (ex.: fornecimento de cabos condutores, fornecimento de estruturas metálicas, obras civis de fundação, montagem eletromecânica, lançamento de cabos, licenciamento ambiental, desapropriação fundiária — RF-04). Para cada item de escopo, o sistema SHALL permitir configurar os quatro eixos:
1. **Responsável**: *Contratada* (entra no orçamento) ou *Cliente* (entra com custo zero, mas permanece visível e rotulado como "(Cliente)" — RN-03);
2. **Aceite de faturamento direto**: booleano indicando se o cliente aceita faturamento direto com suspensão de PIS/COFINS via REIDI (RN-04);
3. **Risco cambial**: *Contratada* (usa curva a termo) ou *Cliente* (usa cotação spot — RN-08);
4. **Risco de commodity**: *Contratada* ou *Cliente* (RN-08).

#### Scenario: Item de escopo sob responsabilidade do cliente (RN-03)
- **WHEN** um item de escopo é configurado como responsabilidade do *Cliente*
- **THEN** o sistema marca o item como custo zero para a proposta e o rotula explicitamente como "(Cliente)" na estrutura analítica

#### Scenario: Configuração de faturamento direto com REIDI (RN-04)
- **WHEN** o faturamento direto é ativado para um item elegível fornecido por terceiros
- **THEN** o sistema registra o aceite de faturamento direto para que o motor tributário desonere PIS/COFINS na etapa de precificação

---

### Requirement: Clonar oferta existente

O sistema SHALL permitir duplicar uma oferta completa (incluindo parâmetros de leilão, linhas de transmissão e matriz de responsabilidade de escopo) para criar uma nova proposta, gerando uma revisão `R0` inicial e registrando o vínculo da oferta de origem para fins de rastreabilidade e histórico (RF-06).

#### Scenario: Clonagem com novo código de lote e leilão
- **WHEN** um usuário clona a oferta `Lote 1 - Leilão 01/2025` informando como destino `Lote 3 - Leilão 02/2026`
- **THEN** o sistema cria a nova oferta independente com todas as linhas e matriz de escopo replicadas e registra a origem da clonagem

---

### Requirement: Listar, buscar e sinalizar pendências de ofertas

O sistema SHALL exibir a listagem de ofertas com busca textual por leilão, lote e cliente, exibindo a revisão vigente, total de linhas, extensão total somada em km e badges de pendência caso a oferta não possua linhas cadastradas, possua rateio territorial inconsistente ou itens de escopo não atribuídos (RF-11, RNF-09).

#### Scenario: Oferta sem linhas cadastradas exibe pendência
- **WHEN** uma oferta foi criada mas ainda não possui nenhuma linha de transmissão cadastrada na revisão ativa
- **THEN** a listagem exibe a oferta com sinalização visual de pendência indicando a ausência de linhas
