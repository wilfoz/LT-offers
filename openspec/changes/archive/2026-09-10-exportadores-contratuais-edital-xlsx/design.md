## Context

Ver `proposal.md` para motivação e enquadramento na Fase F6.3 do roadmap (Módulo M09, M11, M12, RF-47, RF-48, RF-49, RF-50, RF-60, RNF-11, RNF-18).
O sistema possui todos os dados orçamentários calculados (engenharia, suprimentos, cronograma, histogramas, canteiros, serviços, BDI e desembolso), necessitando agora dos geradores contratuais oficiais para dispensar o uso da planilha legada.

## Goals / Non-Goals

**Goals:**
- Implementar gerador de planilhas XLSX profissionais utilizando a biblioteca `exceljs`, com estilização corporativa, formatação numérica brasileira (R$, percentuais, 2 a 3 casas decimais) e hierarquia de subtotais.
- Gerar os 3 artefatos XLSX principais: (1) Planilha de Preços do Edital com códigos CIP e BDI, (2) Folha de Medição e Variação de Preços Unitários, e (3) Cronograma de Faturamento e Curva S.
- Implementar o cálculo dos indicadores paramétricos de desempenho sintético (RF-49: R$/km, R$/torre, t/km, m³/km).
- Gerar o pacote integral aberto em formato JSON (RNF-18) contendo todas as entidades e resultados da oferta.
- Criar a aba "Central de Emissão & Exportação" na interface Angular com seleção de layout e downloads diretos.

**Non-Goals:**
- Importação reversa de alterações feitas diretamente dentro do arquivo XLSX gerado (o sistema web é a fonte da verdade de dados e regras).
- Integração com ERP de execução de obras (reservado para a Fase F7).

## Decisions

### Decisão 1: Biblioteca de Geração XLSX `exceljs`
- **Escolha:** Utilizar `exceljs` para construção programática de workbooks no NestJS.
- **Alternativa considerada:** `xlsx` (SheetJS) ou CSV simples.
- **Racional:** `exceljs` oferece suporte nativo e flexível a estilos ricos (fontes, bordas, preenchimentos, formatos numéricos de moeda e fórmulas de totalização) essenciais para atender ao RNF-11 e à exigência de layouts contratuais de editais.

### Decisão 2: Arquitetura de Templates Multi-Layout (RF-50)
- **Escolha:** Mapeador desacoplado `TenderSheetFormatter` com suporte aos layouts `ANEEL_STANDARD`, `CELEO_STANDARD` e `GENERIC_EPC`.
- **Alternativa considerada:** Implementar funções separadas e duplicadas para cada cliente.
- **Racional:** Permite adicionar novos formatos de concessionárias mantendo o mesmo fluxo de extração de dados do motor de cálculo.

### Decisão 3: Pacote Integral em JSON Aberto (RNF-18)
- **Escolha:** Endpoint dedicado `/api/offers/:id/export/full-package` gerando um payload JSON estruturado com metadados, parâmetros, linhas, cotações e resultados consolidados.
- **Alternativa considerada:** Exportar apenas dumps de tabelas SQL.
- **Racional:** Formato auto-contido e legível por humanos e outras aplicações, garantindo soberania dos dados do orçamentista.

## Risks / Trade-offs

- **[Risco] Tamanho e tempo de compilação de planilhas com centenas de linhas e CIPs** → *Mitigação:* Geração em memória com Buffer compactado e streaming direto na resposta HTTP com `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.
