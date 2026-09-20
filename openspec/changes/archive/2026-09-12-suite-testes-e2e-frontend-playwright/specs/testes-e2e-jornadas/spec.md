## Purpose

Define a suíte de testes automatizados ponta a ponta (E2E) em navegadores reais com Playwright, cobrindo as jornadas do usuário de orçamentação EPC, gestão de catálogos com vigência temporal, governança e conformidade contratual (RF-01..RF-65, RNF-05, RNF-14, RNF-17).

## ADDED Requirements

### Requirement: Automação da Jornada de Catálogos e Imutabilidade de Vigência
O sistema SHALL disponibilizar testes E2E automatizados validando o ciclo de vida de itens de catálogo, assegurando que a criação, edição por nova versão com vigência e consulta do histórico de versões funcionem corretamente na interface web, e que versões passadas permaneçam imutáveis sem sobrescrita (RNF-05).

#### Scenario: Criação e versionamento de cabo condutor no navegador
- **WHEN** o teste automatizado preenche o formulário de criação de cabo condutor, submete uma nova versão vigente e abre o histórico
- **THEN** a interface exibe as duas versões ordenadas cronologicamente com suas respectivas datas de vigência e atributos intactos

#### Scenario: Sinalização visual de pendência em campos em branco
- **WHEN** um item de catálogo é cadastrado com campos opcionais nulos
- **THEN** a listagem exibe o badge visual de pendência sem converter os dados ausentes em zero

### Requirement: Automação da Jornada Completa de Orçamentação EPC (Happy Path)
O sistema SHALL disponibilizar testes E2E automatizados cobrindo a jornada completa de elaboração de uma oferta EPC de linha de transmissão: cadastro da oferta e linhas, estaqueamento PLS-CADD, verificação de quantitativos, cotações, ajuste de cronograma/histograma e download do arquivo Excel do edital (`.xlsx`).

#### Scenario: Fluxo integrado de criação de oferta e exportação XLSX
- **WHEN** o teste automatizado cria uma proposta, preenche o estaqueamento, ajusta parâmetros de cronograma e aciona o botão de exportar proposta
- **THEN** o navegador realiza o download de um arquivo `.xlsx` válido com os quantitativos e memórias consolidadas

### Requirement: Automação de Governança, Congelamento de Revisão e Auditoria
O sistema SHALL disponibilizar testes E2E automatizados validando o ciclo de vida da revisão de oferta (`DRAFT` -> `FROZEN`), garantindo que o congelamento desabilite edições na interface, permita a criação de revisões sucessivas e registre os eventos de forma rastreável na Trilha de Auditoria (RF-64).

#### Scenario: Bloqueio de edição em revisão congelada
- **WHEN** o usuário aciona o congelamento de uma revisão em rascunho
- **THEN** a interface exibe a revisão como `FROZEN`, bloqueia todos os campos de formulário e gera registro correspondente na aba de auditoria

### Requirement: Automação do Painel de Verificações de Consistência e Riscos
O sistema SHALL disponibilizar testes E2E automatizados para detecção e resolução de inconsistências de projeto, confirmando que erros impeditivos (ex.: torres sem fundação) exibam alertas na interface e que contingências cadastradas na matriz de riscos sejam refletidas no Capex final.

#### Scenario: Detecção e resolução de pendência no painel de consistência
- **WHEN** uma inconsistência é identificada no estaqueamento e posteriormente corrigida pelo usuário
- **THEN** o painel de consistência atualiza dinamicamente o status de alerta vermelho para verde de conformidade
