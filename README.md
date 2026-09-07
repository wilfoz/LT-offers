# LT Offers — Orçamentação de Linhas de Transmissão

Aplicação web que substitui a planilha **Calculo LT** de orçamentação de
propostas EPC de linhas de transmissão. O levantamento completo de requisitos
— regras de negócio, requisitos funcionais e não funcionais, arquitetura-alvo
e roadmap — está em [`requisitos-calculo-lt.md`](./requisitos-calculo-lt.md).
O planejamento por mudança fica em [`openspec/`](./openspec/).

## Stack

| Camada           | Tecnologia                                        |
| ---------------- | ------------------------------------------------- |
| Frontend         | Angular (`apps/web`) — interface em pt-BR         |
| Backend          | NestJS (`apps/api`)                               |
| Banco de dados   | PostgreSQL 16 + Prisma 7                          |
| Motor de cálculo | TypeScript puro (`libs/motor-calculo`)            |
| Monorepo         | Nx (formato integrado: tsconfig paths + projetos) |

## Estrutura do workspace

```
apps/
  web/           Angular — apresentação
  api/           NestJS — API REST (GET /api/health)
libs/
  calc-engine/   Motor determinístico: DecimalValue (decimal.js),
                 grafo de dependências de cálculo. Sem framework, sem I/O.
  domain/        Tipos e contratos compartilhados
prisma/          schema.prisma + migrations
```

As fronteiras entre projetos são **impostas por lint** (`@nx/enforce-module-boundaries`):
o motor só enxerga o domínio e não pode importar NestJS, Angular, Prisma nem
APIs de I/O ou de relógio (`Date.now`, `Math.random` são erro de lint no motor).

## Pré-requisitos

- **Node 22** (ver `.nvmrc`)
- **Docker** (para o Postgres local) — alternativa: um PostgreSQL 16 instalado
  localmente; ajuste `DATABASE_URL` no `.env`

## Subir o ambiente local

```bash
# 1. Dependências
npm ci

# 2. Variáveis de ambiente
cp .env.example .env        # PowerShell: Copy-Item .env.example .env

# 3. Banco de dados
docker compose up -d
npx prisma migrate dev
npx prisma generate

# 4. Aplicações
npx nx serve api            # http://localhost:3000/api/health
npx nx serve web            # http://localhost:4200
```

## Verificação

Comando canônico — o mesmo que o CI executa:

```bash
npx nx run-many -t lint test build
```

Testes de um projeto específico: `npx nx test calc-engine` (ou `api`,
`web`, `domain`). O CI (GitHub Actions) roda lint, testes e build dos
projetos afetados em todo push/PR, mais um job que valida as migrations
contra um Postgres real.

## Convenções

### Idiomas

- **Inglês**: todo o código — identificadores, classes, métodos, pastas,
  arquivos, rotas de API, URLs, tabelas/colunas do banco e campos JSON.
- **Português do Brasil**: comentários, mensagens de erro, todo texto exibido
  ao usuário (RNF-14), descrições de testes (`describe`/`it`), cenários de
  specs, artefatos OpenSpec e mensagens de commit.

### Mapa de nomenclatura (pt-BR → inglês)

Referência canônica para os termos de domínio; termos novos entram aqui antes
de serem usados. Siglas consagradas do setor (UTS, OPGW, LT) não se traduzem.

| pt-BR (domínio)                                     | Inglês (código/banco/API)                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| cabo condutor                                       | `ConductorCable` / `conductor_cable` / `conductor-cables`                                               |
| cabo de guarda                                      | `GroundWire` / `ground_wire` / `ground-wires`                                                           |
| tipo (aço \| OPGW)                                  | `GroundWireType`: `STEEL` \| `OPGW`                                                                     |
| classe de galvanização                              | `galvanizationClass` / `galvanization_class`                                                            |
| grau de resistência                                 | `strengthGrade` / `strength_grade`                                                                      |
| número de fios                                      | `wireCount` / `wire_count`                                                                              |
| fabricante                                          | `manufacturer`                                                                                          |
| I²t (kA²·s)                                         | `i2tKa2s` / `i2t_ka2s`                                                                                  |
| número de fibras                                    | `fiberCount` / `fiber_count`                                                                            |
| tirante (cabo de aço)                               | `GuyWire` / `guy_wire` / `guy-wires`                                                                    |
| versão (de catálogo)                                | `Version` / `_version`                                                                                  |
| vigência (início de)                                | `effectiveFrom` / `effective_from`                                                                      |
| vigente em (consulta)                               | `effectiveOn` (query param)                                                                             |
| peso (ton/km)                                       | `weightTonPerKm` / `weight_ton_per_km`                                                                  |
| bobina (m)                                          | `reelLengthM` / `reel_length_m`                                                                         |
| diâmetro (mm)                                       | `diameterMm` / `diameter_mm`                                                                            |
| UTS (kN)                                            | `utsKn` / `uts_kn`                                                                                      |
| criado por / em                                     | `createdBy` / `createdAt`                                                                               |
| campos pendentes                                    | `pendingFields`                                                                                         |
| busca                                               | `search`                                                                                                |
| catálogo                                            | `catalogs`                                                                                              |
| motor de cálculo                                    | `calc-engine` / `DecimalValue`, `DependencyGraph`                                                       |
| domínio                                             | `domain`                                                                                                |
| arredondamento                                      | `RoundingPolicy`: `'half-up'` \| `'half-even'`                                                          |
| série de estrutura                                  | `StructureSeries` / `structure_series` / `structure-series`                                             |
| tipo de torre                                       | `TowerType` / `tower_type` / `tower-types`                                                              |
| função (suspensão \| ancoragem)                     | `TowerFunction`: `SUSPENSION` \| `ANCHOR`                                                               |
| projetista                                          | `designer`                                                                                              |
| tensão (kV)                                         | `voltageKv` / `voltage_kv`                                                                              |
| circuitos                                           | `circuitCount` / `circuit_count`                                                                        |
| cabos por fase                                      | `cablesPerPhase` / `cables_per_phase`                                                                   |
| vento de projeto (m/s)                              | `designWindSpeedMs` / `design_wind_speed_ms`                                                            |
| tipo de isolador                                    | `insulatorType` / `insulator_type`                                                                      |
| SIL (MW)                                            | `silMw` / `sil_mw`                                                                                      |
| quantidade de estais                                | `guyCount` / `guy_count`                                                                                |
| altura (m)                                          | `heightM` / `height_m`                                                                                  |
| peso (kg)                                           | `weightKg` / `weight_kg`                                                                                |
| isolador                                            | `Insulator` / `insulator` / `insulators`                                                                |
| perfil (de isolador)                                | `profile`                                                                                               |
| carga de ruptura (kN)                               | `ruptureStrengthKn` / `rupture_strength_kn`                                                             |
| passo (mm)                                          | `spacingMm` / `spacing_mm`                                                                              |
| linha de fuga (mm)                                  | `creepageDistanceMm` / `creepage_distance_mm`                                                           |
| tipo de solo                                        | `SoilType` / `soil_type` / `soil-types`                                                                 |
| submerso                                            | `submerged`                                                                                             |
| tensão admissível à compressão (kgf/cm²)            | `allowableCompressionStressKgfCm2` / `allowable_compression_stress_kgf_cm2`                             |
| peso específico (kgf/m³)                            | `specificWeightKgfM3` / `specific_weight_kgf_m3`                                                        |
| ângulo de atrito interno (°)                        | `internalFrictionAngleDeg` / `internal_friction_angle_deg`                                              |
| coesão (kg/cm²)                                     | `cohesionKgCm2` / `cohesion_kg_cm2`                                                                     |
| faixa de NSPT (mínimo inclusivo / máximo exclusivo) | `nsptMin` / `nsptMax` / `nspt_min` / `nspt_max`                                                         |
| tipo de fundação                                    | `FoundationType` / `foundation_type` / `foundation-types`                                               |
| aplicação (autoportante \| estaiada \| cross-rope)  | `FoundationApplication`: `SELF_SUPPORTING` \| `GUYED` \| `CROSS_ROPE`                                   |
| matriz de volumes (torre × solo × fundação)         | `FoundationVolume` / `foundation_volume` / `foundation-volumes`                                         |
| fuste sapata                                        | `spreadFooting`                                                                                         |
| preformado (pré-moldado)                            | `precast` (`precastMast` \| `precastGuy`)                                                               |
| pila (reta \| campana \| com laje)                  | `pier` (`straightPier` \| `belledPier` \| `slabPier`)                                                   |
| tirante (elemento de fundação estaiada)             | `guy` (sufixo, ex. `straightPierGuy`)                                                                   |
| ancoragem em rocha                                  | `rockAnchor`                                                                                            |
| estaca (concreto \| metálica \| raiz)               | `pile` (`concretePile` \| `steelPile` \| `rootPile`)                                                    |
| helicoidal (mastro \| tirante)                      | `helicalMast` \| `helicalGuy`                                                                           |
| tricone                                             | `tricone`                                                                                               |
| micropilote                                         | `micropile`                                                                                             |
| hélice contínua                                     | `continuousAugerPile`                                                                                   |
| encepado (bloco de coroamento)                      | `pileCap`                                                                                               |
| contagem de elemento                                | sufixo `Count` / `_count` (ex. `spreadFootingCount`)                                                    |
| escavação (duro \| normal \| com água) (m³)         | `excavation{Hard\|Normal\|Water}…M3`                                                                    |
| perfuração de pernos (m)                            | `anchorBoltDrillingM` / `anchor_bolt_drilling_m`                                                        |
| aço por elemento (kg)                               | `steel…Kg` (ex. `steelPiersKg`, `steelAnchorBoltsKg`)                                                   |
| concreto por elemento (m³)                          | `concrete…M3` (ex. `concretePiersM3`)                                                                   |
| regeneração (m³)                                    | `regenerationM3` / `regeneration_m3`                                                                    |
| grout (m³)                                          | `groutM3` / `grout_m3` (termo do setor, não se traduz)                                                  |
| reaterro (solo \| solo-cimento) (m³)                | `backfillSoilM3` \| `backfillSoilCementM3`                                                              |
| formas (m²)                                         | `formworkM2` / `formwork_m2`                                                                            |
| metragem de estaca (m)                              | sufixo `M` (ex. `helicalPileM`, `triconeM`, `micropileM`)                                               |
| cargo / mão de obra                                 | `LaborRole` / `labor_role` / `labor-roles`                                                              |
| salário base (R$)                                   | `baseSalary` / `base_salary`                                                                            |
| periculosidade (%)                                  | `hazardPayPercent` / `hazard_pay_percent`                                                               |
| hora extra (%)                                      | `overtimePercent` / `overtime_percent`                                                                  |
| DSR sobre hora extra (%)                            | `dsrOvertimePercent` / `dsr_overtime_percent`                                                           |
| encargos sociais (%)                                | `socialChargesPercent` / `social_charges_percent`                                                       |
| alimentação (R$/mês)                                | `foodAllowanceMonthly` / `food_allowance_monthly`                                                       |
| alojamento (R$/mês)                                 | `housingMonthly` / `housing_monthly`                                                                    |
| folgas de campo com viagem (R$/mês)                 | `homeLeaveTravelMonthly` / `home_leave_travel_monthly`                                                  |
| plano de saúde (R$/mês)                             | `healthInsuranceMonthly` / `health_insurance_monthly`                                                   |
| seguro de vida (R$/mês)                             | `lifeInsuranceMonthly` / `life_insurance_monthly`                                                       |
| equipamento                                         | `Equipment` / `equipment`                                                                               |
| aluguel externo (R$/mês)                            | `externalRentalMonthly` / `external_rental_monthly`                                                     |
| aluguel interno (R$/mês)                            | `internalRentalMonthly` / `internal_rental_monthly`                                                     |
| preço de compra (R$)                                | `purchasePrice` / `purchase_price`                                                                      |
| anos de amortização                                 | `depreciationYears` / `depreciation_years`                                                              |
| disponibilidade própria (qtd)                       | `ownedAvailabilityCount` / `owned_availability_count`                                                   |
| combustível e manutenção (R$/mês)                   | `fuelMaintenanceMonthly` / `fuel_maintenance_monthly`                                                   |
| custo fixo / indireto de obra                       | `FixedCost` / `fixed_cost` / `fixed-costs`                                                              |
| categoria de custo fixo                             | `FixedCostCategory`: `EPI` \| `MEDICAL_EXAM` \| `UNIFORM` \| `MOB_DEMOB` \| `TRAVEL_HOUSING` \| `OTHER` |
| custo unitário (R$)                                 | `unitCost` / `unit_cost`                                                                                |
| equipe de trabalho                                  | `WorkCrew` / `work_crew` / `work-crews`                                                                 |
| composição de mão de obra                           | `WorkCrewLaborRole` / `work_crew_labor_role`                                                            |
| composição de equipamento                           | `WorkCrewEquipment` / `work_crew_equipment`                                                             |
| taxa de produção teórica padrão                     | `standardProductionRate` / `standard_production_rate`                                                   |
| unidade de produção                                 | `productionUnit` / `production_unit`                                                                    |
| período de produção                                 | `ProductionPeriod`: `HOUR` \| `DAY` \| `WEEK` \| `MONTH`                                                |
| quantidade na composição                            | `quantity`                                                                                              |
| proposta / oferta de leilão                         | `Offer` / `offer` / `offers`                                                                            |
| revisão de oferta                                   | `OfferRevision` / `offer_revision` / `offer-revisions`                                                  |
| status da revisão de oferta                         | `OfferRevisionStatus`: `DRAFT` \| `FROZEN` \| `DELIVERED`                                               |
| linha de transmissão                                | `TransmissionLine` / `transmission_line` / `transmission-lines`                                         |
| item da matriz de responsabilidade                  | `ScopeMatrixItem` / `scope_matrix_item` / `scope-matrix-items`                                          |
| responsável pelo escopo                             | `ScopeResponsibleParty`: `CONTRACTOR` \| `CLIENT`                                                       |
| faturamento direto aceito (REIDI)                   | `acceptsDirectBilling` / `accepts_direct_billing`                                                       |
| parte com risco cambial                             | `currencyRiskParty` / `currency_risk_party`                                                             |
| parte com risco de commodity                        | `commodityRiskParty` / `commodity_risk_party`                                                           |
| leilão                                              | `auctionName` / `auction_name`                                                                          |
| lote                                                | `lotName` / `lot_name`                                                                                  |
| cliente / concessionária                            | `clientName` / `client_name`                                                                            |
| entrada em operação comercial (edital)              | `commercialOperationDate` / `commercial_operation_date`                                                 |
| início do cronograma                                | `scheduleStartDate` / `schedule_start_date`                                                             |
| CAPEX estimado ANEEL (R$)                           | `estimatedCapex` / `estimated_capex`                                                                    |
| RAP máxima (R$)                                     | `maxRap` / `max_rap`                                                                                    |
| RAP vencedora estimada (R$)                         | `winningRap` / `winning_rap`                                                                            |
| extensão refinada (km)                              | `refinedLengthKm` / `refined_length_km`                                                                 |
| extensão de relatório (km)                          | `reportLengthKm` / `report_length_km`                                                                   |
| condutores por fase (feixe)                         | `bundleConductorCount` / `bundle_conductor_count`                                                       |
| UF de destino primária                              | `destinationStatePrimary` / `destination_state_primary`                                                 |
| percentual de rateio na UF primária (%)             | `destinationPercentagePrimary` / `destination_percentage_primary`                                       |
| UF de destino secundária                            | `destinationStateSecondary` / `destination_state_secondary`                                             |
| percentual de rateio na UF secundária (%)           | `destinationPercentageSecondary` / `destination_percentage_secondary`                                   |
| torre estaqueada / estrutura de estaqueamento       | `StakingTower` / `staking_tower` / `staking-towers`                                                     |
| estaca (m)                                          | `stationMeters` / `station_meters`                                                                       |
| extensão de pé / ajuste de altura (m)               | `bodyExtensionMeters` / `body_extension_meters`                                                           |
| ângulo de deflexão (°)                              | `deflectionAngleDeg` / `deflection_angle_deg`                                                             |
| offset lateral (m)                                  | `lateralOffsetMeters` / `lateral_offset_meters`                                                           |
| coordenada UTM leste (Easting)                      | `utmEast` / `utm_east`                                                                                   |
| coordenada UTM norte (Northing)                     | `utmNorth` / `utm_north`                                                                                 |
| cota de terreno (m)                                 | `elevationMeters` / `elevation_meters`                                                                   |
| grau de dificuldade de acesso                       | `AccessDifficulty`: `NORMAL` \| `DIFFICULT` \| `CROSSING`                                                |
| distribuição paramétrica preliminar                 | `PreliminaryStakingDistribution` / `preliminary_staking_distribution`                                     |

### Demais convenções

- Valores monetários **nunca** usam `number`/float: sempre `DecimalValue`
  do motor, com política de arredondamento explícita (RNF-08).
- Toda regra de negócio implementada referencia seu ID (`RN-xx`) do documento
  de requisitos e tem testes próprios (§14).
- O motor de cálculo é determinístico (RNF-04): datas e qualquer entrada
  variável chegam sempre como parâmetro.
- Ausência de valor é estado de primeira classe: `null` = não informado,
  distinto de zero (RNF-09).
