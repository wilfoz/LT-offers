# Design - Arquitetura Hexagonal no Contexto Export

## Context

`export` materializa a oferta em artefatos contratuais: planilha do edital XLSX (layouts distintos por concessionária), folha de medição, planilha de desembolso e pacote aberto JSON, além de indicadores de desempenho. É consumidor puro — lê de economics e do banco, não escreve domínio próprio. Sua complexidade está na geração XLSX (excel-generator, ~metade das linhas do módulo), que é infraestrutura de apresentação, não regra de negócio.

## Goals / Non-Goals

**Goals:**
- Bounded context `export` com a geração XLSX atrás de `SpreadsheetGeneratorPort` — casos de uso testáveis sem tocar em ExcelJS.
- Dados de desembolso e resultado via `EconomicsFacadeService`; o restante via `ExportDataQueryPort` própria.
- Contratos preservados byte a byte, incluindo respostas binárias (Content-Disposition, nome de arquivo, estrutura de células dos layouts).

**Non-Goals:**
- Não redesenhar layouts de edital nem o formato do pacote aberto JSON.
- Não reescrever o gerador Excel — o código move para o adaptador como está (fiação, não reforma).
- Não alterar schema/migrations.

## Decisions

### 1. Geração XLSX como porta secundária (`SpreadsheetGeneratorPort`)
O gerador Excel é I/O de apresentação: recebe dados estruturados do domínio e devolve buffer. Como porta, os casos de uso `Generate*` são testáveis com um gerador dublê que asserta o payload estruturado — a corretude célula a célula continua coberta pelos testes existentes do adaptador (movidos junto com o código).

### 2. Move-don't-rewrite para o excel-generator
~900 linhas de formatação validadas por QA da F6.3 (paridade com o edital). Reescrever seria risco sem ganho; o serviço vira `ExcelGeneratorAdapter` com a mesma implementação e os mesmos testes. Único ajuste: assinatura contra o contrato da porta.

### 3. Casos de uso `Get*Data` e `Generate*` separados (não fundidos)
As rotas atuais expõem tanto os dados JSON (consumidos pela pré-visualização na web) quanto o binário. Fundir em um caso de uso com flag esconderia dois contratos distintos; a separação espelha as rotas e mantém os presenters triviais.

## Risks / Trade-offs

- **Risco**: respostas binárias têm contrato implícito (headers, nome do arquivo) que testes de controller costumam sub-assertar. **Mitigação**: testes do controller assertam Content-Type, Content-Disposition e nome do arquivo por igualdade exata.
- **Risco**: maior módulo da série (~1,9k linhas) — diff extenso. **Mitigação**: o grosso é o move do gerador; a revisão foca nos casos de uso e no religamento de dados.
- **Risco**: erros de infraestrutura invisíveis aos testes puros — `npx nx build api` obrigatório na integração.
