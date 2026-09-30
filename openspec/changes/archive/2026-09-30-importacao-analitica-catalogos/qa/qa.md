# QA — importacao-analitica-catalogos

**Resumo: APROVADO.** Passaram 28/28 verificações: 14 E2E com a planilha real (incluindo console sem erros), 11 TI na API e 3 de acessibilidade e responsividade. As suítes completas estão verdes: domain 202, api 469, web 418. O QA encontrou 1 bug (BUG-1), corrigido na causa raiz com teste de regressão e revalidado ao vivo.

- **Data:** 2026-09-30.
- **Ambiente:** Postgres via Docker Compose (`lt-offers-postgres`, porta 5432), API `npx nx serve api` na porta 3000 e web `npx nx serve web --port 5100` (proxy `/api` → 3000).
- **E2E:** Playwright headless (script `qa/e2e-importacao.js`, executado da raiz), sobre o template real `template/Calculo LT-CELEO-LOTE-04-2026-XXX_R0_COM REIDI BR-v03.xlsm` (~30 MB, 114 abas). Foram duas rodadas. A rodada 1 (`qa-2026-09-30-e2e-resultados-rodada1.json`) fez E2E-1 a E2E-10 e gravou DB_CAL. A rodada 2 (`...-rodada2.json`, `SKIP_DB_CAL=1`) fez E2E-1, E2E-2 e E2E-11 em diante. A rodada 1 parou em E2E-11 por um problema do script: o painel do mat-select anterior ainda fechava, e o mat-label de um select vazio fica sobre o gatilho. A correção foi esperar o overlay fechar e forçar o clique. Não era defeito da aplicação.
- **Dados que ficaram no banco de dev** (importação real; histórico imutável):
  - 305 cabos condutores de DB_CAL e 9 cabos de guarda OPGW de DB_OPGW, todos com vigência 2026-01-01.
  - Cargos de mão de obra criados pelos TI: `QA-IMP-01` (autor `qa@orcamento-lt.com.br`) e `AAAC 63,36 MCM`/"x". Este último é artefato de teste: um código de outro catálogo usado para provar que a chave natural é por catálogo.

## Checklist por cenário do spec `catalogos/importacao-analitica`

### Requirement: Oferecer o assistente de Importação Analítica para catálogos planos

| Cenário | Tipo | Resultado | Evidência |
| --- | --- | --- | --- |
| Fluxo guiado do arquivo ao mapeamento | E2E | PASSOU | E2E-1: o menu "Importação Analítica" abre `/upload`, sem "Upload & OCR" nem fila de processamento (`qa-2026-09-30-e2e1-etapa-arquivo.png`). E2E-3a: os destinos são os 8 catálogos planos, sem os hierárquicos. E2E-3b: DB_CAL com cabeçalho na linha 5 (2 linhas de título antes) expõe `C · Código de conductor`, `D · Peso (ton/km)`, `F · Diámetro (mm)` e `G · UTS (kN)` (`e2e3-mapeamento-db-cal.png`). |
| Arquivo em formato não suportado é rejeitado | E2E + TI | PASSOU | E2E-2: `.pdf` é recusado sem iniciar o assistente (`e2e2-formato-nao-suportado.png`). TI-1 dá 400 pt-BR para `.md`. TI-2 dá 400 sem arquivo. TI-3 dá 413 pt-BR acima de 40 MB (`ti1..ti3-*.txt`). |

### Requirement: Mapear colunas para os campos do cadastro com validação de obrigatoriedade

| Cenário | Tipo | Resultado | Evidência |
| --- | --- | --- | --- |
| Campo requerido sem mapeamento bloqueia com orientação | E2E + TI | PASSOU | E2E-4 bloqueia com "O campo Código é requerido: associe uma coluna do arquivo ou informe um valor fixo" (`e2e4-requerido-bloqueado.png`). TI-5: a API também recusa (400) o Tipo sem coluna nem valor fixo. |
| Campo opcional sem mapeamento gera aviso e importa como não informado | E2E | PASSOU | E2E-5 avisa "ficarão sem dados (não informado, nunca zero): Descrição, …". E2E-9: o item `AAAC 63,36 MCM` foi gravado com `description: null`, `weightTonPerKm: "0.092"` e vigência 2026-01-01. |
| Valor fixo aplicado a todas as linhas | E2E | PASSOU | E2E-11/13: DB_OPGW com Tipo = valor fixo OPGW. Os itens foram criados como `OPGW` sem coluna de tipo no arquivo (`e2e11-mapeamento-opgw-valor-fixo.png`, `e2e13-relatorio-opgw.png`). |

A vigência é data civil válida. E2E-6: `2027-02-30` é recusada na interface. TI-4: a API devolve 400 "Data inválida: "2027-02-30"…". TI-6: opções malformadas devolvem 400 com uma mensagem pt-BR por campo.

### Requirement: Importar somente itens novos com prévia validada e relatório

| Cenário | Tipo | Resultado | Evidência |
| --- | --- | --- | --- |
| Dedup pela chave natural ignora itens já cadastrados | E2E + TI | PASSOU | E2E-10: reimportar DB_CAL dá "0 a importar, 307 ignoradas (já cadastradas)" com o botão Importar desabilitado (`e2e10-reimportacao-dedup.png`). TI-9: `qa-imp-01` depois de `QA-IMP-01` no mesmo commit sai ignorado, sem diferenciar maiúsculas. |
| Linha inválida é reportada e não importada | E2E + TI | PASSOU | E2E-12: "12-48" em Número de fibras vira linha inválida com motivo, e as demais seguem (`e2e12-previa-opgw.png`). TI-8: CSV com `;`, `4.500,50` normalizado para `4500.5`, e `abc` num decimal fica inválido com motivo. |
| Relatório final com as contagens | E2E | PASSOU | E2E-8: "305 importados, 0 ignorados (já cadastrados), 43 inválidos, 2 duplicados no arquivo" (`e2e8-relatorio-db-cal.png`). As 43 inválidas são linhas de separação/placeholder do template, sem código, cada uma com o motivo. |

O autor da operação é registrado. TI-11: a versão de `QA-IMP-01` tem `createdBy = qa@orcamento-lt.com.br` (header X-User) e vigência 2026-01-01 (`ti11-autor-e-vigencia.json`). Limites: TI-10 recusa um commit de 5001 itens com 400 pt-BR. TI-9: chaves fora do registro (`id`, `createdBy`) são descartadas.

### Telas, acessibilidade e responsividade

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| A11Y-1: a troca de etapa leva o foco ao título "Etapa 2 de 6: Catálogo" | PASSOU | rodada 2 |
| A11Y-2: seletor de catálogo operável por teclado (Tab, Enter, Esc) | PASSOU | rodada 2 |
| RESP-1: mapeamento em 375 px sem rolagem horizontal da página | PASSOU | `resp-375-mapeamento.png` |
| Console do navegador sem erros nas duas rodadas | PASSOU | JSON das rodadas |

Rótulos, `role=alert/status`, tabelas com `caption`/`scope` e badges textuais foram conferidos no review do grupo 3.

## Bugs

| ID | Descrição | Causa raiz | Correção | Teste de regressão | Status |
| --- | --- | --- | --- | --- | --- |
| BUG-1 | Upload em campo multipart diferente de `file` respondia em inglês ("Unexpected field - arquivo") | O filtro comparava a mensagem do multer por igualdade exata, mas o Nest anexa o nome do campo | `ImportUploadExceptionFilter` passou a comparar por prefixo | O teste do filtro usa a forma real "Unexpected field - arquivo". Ele falha sem a correção (13/14) e passa com ela (14/14). A revalidação ao vivo deu 400 pt-BR (`ti7-campo-multer-revalidado.txt`) | CORRIGIDO |

## Observações (não bloqueiam)

- Planilhas legadas têm linhas de placeholder (id preenchido, código vazio) dentro do bloco contíguo: 43 em DB_CAL e 37 em DB_OPGW. Elas aparecem como inválidas ("O campo Código é obrigatório"), fiel ao design D4. É ruído aceitável e visível.
- Com o tipo fixado em OPGW, o aviso de opcionais cita também os campos de aço. O aviso é verdadeiro, mas ruidoso (review do grupo 3, MIN-1).
- UTS no DB_OPGW está em toneladas, e o cadastro espera kN. O mapeamento deixa a coluna de fora; a conversão de unidade não é escopo da importação.
- A dívida de segurança do SheetJS 0.18.5 (CVEs, zip bomb, parse síncrono) está registrada no design (MAJ-2 do grupo 2).

## Suítes automatizadas

- `npx nx run-many -t test lint -p api domain --skip-nx-cache`: api 469 e domain 202, verdes, sem erros de lint.
- `cd apps/web && npx vitest run`: 418 verdes. O `npx nx test web` falha neste ambiente Windows por um problema pré-existente, reproduzido também no main sem alterações.
- `npx nx build web --skip-nx-cache`: sucesso, sem warnings.
