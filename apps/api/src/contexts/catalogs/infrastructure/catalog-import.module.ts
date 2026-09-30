import { Module } from '@nestjs/common';
import {
  CatalogImportUseCases,
  ConductorCablesUseCases,
  EquipmentUseCases,
  FixedCostsUseCases,
  GroundWiresUseCases,
  GuyWiresUseCases,
  InsulatorsUseCases,
  LaborRolesUseCases,
  SoilTypesUseCases,
} from '../application';
import { CATALOG_IMPORT_TARGETS, SPREADSHEET_READER } from '../domain';
import { CatalogsModule } from './catalogs.module';
import { CatalogImportController } from './http/controllers';
import { buildCatalogImportTargets } from './import/catalog-import-targets';
import { XlsxSpreadsheetReader } from './import/xlsx-spreadsheet.reader';

/**
 * Importação Analítica dos catálogos planos: consome os casos de uso de
 * criação exportados pelo CatalogsModule (design D3) — nenhuma escrita nova.
 */
@Module({
  imports: [CatalogsModule],
  controllers: [CatalogImportController],
  providers: [
    { provide: SPREADSHEET_READER, useClass: XlsxSpreadsheetReader },
    {
      provide: CATALOG_IMPORT_TARGETS,
      useFactory: (
        conductorCables: ConductorCablesUseCases,
        groundWires: GroundWiresUseCases,
        guyWires: GuyWiresUseCases,
        insulators: InsulatorsUseCases,
        soilTypes: SoilTypesUseCases,
        laborRoles: LaborRolesUseCases,
        equipment: EquipmentUseCases,
        fixedCosts: FixedCostsUseCases,
      ) =>
        buildCatalogImportTargets({
          conductorCables,
          groundWires,
          guyWires,
          insulators,
          soilTypes,
          laborRoles,
          equipment,
          fixedCosts,
        }),
      inject: [
        ConductorCablesUseCases,
        GroundWiresUseCases,
        GuyWiresUseCases,
        InsulatorsUseCases,
        SoilTypesUseCases,
        LaborRolesUseCases,
        EquipmentUseCases,
        FixedCostsUseCases,
      ],
    },
    {
      provide: CatalogImportUseCases,
      useFactory: (reader, targets) =>
        new CatalogImportUseCases(reader, targets),
      inject: [SPREADSHEET_READER, CATALOG_IMPORT_TARGETS],
    },
  ],
})
export class CatalogImportModule {}
