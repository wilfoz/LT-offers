## Purpose

Define os requisitos e regras para a exportação de entregáveis contratuais em formato XLSX estruturado e em pacote aberto JSON (Módulo M12, RF-47, RF-48, RF-50, RF-60, RNF-11, RNF-18), abrangendo a Planilha de Preços do Edital com códigos CIP e BDI, Folha de Medição Contratual, Preços Unitários e Cronograma de Faturamento.

## Requirements

### Requirement: Emissão de Planilha de Preços do Edital em XLSX com Código CIP (RF-47, RF-50, RNF-11)
O sistema SHALL gerar a Planilha de Preços do Edital em formato XLSX com estilos profissionais, estruturação hierárquica e código CIP do contratante por item de fornecimento e serviço, aplicando as alíquotas de BDI e coeficientes $K$ específicos por grupo de custo e totalizando por linha e lote.

#### Scenario: Exportação da planilha do edital com árvore CIP
- **WHEN** o orçamentista solicita a exportação da Planilha de Preços da oferta no padrão do edital
- **THEN** o sistema gera um arquivo XLSX contendo cabeçalho com identificação do leilão/lote, colunas de código CIP, descrição, unidade, quantidade, custo direto unitário, BDI (%) e preço de venda totalizado

---

### Requirement: Emissão da Folha de Medição e Variação de Preços Unitários (RF-48, RNF-11)
O sistema SHALL gerar as folhas de medição contratual (`M1..M10`) e folhas de variação de preços unitários (`PU1..PU10`) em formato XLSX por linha de transmissão, detalhando os quantitativos físicos consolidados, critérios de medição em campo e preços unitários com tributos para gestão de pleitos e aditivos.

#### Scenario: Geração da folha de medição de fundações e montagem
- **WHEN** o usuário seleciona a exportação da folha de medição da linha LT-01
- **THEN** o sistema emite a planilha XLSX com as quantidades teóricas de escavação, concreto, aço e peso de torres com os respectivos critérios de medição contratual

---

### Requirement: Exportação do Cronograma de Faturamento e Desembolso Mensal (RF-60, RNF-11)
O sistema SHALL exportar o cronograma de faturamento e desembolso financeiro mês a mês em planilha XLSX, apresentando as parcelas mensais por grupo de fornecimento/serviço, o desembolso acumulado ($DT$) e a identificação do pico de exposição de caixa.

#### Scenario: Exportação de fluxo financeiro da proposta
- **WHEN** a diretoria financeira exporta o cronograma de faturamento mensal
- **THEN** o sistema gera o arquivo XLSX com a curva mensal de recebimentos e desembolsos ao longo dos meses de obra

---

### Requirement: Exportação Integral da Oferta em Formato Aberto (RNF-18)
O sistema SHALL permitir o download de um pacote integral da proposta em formato JSON estruturado (*Full Offer Package*), contendo todos os dados cadastrais, revisões, estaqueamento de estruturas, cotações de suprimentos, cronograma físico, parâmetros de BDI e resultados calculados, garantindo interoperabilidade total sem aprisionamento tecnológico.

#### Scenario: Exportação de pacote JSON aberto
- **WHEN** o usuário clica em "Exportar Pacote Aberto (JSON)"
- **THEN** o sistema gera o arquivo JSON completo com todos os dados brutos e resultados da proposta
