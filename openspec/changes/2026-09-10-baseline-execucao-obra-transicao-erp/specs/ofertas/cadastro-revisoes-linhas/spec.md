## MODIFIED Requirements

### Requirement: Gerenciar histórico de revisões de oferta

O sistema SHALL manter um histórico de revisões para cada oferta (ex.: `R0`, `R1`, `R2`...), onde cada revisão registra número sequencial, status (em edição, fechada, entregue, vencedora/ganha, em execução), data de fechamento, data de entrega ao cliente, autor responsável, notas descritivas das alterações realizadas e vínculo com a trilha de auditoria (RF-02, RF-03, RF-65). Quando uma revisão é marcada como fechada, entregue ou vencedora (`WON`), seus dados de parâmetros, linhas e matriz de escopo tornam-se imutáveis, permitindo comparações item a item entre revisões históricas (RNF-05). Toda transição de status ou criação de revisão SHALL emitir um evento para a trilha de auditoria com identificação do autor e timestamp UTC (RF-65, RNF-12). A marcação como vencedora (`WON`) ou início de execução (`IN_EXECUTION`) SHALL disparar a criação da Linha de Base Contratual da Obra (Baseline Data 0).

#### Scenario: Criação de nova revisão a partir da anterior
- **WHEN** um usuário cria uma nova revisão `R1` a partir da revisão `R0` fechada
- **THEN** o sistema copia o estado integral de `R0` para `R1` em estado editável, preservando `R0` intacta para consulta histórica

#### Scenario: Bloqueio de edição em revisão fechada
- **WHEN** um usuário tenta alterar dados de uma revisão com status fechada ou entregue
- **THEN** o sistema rejeita a alteração informando que revisões concluídas são imutáveis

#### Scenario: Transição de status da revisão gera evento de auditoria
- **WHEN** o gestor comercial fecha a revisão `R0` da proposta
- **THEN** o sistema altera o status para fechada e emite automaticamente um evento de auditoria `FREEZE` contendo o autor, a data UTC e o número da revisão

#### Scenario: Marcação de proposta vencedora dispara criação da baseline da obra
- **WHEN** a diretoria comercial marca a revisão R2 como vencedora (`WON`)
- **THEN** o sistema registra o status, emite evento de auditoria e cria a Linha de Base da Obra (Baseline Data 0)
