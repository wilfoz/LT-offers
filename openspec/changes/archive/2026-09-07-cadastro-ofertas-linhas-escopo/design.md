## Context

Ver `proposal.md` para motivação e justificativa. O sistema precisa suportar a parametrização de ofertas EPC para leilões de transmissão (módulo M01), superando as restrições da planilha original (`Info&Cond`, `Datos`, `Aux`) que fixava 10 linhas em abas estáticas. Esta arquitetura define a persistência relacional, validação de regras de negócio territoriais e tributárias preliminares, contratos de domínio e interface web no padrão Swiss / Material 3.

## Goals / Non-Goals

**Goals:**
- Persistência estruturada de `Offer`, `OfferRevision`, `TransmissionLine` e `ScopeMatrixItem` no PostgreSQL via Prisma com tipos `Decimal`.
- Suporte a $1..n$ linhas de transmissão por proposta (eliminando a limitação rígida de 10 linhas — RNF-03).
- Validação estrita da regra RN-01: alocação territorial em até 2 UFs somando exatamente 100,00%.
- Matriz de responsabilidade com 4 eixos (responsável, faturamento direto/REIDI, risco cambial, risco de commodity — RN-03, RN-04, RN-08) com pré-carga de itens canônicos do setor.
- Imutabilidade garantida de revisões fechadas/entregues (`FROZEN`, `DELIVERED`) e transação atômica para criação de novas revisões derivadas (R0 -> R1...) e clonagem de propostas (RF-06).
- Interface web com tabela densa, indicadores visuais de pendência (RNF-09) e abas de navegação interna da oferta.

**Non-Goals:**
- Importação de arquivos de estaqueamento PLS-CADD por torre (escopo do Módulo M04 na próxima change).
- Cálculo paramétrico de quantitativos de engenharia e materiais (escopo do Módulo M05 na `calc-engine`).
- Emissão final de planilhas de faturamento/BOQ do edital (escopo do Módulo M09).

## Decisions

### 1. Modelo Relacional e Hierarquia de Versionamento

```
┌────────────────────────────────────────────────────────┐
│                        Offer                           │
│  - id: Int (PK)                                        │
│  - code: String (Unique, ex: "OF-2026-L1")             │
│  - name: String                                        │
│  - clientName: String                                  │
│  - baseCurrency: String ("BRL", "USD")                 │
│  - clonedFromOfferId: Int? (FK -> Offer)               │
└───────────────────────────┬────────────────────────────┘
                            │ 1
                            │
                            │ n
┌───────────────────────────▼────────────────────────────┐
│                    OfferRevision                       │
│  - id: Int (PK)                                        │
│  - offerId: Int (FK)                                   │
│  - revisionNumber: Int (0, 1, 2...)                    │
│  - status: OfferRevisionStatus (DRAFT, FROZEN, ...)    │
│  - auctionName: String (ex: "Leilão 01/2026")          │
│  - lotName: String (ex: "Lote 1")                      │
│  - offerDate: DateTime                                 │
│  - auctionDate: DateTime?                              │
│  - scheduleStartDate: DateTime?                        │
│  - commercialOperationDate: DateTime?                  │
│  - estimatedCapex: Decimal? (RNF-08)                   │
│  - maxRap: Decimal?                                    │
│  - winningRap: Decimal?                                │
│  - notes: String?                                      │
└─────────────┬────────────────────────────┬─────────────┘
              │ 1                          │ 1
              │                            │
              │ n                          │ n
┌─────────────▼───────────────┐ ┌──────────▼─────────────┐
│      TransmissionLine       │ │    ScopeMatrixItem     │
│ - id: Int (PK)              │ │ - id: Int (PK)         │
│ - offerRevisionId: Int (FK) │ │ - offerRevisionId (FK) │
│ - code: String              │ │ - itemCode: String     │
│ - name: String              │ │ - itemName: String     │
│ - nominalVoltageKv: Decimal │ │ - category: String     │
│ - refinedLengthKm: Decimal  │ │ - responsibleParty     │
│ - reportLengthKm: Decimal   │ │ - acceptsDirectBilling │
│ - circuitCount: Int         │ │ - currencyRiskParty    │
│ - bundleConductorCount: Int │ │ - commodityRiskParty   │
│ - destinationStatePrimary   │ │ - notes: String?       │
│ - destinationPercentPrimary │ └────────────────────────┘
│ - destinationStateSecondary │
│ - destinationPercentSecond. │
└─────────────────────────────┘
```

*Rationale*: A oferta mantém metadados globais e identidade, enquanto cada revisão (`OfferRevision`) isola os parâmetros temporais/financeiros, o conjunto de linhas e a matriz de escopo. Isso garante reprodução histórica perfeita mesmo após alterações contratuais.

*Alternativa rejeitada*: Manter linhas diretamente na `Offer`. Rejeitado porque revisões avançadas (R1, R2) podem ter extensões de linha ou tensões alteradas em relação ao estudo preliminar R0.

### 2. Validação Territorial de Linhas (RN-01)
Cada `TransmissionLine` aceita uma UF primária obrigatória (1 a 100%) e uma UF secundária opcional. A soma `destinationPercentagePrimary + (destinationPercentageSecondary ?? 0)` deve ser exatamente `100.00`. A validação ocorre tanto no DTO backend quanto no formulário reativo web com mensagens em português.

### 3. Carga Automática de Itens Padrão de Escopo (RF-04, RN-03)
Ao criar uma nova oferta / revisão inicial R0, o serviço insere automaticamente o rol canônico de itens de escopo da indústria EPC (fornecimentos e serviços de cabos, torres, isoladores, civil, montagem, lançamento, comissionamento, ambiental, fundiário e engenharia) configurados com valores padrão seguros (`CONTRACTOR`), agilizando o preenchimento pelo orçamentista.

### 4. Nomenclatura Canônica

| Termo em Português | Código / Modelo em Inglês |
|---|---|
| Oferta / Proposta | `Offer` |
| Revisão da Oferta | `OfferRevision` |
| Status da Revisão | `OfferRevisionStatus` (`DRAFT`, `FROZEN`, `DELIVERED`) |
| Linha de Transmissão | `TransmissionLine` |
| Matriz de Responsabilidade | `ScopeMatrixItem` |
| Responsável pelo Escopo | `ScopeResponsibleParty` (`CONTRACTOR`, `CLIENT`) |

## Risks / Trade-offs

- **[Risco: Clonagem profunda de ofertas com grande volume de dados]**  
  *Mitigação*: Executar a duplicação dentro de uma transação Prisma (`prisma.$transaction`) com operações em lote (`createMany` para linhas e itens de escopo), garantindo atomicidade e performance.
- **[Risco: Inconsistência de datas entre cronograma e edital]**  
  *Mitigação*: Validação informativa não bloqueante durante o rascunho (`DRAFT`), com sinalização visual clara e impedimento de fechamento (`FROZEN`) caso existam pendências críticas sem justificativa.
