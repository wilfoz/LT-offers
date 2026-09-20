import { ConductorCablesRepository } from './conductor-cables.repository';
import { GroundWiresRepository } from './ground-wires.repository';
import { GuyWiresRepository } from './guy-wires.repository';
import { InsulatorsRepository } from './insulators.repository';
import { StructureSeriesRepository } from './structure-series.repository';
import { TowerTypesRepository } from './tower-types.repository';
import { SoilTypesRepository } from './soil-types.repository';
import { FoundationTypesRepository } from './foundation-types.repository';
import { FoundationVolumesRepository } from './foundation-volumes.repository';
import { FixedCostsRepository } from './fixed-costs.repository';
import { EquipmentRepository } from './equipment.repository';
import { LaborRolesRepository } from './labor-roles.repository';
import { WorkCrewsRepository } from './work-crews.repository';

export const CATALOGS_UNIT_OF_WORK = Symbol('CATALOGS_UNIT_OF_WORK');

export interface CatalogsTransactionalContext {
  conductorCables: ConductorCablesRepository;
  groundWires: GroundWiresRepository;
  guyWires: GuyWiresRepository;
  insulators: InsulatorsRepository;
  structureSeries: StructureSeriesRepository;
  towerTypes: TowerTypesRepository;
  soilTypes: SoilTypesRepository;
  foundationTypes: FoundationTypesRepository;
  foundationVolumes: FoundationVolumesRepository;
  fixedCosts: FixedCostsRepository;
  equipment: EquipmentRepository;
  laborRoles: LaborRolesRepository;
  workCrews: WorkCrewsRepository;
}

export interface CatalogsUnitOfWork {
  runInTransaction<T>(
    work: (context: CatalogsTransactionalContext) => Promise<T>,
  ): Promise<T>;
}
