## Context

Ver `proposal.md` para motivação e justificativa. O sistema precisa gerenciar o estaqueamento de estruturas de linhas de transmissão (Módulo M04), permitindo a ingestão automatizada de arquivos exportados do PLS-CADD e a parametrização geotécnica e estrutural que alimentará o motor de quantitativos de engenharia (M05).

## Goals / Non-Goals

**Goals:**
- Persistência estruturada de `StakingTower` no PostgreSQL via Prisma vinculada à `TransmissionLine`, indexada por estaca e identificador de torre.
- Parser robusto para arquivos CSV e XLSX de PLS-CADD com validação prévia e tela de conferência/preview.
- Mecanismo de reimportação incremental preservando associações manuais existentes de solo, fundação e notas (RF-22).
- Operações de atribuição em lote por faixa de estacas, trecho ou série de torre (RF-19).
- Suporte a modelo paramétrico percentual preliminar (`PreliminaryStakingDistribution`) quando o traçado executivo ainda não existe (RF-21).
- Validação automática de integridade da combinação solo × fundação contra o catálogo `FoundationVolumeMatrix` (RF-20, RN-13).
- Interface web fluida e paginada capaz de renderizar e filtrar até 5.000 estruturas por linha (RNF-02).

**Non-Goals:**
- Cálculo de quantitativos consolidados e cubagem de concreto/aço (escopo do Módulo M05 na `calc-engine`).
- Cálculo de tração de cabos e carregamento de vento por vão (função do PLS-CADD externo).
- Georreferenciamento GIS com renderização em mapa cartográfico interativo (previsto para fase futura).

## Decisions

### 1. Modelo de Dados e Relacionamentos

```
┌────────────────────────────────────────────────────────┐
│                   TransmissionLine                     │
│  - id: Int (PK)                                        │
│  - offerRevisionId: Int (FK)                           │
│  - code: String, name: String                          │
│  - refinedLengthKm: Decimal, etc.                      │
└───────────┬────────────────────────────────┬───────────┘
            │ 1                              │ 1
            │                                │
            │ 0..n                           │ 0..1
┌───────────▼────────────────────┐ ┌─────────▼───────────────────────────┐
│          StakingTower          │ │    PreliminaryStakingDistribution   │
│ - id: Int (PK)                 │ │ - id: Int (PK)                      │
│ - transmissionLineId: Int (FK) │ │ - transmissionLineId: Int (FK, UQ)  │
│ - towerNumber: String          │ │ - soilPercentages: Json (RNF-08)    │
│ - stationMeters: Decimal       │ │ - foundationPercentages: Json       │
│ - bodyExtensionMeters: Decimal │ └─────────────────────────────────────┘
│ - deflectionAngleDeg: Decimal  │
│ - lateralOffsetMeters: Decimal │
│ - utmEast: Decimal?            │
│ - utmNorth: Decimal?           │
│ - elevationMeters: Decimal?    │
│ - towerTypeId: Int? (FK)       │
│ - soilTypeId: Int? (FK)        │
│ - foundationTypeId: Int? (FK)  │
│ - accessDifficulty: Enum       │
│ - notes: String?               │
└────────────────────────────────┘
```

*Rationale*: A entidade `StakingTower` é filha direta da `TransmissionLine`, garantindo que cada revisão de oferta com suas linhas isole seu estaqueamento correspondente. Quando uma nova revisão de oferta é gerada (ex.: R0 -> R1), o estaqueamento da linha é clonado de forma atômica e profunda.

### 2. Algoritmo de Reimportação Incremental (RF-22)
Ao reimportar uma planilha PLS-CADD para uma linha que já possui torres cadastradas:
1. O backend busca todas as torres existentes da linha indexadas por `towerNumber`.
2. Para cada linha do arquivo PLS-CADD:
   - Se a torre já existe: atualiza coordenadas, estaca, ângulo, offset e extensão de pé; preserva `towerTypeId`, `soilTypeId`, `foundationTypeId`, `accessDifficulty` e `notes` se não vierem especificados no arquivo.
   - Se for uma torre nova: insere com os dados geométricos e campos de catálogo nulos (para classificação posterior).
3. Torres que não constam mais no novo arquivo são marcadas para remoção.
4. A transação executa em lote (`transaction` com `createMany` e `update`) com chunks de até 500 registros.

### 3. Parser e Heurística de Cabeçalhos PLS-CADD
O parser reconhece variações de nomenclaturas comuns do mercado em português e inglês:
- Número da Torre: `Structure`, `Tower`, `Torre`, `Numero`, `Num`, `Id`
- Estaca: `Station`, `Estaca`, `Km`, `Chainage`
- Extensão de Pé / Altura: `Body Extension`, `Extensao Pe`, `Ajuste Altura`, `Height`
- Ângulo de Deflexão: `Line Deflection`, `Deflection`, `Angulo`, `Angulo Deflexao`
- Coordenadas: `Easting`, `Northing`, `Elevation`, `UTM_X`, `UTM_Y`, `Cota`, `Z`

### 4. Nomenclatura Canônica

| Termo em Português | Código / Modelo em Inglês |
|---|---|
| Torre / Estrutura Estaquada | `StakingTower` |
| Estaca (m) | `stationMeters` |
| Extensão de Pé / Ajuste de Altura | `bodyExtensionMeters` |
| Ângulo de Deflexão | `deflectionAngleDeg` |
| Offset Lateral | `lateralOffsetMeters` |
| Coordenada UTM Leste / Norte / Cota | `utmEast` / `utmNorth` / `elevationMeters` |
| Grau de Dificuldade de Acesso | `AccessDifficulty` (`NORMAL`, `DIFFICULT`, `CROSSING`) |
| Distribuição Paramétrica Preliminar | `PreliminaryStakingDistribution` |

## Risks / Trade-offs

- **[Risco: Alto volume de linhas com 3.000 a 5.000 torres degradar a resposta da API ou da interface web]**  
  *Mitigação*: Implementação de endpoints paginados (`page`, `pageSize`, `search`, `soilTypeId`, `towerTypeId`, `stationRange`) e indexação no PostgreSQL em `(transmission_line_id, station_meters)`.
- **[Risco: Reimportação sobrescrever acidentalmente classificações manuais de solo]**  
  *Mitigação*: Tela de confirmação e preview na interface web exibindo o diff (torres mantidas, adicionadas, removidas e atribuições preservadas) antes do commit.
