# Design: catalogo-cabos-guarda-opgw

## Context

Ver `proposal.md — Why`. O piloto (`piloto-catalogo-cabos`, arquivado) fixou os precedentes: modelo item + versões com vigência derivada (D1), data de referência resolvida na borda (D2), módulo NestJS `catalogs` com class-validator e decimais como string no JSON (D3), feature Angular standalone + signals (D4), autor provisório via `X-User` (D6) e o helper `civil-date.ts` como padrão de datas civis (review grupo-2-3). Este design só registra o que é novo neste catálogo: a variação por tipo.

## Goals / Non-Goals

**Goals:**

- Replicar o padrão do piloto sem regressão de qualidade (datas civis, P2002→409, mensagens pt-BR, format:check).
- Estabelecer o precedente de **catálogo com tipos** (atributos comuns + específicos) para os próximos catálogos que tiverem variantes.

**Non-Goals:**

- Extrair abstração "catálogo genérico": segunda ocorrência do padrão — só na terceira (regra registrada no design do piloto). Duplicação consciente entre `conductor-cables` e `ground-wires` é aceita.
- Herança/polimorfismo no banco (tabela por tipo): fora — ver D1.

## Decisions

### D1 — Tabela única com discriminador de tipo e colunas específicas anuláveis

`ground_wire` (identidade: id, código único, **`type`** enum `GroundWireType { STEEL, OPGW }`) e `ground_wire_version` (comuns: descrição, peso, bobina, diâmetro, UTS; específicos de aço: `galvanization_class`, `strength_grade`, `wire_count`; específicos de OPGW: `manufacturer`, `i2t_ka2s`, `fiber_count`; mais `effective_from`, `created_by`, `created_at`). O tipo fica na identidade — não muda entre versões — e a validação de aplicabilidade por tipo é feita no service (DTO único com todos os campos opcionais; campos do outro tipo → 400 com mensagem pt-BR).

Alternativas rejeitadas: (a) duas tabelas/catálogos separados — o levantamento (§05) modela cabo de guarda como entidade única com variantes e a planilha consolida ambos na aba `CG`; separar dificultaria o consumo futuro por quantitativos (RF-23) e duplicaria API/UI sem ganho; (b) tabela de versão por tipo (herança) — complexidade de joins e de histórico sem necessidade: são 3 colunas específicas por tipo, todas anuláveis por RNF-09 de todo modo; (c) JSON de atributos específicos — perderia tipagem Decimal nativa (RNF-08) e validação por coluna.

### D2 — Rotas dedicadas `/catalogs/ground-wires`, tipo no corpo e filtro na query

CRUD em `apps/api/src/catalogs/ground-wires.*` espelhando `conductor-cables.*`: `POST` (com `type` obrigatório), `POST /:id/versions` (sem `type` — rejeitar se vier, tipo é fixo), `GET` com `?search=` e novo `?type=STEEL|OPGW`, `GET /:id?effectiveOn=`, `GET /:id/versions`. `pendingFields` calculado por tipo no service (comuns + específicos obrigatórios; `manufacturer` e `description` fora). Alternativa — rotas por tipo (`/steel-wires`, `/opgw-cables`): rejeitada, multiplicaria endpoints e telas para o mesmo contrato.

### D3 — Reuso direto dos helpers e do padrão de erros do piloto

`civil-date.ts` (validação de calendário com round-trip, fuso America/Sao_Paulo) e `effectiveness.ts` (funções puras de vigência) são reutilizados sem alteração. Padrões obrigatórios herdados das reviews do piloto: mapear `P2002` do Prisma para 409 no create (check-then-create não basta em concorrência); `ParseIntPipe` com `exceptionFactory` em pt-BR; um único decorador HTTP por método de controller; subscribes de leitura no Angular sempre com callback de erro; `nx format:check` antes de cada commit.

### D4 — UI: uma listagem com filtro e um formulário com campos condicionais

Componentes `ground-wire-list/-form/-history` em `apps/web/src/app/catalogs`, rotas lazy sob `/catalogs/ground-wires`. O formulário mostra o bloco de campos específicos conforme o tipo selecionado (seleção travada após criação); listagem com filtro por tipo além da busca. Branco→null via `orNull` (RNF-09). Datas de vigência exibidas com `date: 'dd/MM/yyyy' : 'UTC'`; `createdAt` sem timezone. Contratos compartilhados em `libs/domain/src/lib/catalogs/ground-wires.ts` (tipos de request/response e o enum de tipo), seguindo `conductor-cables.ts`.

### D5 — Nomenclatura

Novos termos no mapa canônico do README **antes** do código: cabo de guarda → `GroundWire` / `ground_wire` / `ground-wires`; tipo (aço | OPGW) → `GroundWireType`: `STEEL` | `OPGW`; classe de galvanização → `galvanizationClass`; grau de resistência → `strengthGrade`; número de fios → `wireCount`; fabricante → `manufacturer`; I²t (kA²·s) → `i2tKa2s`; número de fibras → `fiberCount`. "Ground wire" é coerente com a sigla consagrada OPGW (*OPtical Ground Wire*); alternativa "shield wire" rejeitada para não criar dois nomes para a mesma família.

## Risks / Trade-offs

- [Colunas específicas anuláveis permitem, no banco, cabo de aço com `fiber_count`] → invariante garantida na camada de aplicação (única via de escrita é a API, que rejeita campo do outro tipo); constraint CHECK no banco seria proteção extra, mas Prisma não a modela nativamente — aceito, registrado para eventual migration manual futura.
- [Interpretação de "resistência" (`DB_CGA`) como grau mecânico em texto pode estar errada] → campo texto anulável absorve qualquer formato (ex.: "EHS", "1.240 MPa"); confirmar na validação §02; migração de tipo de coluna seria aditiva.
- [Duplicação consciente com `conductor-cables` (segundo catálogo)] → aceita pela regra das três ocorrências; o terceiro catálogo paga a extração com dois precedentes reais.

## Migration Plan

Aditivo, mesmo plano do piloto: migration Prisma (enum + duas tabelas) → contratos em `libs/domain` → API → UI → QA da change. Nada existente muda; rollback = reverter a migration e remover os arquivos novos. Rotina de implementação: ciclo por task com review do agente `task-reviewer` por grupo e `/executar-qa` antes do archive.

## Open Questions

- Rótulos de exibição das unidades de I²t (kA²·s) e do grau de resistência na tela — não mudam modelo nem tasks; confirmar com os autores na validação §02, junto com a pendência de unidade do UTS herdada do piloto.
