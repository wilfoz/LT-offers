# Proposta: catalogo-mao-de-obra-equipamentos

## Why

O módulo de recursos (M03) é o alicerce para o dimensionamento de equipes, cronogramas de serviço (M07) e histogramas de pessoal e máquinas (M08). As bases de dados de mão de obra (`DB_MO`), equipamentos (`DB_EQ`) e custos fixos (`DB_FI`) da planilha fornecem os parâmetros unitários que alimentam as composições analíticas (`DesEquipos`) e as produções de obra (`Equipos`). Esta mudança entrega a persistência relacional versionada por vigência (RNF-05), manutenção completa (CRUD), validação decimal estrita (RNF-08), distinção de nulos/zeros (RNF-09) e sinalização de pendências (RF-11) para os três catálogos fundamentais de recursos.

## What Changes

- **Catálogo de Mão de Obra (bloco `DB_MO` da planilha):**
  - Catálogo plano de cargos (`LaborRole`), identidade = código único de cargo (ex.: `ENC01`, `ELET01`, `AJUD01`) com nome do cargo.
  - Atributos versionados com precisão decimal: salário base mensal (`baseSalary`), percentual de periculosidade (`hazardPayPercent`), percentual de horas extras (`overtimePercent`), percentual de DSR sobre horas extras (`dsrOvertimePercent`), encargos sociais (`socialChargesPercent`), benefício de alimentação (`foodAllowanceMonthly`), alojamento (`housingMonthly`), folgas de campo com custo de viagem (`homeLeaveTravelMonthly`), plano de saúde (`healthInsuranceMonthly`) e seguro de vida (`lifeInsuranceMonthly`).
- **Catálogo de Equipamentos (bloco `DB_EQ` da planilha):**
  - Catálogo plano de equipamentos (`Equipment`), identidade = código único (ex.: `TRAT01`, `GUIN01`, `CAM01`) com descrição e categoria do equipamento.
  - Atributos versionados com as três modalidades de precificação (RF-13, RN-17): valor de locação externa mensal (`externalRentalMonthly`), fator/valor de locação interna (`internalRentalMonthly`), valor de aquisição (`purchasePrice`), prazo de depreciação/amortização em anos (`depreciationYears`), disponibilidade própria padrão (`ownedAvailabilityCount`) e custo estimado mensal de combustível e manutenção (`fuelMaintenanceMonthly`).
- **Catálogo de Custos Fixos e Indiretos (bloco `DB_FI` da planilha):**
  - Catálogo plano de itens de despesa fixa (`FixedCost`), identidade = código único do item (ex.: `EPI01`, `EXAM01`, `MOB01`) com descrição e categoria (EPI, Exames Médicos, Uniformes, Viagens/Estadias, Mobilização/Desmobilização).
  - Atributos versionados: custo unitário (`unitCost`) e unidade de medida/frequência (`unit`).
- **Interfaces Web e Contratos Compartilhados:**
  - Telas de listagem com busca e badges de pendência, formulários com validação pt-BR e telas de histórico de versões para cada um dos três recursos.
  - Atualização do menu de navegação e extensão dos utilitários de catálogo versionado.

Fase do roadmap: **F1 (M03 — Recursos de Obra: Mão de Obra, Equipamentos e Custos Fixos)**. Requisitos cobertos: RF-12 (parcial — cadastro de cargos e encargos; cálculo regional é consumo do motor), RF-13 (parcial — catálogo de equipamentos e estratégias de precificação), RF-11 (parcial — pendências de dados obrigatórios), RF-03 (auditoria); RN-14, RN-17; RNF-05, RNF-08, RNF-09, RNF-14.

## Capabilities

### New Capabilities

- `catalogos/mao-de-obra`: catálogo corporativo de cargos de mão de obra (`LaborRole`), salários base, adicionais legais (periculosidade, horas extras, DSR), encargos e benefícios de campo.
- `catalogos/equipamentos`: catálogo corporativo de equipamentos (`Equipment`), custos de locação externa/interna, aquisição, amortização e manutenção.
- `catalogos/custos-fixos`: catálogo corporativo de custos fixos e indiretos de obra (`FixedCost` — EPIs, exames, mobilização).

### Modified Capabilities

Nenhuma — `catalogos/versionamento-vigencia` aplica-se integralmente aos três recursos sem alteração de seus requisitos existentes.

## Impact

- **Código:**
  - Modelos Prisma: `LaborRole`/`LaborRoleVersion`, `Equipment`/`EquipmentVersion`, `FixedCost`/`FixedCostVersion`; migration aditiva correspondente.
  - Contratos na `domain` (`libs/domain/src/lib/catalogs/`): `labor-roles.ts`, `equipment.ts`, `fixed-costs.ts`.
  - Backend API (`apps/api/src/catalogs/`): controllers, services, modules e DTOs para `labor-roles`, `equipment` e `fixed-costs`.
  - Frontend Web (`apps/web/src/app/catalogs/`): APIs, componentes de lista, formulário e histórico, rotas lazy e entradas no menu da casca.
- **Nomenclatura (README.md):** Adicionar termos de mão de obra, equipamentos e custos fixos ao mapa canônico antes do início do código.
- **Dependências:** Nenhuma biblioteca externa nova.
