## Purpose

Define os requisitos e regras para a criação, congelamento e gerenciamento da Linha de Base Contratual da Obra (Baseline Data 0) a partir da proposta técnica e comercial vencedora do leilão (Fase F7 do roadmap).

## Requirements

### Requirement: Congelamento da Linha de Base Contratual da Obra (Data 0)
O sistema SHALL permitir congelar uma revisão da oferta com status `WON` / `DELIVERED`, gerando a Linha de Base Contratual Imutável da Obra (*Work Baseline Data 0*), preservando integralmente o escopo, quantitativos de engenharia por estrutura, orçamento de serviços por CIP, histograma de equipes e fluxo financeiro acordado.

#### Scenario: Geração de baseline a partir de proposta vencedora
- **WHEN** o gestor de contrato marca a revisão R2 da proposta como vencedora (`WON`) e solicita a geração da baseline da obra
- **THEN** o sistema cria o registro imutável da Baseline Data 0 com carimbo de data, versão e todos os pacotes de trabalho (EAP) derivados da proposta

---

### Requirement: Estrutura Analítica do Projeto da Obra (EAP/WBS de Execução)
O sistema SHALL estruturar a baseline da obra em uma EAP hierárquica padronizada (Projetos & Topografia, Meio Ambiente & Faixa, Obras Civis & Fundações, Montagem Eletromecânica, Lançamento de Cabos, Comissionamento e Indiretos), vinculando cada pacote aos seus respectivos custos orçados e equipes alocadas.

#### Scenario: Visualização da EAP da baseline
- **WHEN** a equipe de engenharia de obra consulta a EAP da baseline da linha LT-01
- **THEN** o sistema exibe a árvore completa de pacotes de trabalho com os quantitativos contratuais, custos e equipes vinculadas
