## Purpose

Gestão e importação de estaqueamento de estruturas de linhas de transmissão (origem: abas `E1..E10` da planilha), contemplando o parser de arquivos PLS-CADD com relatório prévio de inconsistências (RF-18, RNF-10), atribuição individual e em lote de parâmetros de solo, fundação e acessos (RF-19), validação de integridade contra os catálogos vigentes (RF-20, RN-13), distribuição paramétrica para estudos preliminares sem projeto executivo (RF-21), reimportação incremental com preservação de dados (RF-22) e alta capacidade volumétrica para até 5.000 torres por linha (RNF-02).

## ADDED Requirements

### Requirement: Importar lista de estruturas do PLS-CADD

O sistema SHALL importar arquivos no formato CSV ou XLSX gerados pela exportação de estaqueamento do software PLS-CADD para uma linha de transmissão (`TransmissionLine`). O sistema SHALL extrair os campos: número da estrutura (ex.: `T01`, `102A`), estaca em metros (decimal ≥ 0), ajuste de altura / extensão de pé (decimal), ângulo de deflexão em graus (decimal ≥ 0), offset transversal em metros (decimal), coordenadas UTM Leste/Norte (decimais > 0) e cota de terreno em metros (decimal). O sistema SHALL validar a integridade de formato antes da gravação e emitir relatório detalhado apontando eventuais duplicidades de número de torre ou estacas decrescentes (RF-18, RNF-10).

#### Scenario: Importação bem-sucedida de arquivo PLS-CADD
- **WHEN** um usuário faz upload de uma planilha PLS-CADD válida com 150 torres para uma linha de transmissão
- **THEN** o sistema analisa o arquivo, apresenta a pré-visualização das 150 estruturas sem erros e grava o estaqueamento na linha

#### Scenario: Rejeição de arquivo com números de torre duplicados
- **WHEN** um usuário tenta importar um arquivo PLS-CADD contendo duas torres com o mesmo identificador na mesma linha
- **THEN** o sistema recusa a gravação e apresenta relatório indicando a linha do arquivo com a duplicidade

### Requirement: Atribuir solo, fundação e acessos por torre em lote

O sistema SHALL permitir atribuir a cada torre do estaqueamento o tipo de estrutura/torre (`TowerType`), o tipo de solo classificado (`SoilType`), o tipo de fundação (`FoundationType`) e o grau de dificuldade de acesso (ex.: normal, difícil, travessia). O sistema SHALL suportar a aplicação dessas atribuições tanto individualmente por torre quanto em lote através de filtros por intervalo de estacas (ex.: estaca 0 a 15.000 m), trechos geográficos ou família de torres (RF-19).

#### Scenario: Atribuição de tipo de solo por intervalo de estacas
- **WHEN** um usuário seleciona o intervalo de estacas de 10.000 m a 25.000 m e aplica o solo `S3 - Solo Rochoso`
- **THEN** o sistema atualiza em lote todas as torres situadas nesse trecho associando o tipo de solo selecionado

#### Scenario: Atribuição de fundação específica por tipo de estrutura
- **WHEN** um usuário filtra todas as torres do tipo `AD - Ângulo e Derivação` e atribui a fundação `GRELHA`
- **THEN** todas as torres correspondentes recebem a fundação especificada

### Requirement: Validar integridade e correspondência com catálogos

O sistema SHALL validar que toda combinação de tipo de solo (`SoilType`) e tipo de fundação (`FoundationType`) atribuída a uma torre possua definição correspondente na matriz de volumes de fundação vigência (`FoundationVolumeMatrix`) do catálogo corporativo (RF-20, RN-13). O sistema SHALL emitir alerta de pendência caso existam torres sem solo ou fundação atribuídos, ou caso a extensão total das estacas divirja da extensão cadastrada na linha de transmissão.

#### Scenario: Sinalização de combinação de solo e fundação inexistente no catálogo
- **WHEN** uma torre possui solo `S5 - Rocha Sã` e fundação `TUBULAO_AR_COMPRIMIDO`, combinação sem matriz de volume cadastrada
- **THEN** o sistema sinaliza inconsistência de engenharia impedindo o fechamento da revisão

#### Scenario: Validação de extensão entre estaqueamento e parâmetros da linha
- **WHEN** a última estaca do arquivo PLS-CADD totaliza 120,500 km e a linha está cadastrada com 100,000 km
- **THEN** o sistema alerta o usuário sobre a divergência de extensão física entre o traçado e o edital

### Requirement: Suportar distribuição paramétrica preliminar sem estaqueamento

O sistema SHALL permitir que o orçamentista configure uma distribuição percentual estimada de tipos de solo e tipos de fundação para uma linha de transmissão quando o arquivo PLS-CADD executivo ainda não estiver disponível na fase preliminar da proposta (RF-21). A soma das distribuições percentuais de solo e fundação SHALL totalizar 100,00% cada.

#### Scenario: Configuração paramétrica de solos em fase inicial
- **WHEN** o usuário define que a linha possui 60% de solo `S1 - Arenoso`, 30% de solo `S2 - Argiloso` e 10% de solo `S3 - Rochoso`
- **THEN** o sistema valida que a soma é 100,00% e salva a estimativa paramétrica permitindo a prévia de quantitativos

### Requirement: Reimportar estaqueamento preservando atribuições existentes

O sistema SHALL permitir o reenvio de um arquivo PLS-CADD revisado para uma linha que já possui estaqueamento gravado. Na reimportação, o sistema SHALL comparar as estruturas pelo número identificador e posição, atualizando as coordenadas e estacas e preservando as atribuições de solo, fundação e notas já realizadas nas torres que permaneceram na lista (RF-22).

#### Scenario: Reimportação preserva solos já classificados
- **WHEN** um usuário reimporta o arquivo PLS-CADD de uma linha onde 50 torres já tinham solos atribuídos manualmente
- **THEN** o sistema atualiza as coordenadas das torres mantendo os solos atribuídos para as torres que permaneceram no arquivo

### Requirement: Consultar e paginar torres de estaqueamento de alta volumetria

O sistema SHALL disponibilizar consulta paginada, filtros por estaca, solo, fundação e família de torre, e busca rápida por número de estrutura, suportando linhas com até 5.000 torres sem travamentos ou degradação perceptível de desempenho (RNF-02).

#### Scenario: Listagem paginada de estaqueamento com 3.000 torres
- **WHEN** um usuário visualiza o estaqueamento de uma linha com 3.000 estruturas
- **THEN** a interface carrega a primeira página em tempo inferior a 1 segundo com navegação fluida
