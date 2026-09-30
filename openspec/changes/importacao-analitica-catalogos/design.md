## Context

Motivação no proposal.md — Why. Estado atual relevante:

- `apps/web/src/app/upload/` é um mockup sem backend (arquivos e fila hardcoded); a rota e o item de menu de sistema "Upload & OCR" existem na casca.
- Precedente de importação já estabelecido: PLS-CADD (RF-18/RF-22) parseia **no servidor** em duas fases — `POST .../preview-import` (multipart, devolve linhas parseadas) e `POST .../commit-import` (payload confirmado) — usando a dependência `xlsx` (SheetJS); `exceljs` também está disponível (contexto export).
- Os 8 catálogos planos têm services/repositórios prontos no contexto `catalogs` com validações de borda compartilhadas (`decimal-scale.validators`, `CivilDate`), mappers tipados contra a domain e chave natural `code @unique` (cabos de guarda com discriminador `GroundWireType`; custos fixos com enum `FixedCostCategory`; tipos de solo com `Boolean?` `submerged`).
- Planilha legada real (template CELEO): abas `DB_*` espelham os catálogos; cabeçalho NÃO é a primeira linha (DB_CAL: 3ª linha; DB_FUN empilha seções SUELOS/FUNDACIONES; DB_MO tem células de anotação) — colunas em espanhol/português misturados.

## Goals / Non-Goals

**Goals:**

- Assistente genérico dirigido por metadados: adicionar um catálogo plano novo ao import deve ser registrar metadados, não escrever código de fluxo.
- Reuso integral da validação e da criação de item+versão já existentes por catálogo (nenhuma regra duplicada).
- Prévia fiel: o que a prévia classifica é exatamente o que o commit grava.

**Non-Goals:**

- Persistir arquivos no servidor (o arquivo vive só na requisição de prévia) ou histórico de importações em banco.
- Templates de mapeamento salvos/reutilizáveis entre importações (registrado como evolução futura).
- Atualizar itens existentes ou criar novas versões de itens existentes via import (só itens novos).
- Catálogos hierárquicos/compostos e importação de propostas históricas (change própria).

## Decisions

### D1. Registro declarativo de importação por catálogo na domain

`libs/domain/src/lib/catalogs/import-registry.ts`: mapa `catalogKey → { label, naturalKey, fields[] }` onde cada campo declara `key`, rótulo pt-BR, `required`, `kind` (`text | decimal | int | boolean | enum`), `scale` (decimais), `enumValues`/`enumLabels` quando aplicável e `maxLength` de textos. Fonte única para: a UI do mapeamento (lista de campos e obrigatoriedade), a validação da prévia e a montagem do payload de criação. Alternativa rejeitada: derivar por reflexão dos DTOs da API — os DTOs são classes com decorators não enumeráveis de forma confiável e a UI não pode importá-los; o registro declarativo é a primeira consolidação do "schema de catálogo" como dado (candidato natural a substituir mapas dispersos de `missingFields` numa change futura, sem tocar neles agora).

### D2. Parse no servidor em três endpoints, seguindo o precedente PLS-CADD

Módulo novo `catalog-import` no contexto `catalogs` (`apps/api/src/contexts/catalogs/.../import/`):

- `POST /catalogs/import/inspect` (multipart): devolve abas e, por aba, as primeiras N linhas cruas (para o usuário apontar o cabeçalho na UI). Limite de upload de 40 MB (o template legado tem ~30 MB).
- `POST /catalogs/import/preview` (multipart + catálogo, aba, linha de cabeçalho, mapeamento, valores fixos, vigência): parseia, valida cada linha pelo registro do D1, consulta os códigos existentes e devolve a classificação (a importar / ignorada-existente / inválida com motivo pt-BR) e os payloads normalizados das linhas válidas.
- `POST /catalogs/import/commit` (JSON): recebe os payloads normalizados aprovados na prévia e grava via services existentes. Rationale: o arquivo não precisa subir duas vezes nem ser retido no servidor; o que foi visto na prévia é o que o commit grava (goal de fidelidade). Trade-off aceito: o payload do commit pode ser grande (centenas de linhas), irrelevante em rede local. Alternativa rejeitada: reenviar o arquivo no commit (re-parse pode divergir da prévia se o arquivo mudar).

### D3. Dedup e escrita reutilizando os services de catálogo

O commit itera as linhas chamando o service de criação do catálogo correspondente (item + versão inicial com a vigência única informada, autor via `X-User`). Códigos são comparados sem diferenciar maiúsculas (`code` normalizado por `trim`; colisão exata segue a unicidade do banco). Corridas entre prévia e commit são resolvidas pelo `P2002` já mapeado nos services: a linha vira "ignorada (já cadastrada)" no relatório final em vez de abortar a importação. Linhas do próprio arquivo com código repetido: a primeira vale, as demais são marcadas duplicadas na prévia.

### D4. Leitura da planilha: aba + linha de cabeçalho apontadas pelo usuário

`sheet_to_json(header: 1)` da `xlsx`, com a linha de cabeçalho escolhida pelo usuário na UI (evidência: DB_CAL tem 2 linhas de título antes do cabeçalho; DB_MO/DB_FUN são irregulares). Os dados considerados são as linhas contíguas abaixo do cabeçalho até a primeira linha totalmente vazia (evita arrastar seções empilhadas, caso DB_FUN); a prévia mostra o intervalo exato, e linhas fora do padrão aparecem como inválidas com motivo. Números vindos como `number` do parser são convertidos a string decimal com a escala do campo; strings com vírgula decimal ("0,85") são aceitas e normalizadas para ponto antes da validação (planilhas legadas usam vírgula).

### D5. UI: assistente em etapas na rota `/upload`

Componente `analytic-import` substitui o mockup (rota preservada; item de menu renomeado para "Importação Analítica"; ícone `upload_file`). Stepper com as etapas do spec (arquivo → catálogo → aba/cabeçalho → mapeamento+vigência → prévia → relatório), estado em signals, chamadas via service `CatalogImportApi`. Padrões institucionais obrigatórios: callbacks de erro em toda chamada, botões refletindo estado, mensagens pt-BR, sem BOM. O drop de PDF e a "fila de OCR" do mockup morrem.

### D6. Fora do banco

Nenhuma tabela nova: a importação é uma operação, não um agregado. O relatório final vive na resposta do commit (quem quiser trilha permanente terá a change de auditoria futura — a porta fina de auditoria já tem extração pendente pela regra das três; não antecipar aqui).

## Risks / Trade-offs

- [Planilhas legadas irregulares (células mescladas, anotações, seções empilhadas)] → o usuário aponta aba e cabeçalho; a prévia é obrigatória e mostra exatamente o que entra; linhas fora do padrão caem como inválidas com motivo, nunca silenciosamente.
- [Arquivo de 30 MB no parse síncrono] → limite de 40 MB e parse por aba selecionada; se a latência incomodar no QA, o `inspect` pode ler só nomes de abas + primeiras linhas via leitura parcial (otimização, não muda contrato).
- [Divergência prévia→commit por edição concorrente do catálogo] → `P2002` degrada a linha para "ignorada", relatório contabiliza; nenhuma escrita parcial abortada.
- [Registro D1 desatualizar frente aos DTOs dos catálogos] → teste de paridade por catálogo: payload gerado pelo registro com todos os campos → 0 erros no DTO correspondente; campo requerido do DTO ausente no registro reprova (mesma família do teste de paridade DTO × contrato já padronizado no projeto).

## Open Questions

- Persistir histórico de importações (quem importou o quê e quando) pode ser desejável para auditoria — deliberadamente adiado (D6); se virar requisito, é change própria com a extração da porta de auditoria.

## Decisões de implementação

- **`.xlsm` aceito (29/09/2026, decisão do usuário)**: o spec original listava só `.xlsx/.xls/.csv`, mas o QA (task 4.2) importa o template real `Calculo LT-...-v03.xlsm`. O parser lê apenas valores de células (SheetJS não executa macros), então `.xlsm` entra na lista de formatos aceitos; spec, proposal e task 2.1 atualizados.
