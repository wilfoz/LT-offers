## Why

Na planilha legada ("Calculo LT"), o estaqueamento de torres é manipulado por cópia e cola manual em 10 abas estáticas (`E1..E10`), vulnerável a quebras de integridade, perda de coordenadas e sombreamento de nomes (`#REF!`). Além disso, não há validação automatizada de integridade entre as torres estaqueadas e os catálogos vigentes de solos e fundações.

Esta change implementa o **Módulo M04 (Estaqueamento e Dados por Torre)** da Fase F2 do Roadmap (§13 do `requisitos-calculo-lt.md`), permitindo a importação confiável de arquivos PLS-CADD, a distribuição paramétrica preliminar de solos/fundações e a atribuição de parâmetros geotécnicos e estruturais por torre, sustentando a base de dados necessária para o motor de quantitativos de engenharia (M05).

## What Changes

- **Modelo de Dados de Estruturas Estaquadas**: Criação da entidade `StakingTower` vinculada à `TransmissionLine`, contendo número da estrutura, estaca (m), extensão/km, ajuste de altura (extensão de pé), ângulo de deflexão, offset lateral, coordenadas UTM (East/North), cota de terreno, referências aos catálogos (`TowerType`, `SoilType`, `FoundationType`) e tipo de acesso.
- **Importador e Parser PLS-CADD (RF-18, RNF-10)**: Processamento de arquivos CSV e XLSX exportados do software PLS-CADD com validação estrita linha a linha (duplicidades, campos numéricos, coordenadas) e emissão de relatório prévio de inconsistências antes da gravação.
- **Atribuição em Lote por Trecho (RF-19)**: Funcionalidade para aplicar tipos de solo, fundação e acessos a conjuntos de torres filtrados por faixa de estacas, trecho geométrico ou família de estrutura.
- **Validação de Integridade Geotécnica (RF-20, RN-13)**: Verificação automática de que toda combinação `SoilType` × `FoundationType` atribuída às torres existe na matriz de volumes (`FoundationVolumeMatrix`) e que a extensão e contagem de torres batem com os parâmetros da linha.
- **Modo Paramétrico Preliminar (RF-21)**: Suporte a estudo preliminar sem estaqueamento detalhado, permitindo distribuição percentual estimada de tipos de solo e fundações.
- **Reimportação Incremental (RF-22)**: Atualização de estaqueamento com merge inteligente, preservando as atribuições geotécnicas já efetuadas em torres inalteradas.
- **Interface Web de Estaqueamento (RNF-02)**: Visualizador e editor em tabela paginada com paginação/virtual scroll e filtros rápidos por tipo de torre, solo e fundação, além de modal/wizard de importação com pré-visualização de dados.

## Capabilities

### New Capabilities
- `estaqueamento/dados-torres-pls-cadd`: Cadastro, importação PLS-CADD, atribuição em lote e validação de dados por torre vinculados a linhas de transmissão (RF-18..RF-22, RN-13, RNF-02, RNF-10).

### Modified Capabilities
<!-- Nenhuma especificação existente teve requisitos alterados nesta change -->

## Impact

- **Banco de Dados (Prisma)**: Nova tabela `StakingTower` com índices em `transmissionLineId`, `station` e `towerNumber`, além de tabela para distribuição percentual preliminar `PreliminaryStakingDistribution`.
- **Domain Library (`@lt-offers/domain`)**: Interfaces de `StakingTower`, DTOs de importação PLS-CADD, filtros e payloads de atribuição em lote.
- **Backend (`apps/api`)**: Novo módulo `StakingModule` com `StakingService` e `StakingController`, parser de multipart/form-data para arquivos PLS-CADD.
- **Frontend (`apps/web`)**: Nova aba e sub-rotas de Estaqueamento dentro do detalhe da linha/oferta, com componente de tabela paginada e diálogo de upload/reimportação.
- **Desempenho**: Otimização para suportar até 5.000 torres por linha sem degradação de tempo de resposta (RNF-02).
