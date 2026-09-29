## Purpose

Define o snapshot local do resultado oficial dos leilões de transmissão da ANEEL (dataset aberto, 1999 em diante), sua sincronização sob demanda com normalização dos valores publicados, a consulta com filtros e o benchmark de deságio exibido no detalhe da oferta via identidade normalizada do leilão (RF-01, RF-11, RNF-04, RNF-08, RNF-09).

## Requirements

### Requirement: Manter snapshot local do histórico de leilões (RNF-04)

O sistema SHALL manter em banco um snapshot do resultado oficial dos leilões de transmissão da ANEEL — uma linha por lote com ano, data do leilão, número do leilão (`NNN/AAAA`), número do lote, nome do empreendimento, UF principal, prazo de construção em meses, extensão de linha em km, potência de subestação em MVA, investimento previsto, RAP máxima do edital, vencedor, RAP vencedora e deságio percentual — e um log imutável de importações (fonte, data/hora, contagem de linhas, autor). Consultas e cálculos SHALL usar exclusivamente o snapshot local, nunca a fonte externa ao vivo (RNF-04). Cada sincronização substitui o snapshot vigente de forma atômica e acrescenta uma entrada ao log de importações.

#### Scenario: Consulta usa o snapshot local sem depender da rede

- **WHEN** o usuário consulta o histórico de leilões com a fonte externa indisponível
- **THEN** o sistema responde normalmente com os dados do snapshot vigente e os metadados da última importação (fonte, data e contagem de linhas)

#### Scenario: Sincronização substitui o snapshot e registra a importação

- **WHEN** uma sincronização conclui com sucesso trazendo o dataset atualizado
- **THEN** o snapshot vigente passa a refletir integralmente o dataset importado e o log de importações ganha uma entrada nova com fonte, data/hora, contagem de linhas e autor, sem alterar entradas anteriores

---

### Requirement: Sincronizar com o dataset oficial normalizando os valores publicados (RNF-08, RNF-09)

O sistema SHALL permitir ao usuário disparar a sincronização do histórico a partir do datastore aberto da ANEEL, executada no servidor, normalizando cada lote publicado: números em texto com vírgula decimal convertidos para decimal exato (nunca float — RNF-08), deságio publicado em fração convertido para percentual com duas casas, número do leilão normalizado para o formato `NNN/AAAA` (preservando sufixo de etapa quando publicado, ex.: `013/2015-2º`) e lote sem vencedor (deserto ou não homologado) gravado com vencedor, RAP vencedora e deságio como "não informado" — nunca zero (RNF-09). Falha na fonte externa (indisponibilidade, timeout ou resposta fora do esquema esperado) SHALL abortar a sincronização com mensagem em português, preservando intacto o snapshot vigente. A sincronização SHALL emitir evento de auditoria com autor e contagem de linhas importadas.

#### Scenario: Valores publicados com vírgula decimal são convertidos exatamente

- **WHEN** a fonte publica um lote com RAP vencedora `"2933612926,94"` e deságio `"0,48"`
- **THEN** o snapshot grava RAP vencedora `2933612926.94` (decimal exato) e deságio `48.00` por cento

#### Scenario: Lote deserto permanece não informado

- **WHEN** a fonte publica um lote sem vencedor
- **THEN** o snapshot grava vencedor, RAP vencedora e deságio como não informados, e o lote continua visível na consulta com essa sinalização

#### Scenario: Falha da fonte externa não corrompe o snapshot

- **WHEN** a sincronização é disparada e a fonte externa está indisponível ou responde fora do esquema esperado
- **THEN** o sistema exibe erro em português identificando a falha, nenhuma linha do snapshot vigente é alterada e nenhuma importação é registrada no log

---

### Requirement: Consultar o histórico com busca e filtros (RF-11)

O sistema SHALL exibir a tela "Histórico de Leilões ANEEL" com a tabela do snapshot vigente, busca textual por empreendimento e vencedor, filtros por número do leilão, UF principal e ano, os metadados da última importação e o botão de sincronização. Valores monetários e percentuais SHALL ser exibidos em formato pt-BR e campos não informados como "não informado" (RNF-09, RNF-14).

#### Scenario: Filtro por leilão lista somente os lotes daquele certame

- **WHEN** o usuário filtra pelo número do leilão `002/2024`
- **THEN** a tabela exibe apenas os lotes do Leilão 002/2024 com RAP máxima, vencedor, RAP vencedora e deságio de cada um

#### Scenario: Snapshot vazio orienta a primeira sincronização

- **WHEN** o usuário abre a tela sem nenhuma importação registrada
- **THEN** o sistema exibe estado vazio orientando a sincronizar com a fonte oficial, sem erro

---

### Requirement: Exibir benchmark de deságio no detalhe da oferta

Quando a revisão da oferta possuir número do leilão e número do lote informados, o sistema SHALL exibir no detalhe da oferta um painel de benchmark com: o resultado oficial do próprio lote quando presente no snapshot (vencedor, RAP vencedora e deságio publicados); as estatísticas do leilão correspondente (deságio mínimo, médio e máximo, quantidade de lotes e lotes desertos); e as estatísticas da base histórica completa. O deságio derivado da revisão (RAPs estimadas) SHALL ser exibido lado a lado para comparação. Sem identidade normalizada informada, ou com snapshot sem correspondência, o painel SHALL indicar a ausência como "não informado"/"sem correspondência" — nunca inventando valores (RNF-09).

#### Scenario: Lote com resultado oficial publicado

- **WHEN** a revisão tem número do leilão `002/2024` e lote `7`, e o snapshot contém esse lote com vencedor e deságio publicados
- **THEN** o painel exibe o resultado oficial do lote e as estatísticas do Leilão 002/2024, lado a lado com o deságio derivado da oferta

#### Scenario: Leilão ainda sem resultado publicado

- **WHEN** a revisão referencia um leilão que não existe no snapshot (ex.: `004/2026` antes da sessão)
- **THEN** o painel informa que não há resultado publicado para o leilão e exibe apenas as estatísticas da base histórica completa

#### Scenario: Oferta sem identidade normalizada não exibe benchmark

- **WHEN** a revisão não possui número do leilão ou número do lote informados
- **THEN** o painel indica que o benchmark requer a identidade normalizada do leilão, sem consultar o histórico nem exibir valores
