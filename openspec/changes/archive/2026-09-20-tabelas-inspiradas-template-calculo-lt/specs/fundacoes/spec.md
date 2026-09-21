## ADDED Requirements

### Requirement: Detalhamento Analítico de Travessias, Acessos e Limpeza de Faixa (RF-20, RF-21, RNF-14)
O sistema SHALL disponibilizar na interface de Engenharia Civil e Fundações sub-tabelas dedicadas inspiradas nas abas `Travesias`, `Accesos` e `Limpieza` da planilha mestre, exibindo os quantitativos e custos de travessias especiais (rodovias, ferrovias, rios, linhas de transmissão), abertura/manutenção de acessos por tipologia de solo e supressão vegetal da faixa de servidão.

#### Scenario: Visualização de travessias e estruturas especiais
- **WHEN** o usuário visualiza o detalhamento de engenharia civil da linha
- **THEN** o sistema apresenta a tabela de travessias cadastradas com tipo de obstáculo, vão de travessia, medidas de segurança e custo consolidado

#### Scenario: Visualização de limpeza de faixa e acessos
- **WHEN** o usuário consulta os serviços de implantação preliminar
- **THEN** o sistema exibe os hectares de supressão vegetal (leve, média, pesada) e extensão de acessos classificados por terreno
