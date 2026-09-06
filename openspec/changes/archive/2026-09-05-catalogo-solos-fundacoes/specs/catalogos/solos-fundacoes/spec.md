## Purpose

Catálogo corporativo de solos e fundações (origem: aba `DB_FUN` da planilha), em três recursos — tipos de solo com parâmetros geotécnicos e faixa de NSPT, tipos de fundação com aplicação e composição por elemento, e a matriz de volumes por combinação tipo de torre × tipo de solo × tipo de fundação (RF-09, RN-13) — com manutenção, busca/filtros, validação, sinalização de pendências e histórico. O versionamento por vigência segue o comportamento comum de `catalogos/versionamento-vigencia`, aplicado independentemente a cada recurso.

## ADDED Requirements

### Requirement: Manter tipos de solo

O sistema SHALL permitir criar e editar tipos de solo com código (obrigatório, único no catálogo, texto livre — ex.: I, II, IVS, R, E, IA) como identidade e, como atributos versionados: descrição, submerso (sim/não), tensão admissível à compressão em kgf/cm², peso específico em kgf/m³, ângulo de atrito interno em graus, coesão em kg/cm² e faixa de NSPT como par de inteiros (mínimo inclusivo, máximo exclusivo). Os atributos numéricos SHALL ser armazenados e exibidos com precisão decimal, nunca em ponto flutuante binário (RNF-08); os limites da faixa de NSPT SHALL ser inteiros maiores ou iguais a zero.

#### Scenario: Criação com dados válidos

- **WHEN** um usuário cria um tipo de solo com código inédito e valores válidos
- **THEN** o sistema grava o tipo de solo como primeira versão e o exibe na listagem

#### Scenario: Código duplicado é rejeitado

- **WHEN** um usuário tenta criar um tipo de solo com um código que já existe no catálogo
- **THEN** o sistema rejeita a operação e informa que o código já está em uso

#### Scenario: Valores numéricos inválidos são rejeitados

- **WHEN** um usuário informa tensão admissível, peso específico, ângulo de atrito ou coesão com valor negativo ou não numérico, ou limites de NSPT fracionários ou negativos
- **THEN** o sistema rejeita a operação apontando o campo inválido em português

#### Scenario: Faixa de NSPT invertida é rejeitada

- **WHEN** um usuário informa faixa de NSPT com mínimo maior ou igual ao máximo
- **THEN** o sistema rejeita a operação e informa que o mínimo deve ser menor que o máximo

#### Scenario: Solo sem faixa de NSPT é aceito

- **WHEN** um usuário salva um tipo de solo sem informar a faixa de NSPT (caso rocha)
- **THEN** o sistema grava a versão com a faixa não informada, sem convertê-la em zero (RNF-09)

### Requirement: Manter tipos de fundação

O sistema SHALL permitir criar e editar tipos de fundação com sigla (obrigatória, única no catálogo — ex.: `4FZ`, `1PR - 4P`) e aplicação (autoportante, estaiada ou cross-rope) como identidade, e, como atributos versionados: descrição e a composição em contagens por elemento de fundação (fuste sapata, preformado mastro, preformado tirante, pila reta, pila campana, pila com laje, pila reta tirante, pila campana tirante, ancoragem em rocha, estaca de concreto, estaca metálica, helicoidal mastro, helicoidal tirante, tricone, estaca raiz, micropilote e hélice contínua). Cada contagem SHALL ser inteiro maior ou igual a zero ou não informada, distinguindo zero de não informado (RNF-09). A aplicação SHALL ser imutável após a criação: uma tentativa de troca em edição SHALL ser rejeitada com mensagem em português.

#### Scenario: Criação de tipo de fundação com dados válidos

- **WHEN** um usuário cria um tipo de fundação com sigla inédita, aplicação e contagens válidas
- **THEN** o sistema grava o tipo como primeira versão e o exibe na listagem

#### Scenario: Sigla duplicada é rejeitada

- **WHEN** um usuário tenta criar um tipo de fundação com uma sigla que já existe no catálogo
- **THEN** o sistema rejeita a operação e informa que a sigla já está em uso

#### Scenario: Troca de aplicação é rejeitada

- **WHEN** um usuário tenta editar um tipo de fundação alterando sua aplicação
- **THEN** o sistema rejeita a operação e informa que a aplicação não pode ser alterada

#### Scenario: Contagem inválida é rejeitada

- **WHEN** um usuário informa uma contagem de elemento fracionária, negativa ou não numérica
- **THEN** o sistema rejeita a operação apontando o campo inválido em português

### Requirement: Manter matriz de volumes por combinação

O sistema SHALL permitir criar e editar entradas da matriz de volumes, cada uma identificada pela combinação única de um tipo de torre (do catálogo de séries de estruturas), um tipo de solo e um tipo de fundação existentes (RN-13), e, como atributos versionados, as quantidades decimais da combinação: escavação por dureza e elemento (duro, normal e com água, para sapata, preformados e encepados), escavação de pila, perfuração de pernos, aço por elemento (pilas, sapatas, encepados, preformados, rocha e pernos), concreto por elemento (pilas, sapatas, encepados, preformado e rocha), regeneração, grout, reaterro de solo, reaterro solo-cimento, formas e metragens de estacas (helicoidal, aço, tricone, raiz, hélice contínua, micropilotes e concreto). Cada quantidade SHALL ser decimal maior ou igual a zero ou não informada, distinguindo zero de não informado (RNF-09), armazenada com precisão decimal (RNF-08). A combinação SHALL ser imutável após a criação: a edição gera nova versão apenas das quantidades.

#### Scenario: Criação de combinação com dados válidos

- **WHEN** um usuário cria uma entrada da matriz referenciando tipo de torre, tipo de solo e tipo de fundação existentes, com quantidades válidas
- **THEN** o sistema grava a entrada como primeira versão e a exibe na listagem da matriz

#### Scenario: Combinação duplicada é rejeitada

- **WHEN** um usuário tenta criar uma entrada da matriz com uma combinação de tipo de torre, tipo de solo e tipo de fundação que já existe
- **THEN** o sistema rejeita a operação e informa que a combinação já está cadastrada

#### Scenario: Referência inexistente é rejeitada

- **WHEN** um usuário tenta criar uma entrada da matriz referenciando um tipo de torre, tipo de solo ou tipo de fundação que não existe
- **THEN** o sistema rejeita a operação informando qual referência não foi encontrada

#### Scenario: Quantidade inválida é rejeitada

- **WHEN** um usuário informa uma quantidade com valor negativo ou não numérico
- **THEN** o sistema rejeita a operação apontando o campo inválido em português

#### Scenario: Quantidade zero é distinta de não informada

- **WHEN** um usuário salva uma entrada da matriz com uma quantidade igual a zero e outra em branco
- **THEN** o sistema grava zero na primeira e não informado na segunda, e a exibição distingue os dois estados (RNF-09)

### Requirement: Listar e buscar tipos de solo

O sistema SHALL exibir a listagem dos tipos de solo em suas versões vigentes, com busca por código e descrição.

#### Scenario: Busca por código

- **WHEN** um usuário busca por parte do código ou da descrição de um tipo de solo existente
- **THEN** a listagem exibe os tipos cujo código ou descrição contém o termo, mostrando os valores da versão vigente

### Requirement: Listar e buscar tipos de fundação

O sistema SHALL exibir a listagem dos tipos de fundação em suas versões vigentes, com busca por sigla e descrição e filtro por aplicação.

#### Scenario: Filtro por aplicação

- **WHEN** um usuário filtra a listagem por uma aplicação (ex.: estaiada)
- **THEN** a listagem exibe apenas os tipos de fundação daquela aplicação, mostrando os valores da versão vigente

#### Scenario: Busca por sigla

- **WHEN** um usuário busca por parte da sigla ou da descrição de um tipo de fundação existente
- **THEN** a listagem exibe os tipos cuja sigla ou descrição contém o termo

### Requirement: Listar e filtrar a matriz de volumes

O sistema SHALL exibir a listagem das entradas da matriz em suas versões vigentes, identificando cada combinação (série e sigla do tipo de torre, código do solo, sigla da fundação), com filtros por tipo de torre, tipo de solo e tipo de fundação.

#### Scenario: Filtro por combinação parcial

- **WHEN** um usuário filtra a matriz por um tipo de solo e um tipo de fundação
- **THEN** a listagem exibe apenas as entradas daquela combinação parcial, mostrando os valores da versão vigente

### Requirement: Sinalizar registros incompletos

O sistema SHALL sinalizar nas listagens os registros sem todos os dados obrigatórios preenchidos (RF-11 parcial), distinguindo campo não informado de campo com valor zero (RNF-09). No tipo de solo são obrigatórios: descrição, submerso, tensão admissível, peso específico e ângulo de atrito (coesão e faixa de NSPT ficam fora — não se aplicam a rocha). No tipo de fundação são obrigatórios: descrição e ao menos um elemento com contagem informada. Na entrada da matriz a pendência é a versão sem nenhuma quantidade informada.

#### Scenario: Solo sem peso específico aparece sinalizado

- **WHEN** um tipo de solo foi salvo sem peso específico
- **THEN** a listagem exibe o tipo com indicação visível de pendência, identificando o campo ausente

#### Scenario: Solo rocha sem coesão nem NSPT não é pendência

- **WHEN** um tipo de solo foi salvo com os campos obrigatórios preenchidos e sem coesão nem faixa de NSPT
- **THEN** a listagem exibe o tipo sem indicação de pendência

#### Scenario: Fundação sem composição aparece sinalizada

- **WHEN** um tipo de fundação foi salvo sem nenhuma contagem de elemento informada
- **THEN** a listagem exibe o tipo com indicação visível de pendência, identificando a composição ausente

#### Scenario: Entrada da matriz toda em branco aparece sinalizada

- **WHEN** uma entrada da matriz foi salva sem nenhuma quantidade informada
- **THEN** a listagem exibe a entrada com indicação visível de pendência

#### Scenario: Contagem zero não é pendência

- **WHEN** um tipo de fundação foi salvo com descrição e ao menos um elemento com contagem informada (ainda que zero)
- **THEN** a listagem exibe o tipo sem indicação de pendência

### Requirement: Exibir histórico de versões por recurso

O sistema SHALL exibir, para cada tipo de solo, tipo de fundação e entrada da matriz, o histórico de versões com data de início de vigência, autor e valores de cada versão — incluindo, no tipo de fundação, a composição por elemento de cada versão e, na entrada da matriz, as quantidades de cada versão.

#### Scenario: Consulta do histórico após edição

- **WHEN** um usuário abre o histórico de um tipo de solo, tipo de fundação ou entrada da matriz que já foi editado
- **THEN** o sistema lista todas as versões em ordem de vigência, cada uma com autor, instante de criação e valores da época
