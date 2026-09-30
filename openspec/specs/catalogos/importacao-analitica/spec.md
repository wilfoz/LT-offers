# catalogos/importacao-analitica

## Purpose

Assistente de importação de planilhas para os catálogos de engenharia (Importação Analítica): o usuário sobe um arquivo, escolhe o catálogo de destino, mapeia colunas para os campos do cadastro e importa somente os itens ainda não cadastrados, com validação espelhando os cadastros (RNF-08, RNF-09) e versões criadas por vigência (RNF-05).

## Requirements

### Requirement: Oferecer o assistente de Importação Analítica para catálogos planos

O sistema SHALL oferecer, na rota `/upload` com o item de menu rotulado "Importação Analítica", um assistente de importação de planilhas (`.xlsx`, `.xlsm`, `.xls`, `.csv` — de `.xlsm` só os valores das células são lidos, macros nunca são executadas) para os catálogos planos: cabos condutores, cabos de guarda, cabos de tirante, isoladores, tipos de solo, mão de obra, equipamentos e custos fixos. Ao receber um arquivo, o sistema SHALL solicitar ao usuário o catálogo de destino, a aba da planilha e a linha de cabeçalho (planilhas legadas têm linhas de título antes do cabeçalho), e então exibir as colunas encontradas para mapeamento. Catálogos hierárquicos ou compostos (séries de estruturas, tipos de torre, tipos de fundação, matriz de volumes, equipes de trabalho) NÃO SHALL aparecer como destino nesta versão.

#### Scenario: Fluxo guiado do arquivo ao mapeamento

- **WHEN** o usuário solta um arquivo `.xlsx` na tela de Importação Analítica, escolhe o catálogo "Cabos condutores", a aba `DB_CAL` e indica a linha de cabeçalho
- **THEN** o sistema exibe as colunas dessa linha (ex.: `Código de conductor`, `Peso (ton/km)`, `Diámetro (mm)`, `UTS (kN)`) prontas para associação aos campos do cadastro

#### Scenario: Arquivo em formato não suportado é rejeitado

- **WHEN** o usuário tenta subir um arquivo que não é `.xlsx`, `.xlsm`, `.xls` nem `.csv`
- **THEN** o sistema rejeita o arquivo com mensagem em português informando os formatos aceitos, sem iniciar o assistente

### Requirement: Mapear colunas para os campos do cadastro com validação de obrigatoriedade

O sistema SHALL apresentar, para o catálogo escolhido, a lista de campos do cadastro com seus rótulos em português, indicando quais são requeridos (a chave natural/código do item é sempre requerida). Para cada campo o usuário SHALL poder associar uma coluna do arquivo ou, alternativamente, um valor fixo aplicado a todas as linhas (necessário para discriminadores como o tipo STEEL/OPGW dos cabos de guarda e a categoria dos custos fixos). Campo requerido sem coluna e sem valor fixo SHALL bloquear o avanço com orientação em português; campo opcional sem associação SHALL gerar aviso de que ficará "não informado" — nunca zero ou texto vazio (RNF-09). O usuário SHALL informar a data de início de vigência (data civil válida) aplicada às versões criadas na importação (RNF-05).

#### Scenario: Campo requerido sem mapeamento bloqueia com orientação

- **WHEN** o usuário tenta avançar sem associar coluna nem valor fixo ao campo código do item
- **THEN** o sistema bloqueia o avanço informando, em português, que o campo é requerido e precisa de uma coluna ou valor fixo

#### Scenario: Campo opcional sem mapeamento gera aviso e importa como não informado

- **WHEN** o usuário avança com o campo opcional "fabricante" sem coluna associada
- **THEN** o sistema exibe o aviso de que o campo ficará sem dados e os itens importados registram o campo como "não informado", nunca zero

#### Scenario: Valor fixo aplicado a todas as linhas

- **WHEN** o usuário importa a aba `DB_OPGW` para cabos de guarda associando ao campo tipo o valor fixo `OPGW`
- **THEN** todos os itens importados são criados com o tipo OPGW, sem exigir coluna de tipo no arquivo

### Requirement: Importar somente itens novos com prévia validada e relatório

Antes de gravar, o sistema SHALL exibir uma prévia com o resultado da validação linha a linha, aplicando as mesmas regras dos cadastros (decimais com ponto e escala do campo, inteiros, datas civis, valores de enumeração) e classificando cada linha como: a importar, ignorada por já existir (chave natural igual, comparação sem diferenciar maiúsculas) ou inválida (com o motivo em português). Ao confirmar, o sistema SHALL criar item e versão inicial com a vigência informada apenas para as linhas válidas e novas — itens existentes NUNCA são alterados (histórico imutável, RNF-05) — e SHALL apresentar o relatório final com as contagens de importados, ignorados e inválidos. A importação registra o autor da operação.

#### Scenario: Dedup pela chave natural ignora itens já cadastrados

- **WHEN** o arquivo contém os códigos `AAAC 63,36 MCM` (já cadastrado) e `AAAC 77,47 MCM` (novo)
- **THEN** a prévia marca o primeiro como ignorado por já existir e o segundo como a importar, e após a confirmação apenas o novo item é criado

#### Scenario: Linha inválida é reportada e não importada

- **WHEN** uma linha traz `abc` na coluna associada a um campo decimal
- **THEN** a prévia marca a linha como inválida com o motivo em português, a importação das demais linhas não é bloqueada e o relatório final contabiliza a linha inválida

#### Scenario: Relatório final com as contagens

- **WHEN** o usuário confirma a importação de um arquivo com 10 linhas, sendo 6 novas válidas, 3 já cadastradas e 1 inválida
- **THEN** o sistema apresenta o relatório "6 importados, 3 ignorados (já cadastrados), 1 inválido" e os 6 itens novos aparecem nos respectivos catálogos com a vigência informada
