## Why

A tela "Upload & OCR" é hoje um mockup decorativo (arquivos e fila de processamento simulados, sem backend) e a alimentação dos catálogos é 100% manual, item a item, apesar de os dados já existirem prontos nas abas `DB_*` da planilha legada "Calculo LT" (DB_CAL, DB_CGA, DB_OPGW, DB_CTI, DB_AIS, DB_FUN, DB_MO, DB_EQ, DB_FI — espelhos diretos dos catálogos implementados). A decisão de produto mudou: não haverá upload de projetos/arquivos de engenharia com OCR; em seu lugar, a tela vira a **Importação Analítica** — um assistente de importação de planilhas para preenchimento dos catálogos, com mapeamento de colunas guiado pelo usuário.

## What Changes

- A tela `/upload` deixa de ser o mockup "Gestão de Documentos / Importação Analítica de Fundações" e passa a se chamar **Importação Analítica** (item de menu renomeado; some a fila fake de OCR e o suporte simulado a PDF). **BREAKING** apenas no sentido visual/rotulagem — nenhuma funcionalidade real é removida porque nada era real.
- Assistente de importação em etapas: (1) soltar/selecionar arquivo `.xlsx`/`.xlsm`/`.xls`/`.csv`; (2) escolher o **catálogo de destino** (v1: os 8 catálogos planos — cabos condutores, cabos de guarda, cabos de tirante, isoladores, tipos de solo, mão de obra, equipamentos, custos fixos); (3) escolher **aba** e **linha de cabeçalho** (as planilhas legadas têm linhas de título antes do cabeçalho e seções empilhadas); (4) **mapear colunas** do arquivo para os campos do cadastro, com opção de **valor fixo** para todas as linhas (necessário p.ex. para o tipo STEEL/OPGW dos cabos de guarda e a categoria dos custos fixos); (5) informar a **vigência** (`effectiveFrom`) das versões criadas; (6) prévia com validação linha a linha; (7) importar **somente os itens ainda não cadastrados** (dedup pela chave natural/código), com relatório de importados, ignorados por já existirem e inválidos.
- Campo requerido sem coluna mapeada e sem valor fixo **bloqueia** a importação com orientação; campo opcional sem mapeamento gera **aviso** de que ficará "não informado" (nunca zero — RNF-09).
- Parse no servidor seguindo o precedente do import PLS-CADD (multipart → prévia → commit), reutilizando a dependência `xlsx` já existente.
- Fora do escopo (v1): catálogos hierárquicos/compostos (séries de estruturas/tipos de torre, tipos de fundação, matriz de volumes, equipes de trabalho) e a importação de propostas/leilões históricos (abas `Info&Cond`/`Datos` — change futura própria).

## Capabilities

### New Capabilities

- `catalogos/importacao-analitica`: assistente de importação de planilhas para os catálogos planos — seleção de catálogo/aba/cabeçalho, mapeamento de colunas com valor fixo, validação espelhando os cadastros, dedup pela chave natural e relatório de importação.

### Modified Capabilities

Nenhuma — o spec da casca não enumera os itens de sistema do menu; o rótulo "Importação Analítica" é requisito da capability nova.

## Impact

- **Web**: `apps/web/src/app/upload/` reescrita (mockup → assistente em etapas); `app.ts`/`app.spec.ts` (rótulo do item de sistema no menu).
- **API**: módulo novo de importação no contexto `catalogs` (`preview-import`/`commit-import` por catálogo), reutilizando os services/repositórios existentes dos 8 catálogos e as validações de borda compartilhadas; upload multipart (limite de tamanho definido no design).
- **Domain**: registro declarativo de metadados de importação por catálogo (campos, rótulos pt-BR, requeridos, tipo/escala, chave natural) — primeira consolidação do "schema de catálogo" como dado.
- **Dependências**: nenhuma nova (`xlsx` e multipart já usados pelo import PLS-CADD).
- **Dados**: importação cria itens+versões iniciais nos catálogos; itens existentes nunca são alterados (histórico imutável, RNF-05).
