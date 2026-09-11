## Purpose

Define os requisitos e regras para o Painel Central de Verificações de Consistência e Integridade Global da proposta comercial e técnica de Linhas de Transmissão (Módulo M12, RF-62, RF-63, RNF-09), englobando diagnóstico cruzado entre módulos, sinalização visual de saúde da oferta e bloqueio impeditivo de fechamento de revisão.

## ADDED Requirements

### Requirement: Bateria Completa de Verificações Cruzadas de Integridade (RF-62, RNF-09)
O sistema SHALL executar automaticamente um conjunto determinístico de verificações de consistência cobrindo todos os módulos do motor de cálculo (`Checks`, `Check cantid. TOTAL y canteiros`):
1. *Estaqueamento:* contagem de estruturas no estaqueamento vs total declarado na linha; pares solo × fundação sem equivalência no catálogo `DB_FUN`;
2. *Materiais & Tributos:* itens quantificados sem cotação ou preço de referência atribuído (RF-29); insumos sem UF de origem ou com cálculo de DIFAL/FECOEP não resolvido;
3. *Cronograma & Recursos:* atividades com produção diária requerida superior à capacidade máxima produtiva da equipe alocada (RF-38); marcos de conclusão de serviços extrapolando os limites contratuais de LI/LO (RF-39);
4. *Histogramas & Canteiros:* meses com déficit de maquinário próprio sem decisão de locação ou compra formalizada (RF-44);
5. *Serviços & Orçamento:* discrepância entre a soma dos serviços orçados (próprios, ajustados e cotados) e os totais físicos de engenharia; itens contratuais sem código CIP associado;
6. *Desembolso & Caixa:* divergência entre o somatório do cronograma de desembolso financeiro ($DT$) e o valor consolidado de venda do Quadro $R$.

#### Scenario: Detecção automática de itens sem cotação
- **WHEN** o orçamentista inclui uma nova linha de transmissão com 20 km de cabo condutor mas não seleciona o fornecedor na aba de cotações
- **THEN** a verificação de integridade de suprimentos falha imediatamente, classificando a pendência como crítica e indicando a quantidade de itens pendentes

---

### Requirement: Painel Visual Unificado de Saúde da Oferta e Navegação Direta (RF-62)
O sistema SHALL disponibilizar um painel central de diagnóstico e saúde da oferta (Health Dashboard) com indicador consolidado de status (Verde / Amarelo / Vermelho), contadores de pendências agrupados por severidade e módulo, e links diretos de navegação (*deep linking*) para a aba e campo exato onde a inconsistência foi detectada.

#### Scenario: Navegação do painel de diagnósticos até o dado pendente
- **WHEN** o usuário visualiza no painel de consistência o erro "3 estruturas com fundação não encontrada no catálogo" e clica na mensagem
- **THEN** a interface redireciona o usuário diretamente para a aba de Estaqueamento, filtrando e destacando as 3 linhas com inconsistência

---

### Requirement: Bloqueio de Fechamento de Revisão por Pendências Críticas (RF-63)
O sistema SHALL bloquear o fechamento, congelamento ou emissão final de uma revisão de proposta comercial enquanto houver qualquer verificação classificada com severidade **Crítica** em falha. Inconsistências de severidade **Alerta** poderão ser aceitas desde que acompanhadas de justificativa textual obrigatória registrada pelo orçamentista.

#### Scenario: Tentativa de fechamento de revisão com erro impeditivo
- **WHEN** o usuário clica em "Fechar Revisão" enquanto a verificação de paridade do fluxo de desembolso vs venda acusa divergência
- **THEN** o sistema impede o fechamento, exibe a listagem de pendências bloqueantes e mantém a oferta no estado em edição

#### Scenario: Fechamento com alerta justificado
- **WHEN** a oferta possui apenas alertas de produção de equipe no cronograma (sem erros críticos) e o usuário fornece justificativa formal de turno extra
- **THEN** o sistema autoriza o fechamento da revisão e armazena a justificativa na trilha de auditoria da oferta
