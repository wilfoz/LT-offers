# Design Técnico: catalogo-mao-de-obra-equipamentos

## Context

Este design define a estrutura técnica dos três catálogos de recursos do módulo M03 (`DB_MO`, `DB_EQ`, `DB_FI`). A arquitetura aproveita os padrões consolidados nos catálogos de engenharia (M02):
- Modelagem no Prisma via pares `Item` e `ItemVersion` com `effectiveFrom` e chave de unicidade de versão `@@unique([itemId, effectiveFrom])`.
- Contratos tipados na `@lt-offers/domain` com decimais trafegados como strings formatadas e datas civis ISO.
- Backend NestJS reutilizando os helpers `catalogs/*` (`prisma-errors.ts`, `controller-shared.ts`, `effectiveness.ts`, `missingFields`).
- Frontend Angular utilizando `VersionedCatalogApi`, componentes baseados em Angular Material 3 / Swiss style (`.dense`, cantos retos) e formulários reativos com validação em português.

## Goals / Non-Goals

**Goals:**
- Implementar os três recursos planos de recursos (`LaborRole`, `Equipment`, `FixedCost`) com suporte integral a versionamento por vigência, CRUD, busca e histórico.
- Assegurar aritmética decimal de precisão fixa para todos os valores monetários e percentuais (RNF-08).
- Sinalizar pendências cadastrais sem converter valores nulos em zero (RNF-09, RF-11).
- Integrar as rotas lazy no frontend e expandir o menu de navegação da casca.

**Non-Goals:**
- Composição analítica de equipes e cálculo de custo diário/hora-máquina (escopo da change seguinte `catalogo-equipes-composicoes` — `Equipos`/`DesEquipos`).
- Tabelas de parâmetros regionais de convenção coletiva por UF (teto de cesta básica e alojamento — pertencem a `Datos` / módulo de parâmetros de oferta).
- Importação automática de planilhas de salários (será coberta por rotinas de carga de dados).

## Decisions

### D1: Modelagem Relacional e Precisões Decimais no Prisma

```prisma
// Mão de Obra
model LaborRole {
  id          String             @id @default(uuid())
  code        String             @unique
  name        String
  createdAt   DateTime           @default(now()) @map("created_at")
  createdBy   String             @map("created_by")
  versions    LaborRoleVersion[]

  @@map("labor_roles")
}

model LaborRoleVersion {
  id                       String    @id @default(uuid())
  itemId                   String    @map("item_id")
  effectiveFrom            DateTime  @map("effective_from")
  baseSalary               Decimal?  @map("base_salary") @db.Decimal(12, 2)
  hazardPayPercent         Decimal?  @map("hazard_pay_percent") @db.Decimal(6, 4)
  overtimePercent          Decimal?  @map("overtime_percent") @db.Decimal(6, 4)
  dsrOvertimePercent       Decimal?  @map("dsr_overtime_percent") @db.Decimal(6, 4)
  socialChargesPercent     Decimal?  @map("social_charges_percent") @db.Decimal(6, 4)
  foodAllowanceMonthly     Decimal?  @map("food_allowance_monthly") @db.Decimal(12, 2)
  housingMonthly           Decimal?  @map("housing_monthly") @db.Decimal(12, 2)
  homeLeaveTravelMonthly   Decimal?  @map("home_leave_travel_monthly") @db.Decimal(12, 2)
  healthInsuranceMonthly   Decimal?  @map("health_insurance_monthly") @db.Decimal(12, 2)
  lifeInsuranceMonthly     Decimal?  @map("life_insurance_monthly") @db.Decimal(12, 2)
  createdAt                DateTime  @default(now()) @map("created_at")
  createdBy                String    @map("created_by")
  item                     LaborRole @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@unique([itemId, effectiveFrom])
  @@index([itemId, effectiveFrom(sort: Desc)])
  @@map("labor_role_versions")
}

// Equipamentos
model Equipment {
  id          String             @id @default(uuid())
  code        String             @unique
  description String
  category    String?
  createdAt   DateTime           @default(now()) @map("created_at")
  createdBy   String             @map("created_by")
  versions    EquipmentVersion[]

  @@map("equipment")
}

model EquipmentVersion {
  id                     String    @id @default(uuid())
  itemId                 String    @map("item_id")
  effectiveFrom          DateTime  @map("effective_from")
  externalRentalMonthly  Decimal?  @map("external_rental_monthly") @db.Decimal(12, 2)
  internalRentalMonthly  Decimal?  @map("internal_rental_monthly") @db.Decimal(12, 2)
  purchasePrice          Decimal?  @map("purchase_price") @db.Decimal(12, 2)
  depreciationYears      Int?      @map("depreciation_years")
  ownedAvailabilityCount Int?      @map("owned_availability_count")
  fuelMaintenanceMonthly Decimal?  @map("fuel_maintenance_monthly") @db.Decimal(12, 2)
  createdAt              DateTime  @default(now()) @map("created_at")
  createdBy              String    @map("created_by")
  item                   Equipment @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@unique([itemId, effectiveFrom])
  @@index([itemId, effectiveFrom(sort: Desc)])
  @@map("equipment_versions")
}

// Custos Fixos
model FixedCost {
  id          String             @id @default(uuid())
  code        String             @unique
  description String
  category    FixedCostCategory
  createdAt   DateTime           @default(now()) @map("created_at")
  createdBy   String             @map("created_by")
  versions    FixedCostVersion[]

  @@map("fixed_costs")
}

enum FixedCostCategory {
  EPI
  MEDICAL_EXAM
  UNIFORM
  MOB_DEMOB
  TRAVEL_HOUSING
  OTHER

  @@map("fixed_cost_category")
}

model FixedCostVersion {
  id            String    @id @default(uuid())
  itemId        String    @map("item_id")
  effectiveFrom DateTime  @map("effective_from")
  unitCost      Decimal?  @map("unit_cost") @db.Decimal(12, 2)
  unit          String?   @db.VarChar(50)
  createdAt     DateTime  @default(now()) @map("created_at")
  createdBy     String    @map("created_by")
  item          FixedCost @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@unique([itemId, effectiveFrom])
  @@index([itemId, effectiveFrom(sort: Desc)])
  @@map("fixed_cost_versions")
}
```

*Alternativas consideradas:*
- Guardar percentuais como fração (0.3000) vs valor percentual (30.00). Decisão: guardar como percentual nominal no banco (`db.Decimal(6,4)` — ex.: 30.0000 para 30%) para facilitar a conferência visual e equiparação com a planilha.

### D2: Regras de Pendência e Validação

1. **Mão de Obra (`LaborRole`):**
   - Pendência quando `baseSalary` ou `socialChargesPercent` não estiverem informados. Benefícios de campo (alojamento, folgas) são facultativos (dependem se a contratação é local ou alojada).
2. **Equipamentos (`Equipment`):**
   - Pendência quando não houver ao menos uma modalidade de custo informada: (`externalRentalMonthly` informado) OU (`internalRentalMonthly` informado) OU (`purchasePrice` informado junto a `depreciationYears`).
3. **Custos Fixos (`FixedCost`):**
   - Pendência quando `unitCost` ou `unit` não estiverem informados.

### D3: Integração Web e Reuso do Padrão

- Os serviços de API no frontend estendem `VersionedCatalogApi<TSummary, TDetail, TCreate, TUpdate>`:
  - `LaborRolesApi`
  - `EquipmentApi`
  - `FixedCostsApi`
- Os componentes de formulário utilizam helpers de form (`orNull`, `intOrNull`) e tratamento bloqueante de carregamento com `disable({ emitEvent: false })`.

## Risks / Trade-offs

- **[Risco]** Volume de cargos na planilha (~280 cargos) pode tornar o cadastro manual longo.
  - **Mitigação:** A estrutura uniforme por código e vigência está pronta para receber seeds e importadores em lote sem alterar o esquema nem os endpoints.
- **[Risco]** Variação de categorias de equipamentos.
  - **Mitigação:** Categoria de equipamento como texto livre com lista sugerida no autocomplete, evitando enrijecimento desnecessário.
