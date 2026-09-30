import {
  CatalogImportKey,
  GroundWireType,
  ImportPayload,
} from '@lt-offers/domain';
import {
  ConductorCablesUseCases,
  CreateConductorCableInput,
  CreateEquipmentInput,
  CreateFixedCostInput,
  CreateGroundWireInput,
  CreateGuyWireInput,
  CreateInsulatorInput,
  CreateLaborRoleInput,
  CreateSoilTypeInput,
  EquipmentUseCases,
  FixedCostsUseCases,
  GroundWiresUseCases,
  GuyWiresUseCases,
  InsulatorsUseCases,
  LaborRolesUseCases,
  SoilTypesUseCases,
} from '../../application';
import {
  CatalogImportTarget,
  CatalogImportTargets,
  GroundWireVersionEntity,
  InvalidCatalogDataException,
} from '../../domain';
import { validateImportPayload } from './catalog-import-dtos';

/** Casos de uso de criação dos 8 catálogos planos (injetados pelo módulo). */
export interface CatalogImportUseCaseSet {
  conductorCables: ConductorCablesUseCases;
  groundWires: GroundWiresUseCases;
  guyWires: GuyWiresUseCases;
  insulators: InsulatorsUseCases;
  soilTypes: SoilTypesUseCases;
  laborRoles: LaborRolesUseCases;
  equipment: EquipmentUseCases;
  fixedCosts: FixedCostsUseCases;
}

interface CatalogCreator<TInput> {
  list(): Promise<{ code: string }[]>;
  create(input: TInput, createdBy: string): Promise<unknown>;
}

// Regra de aplicabilidade por tipo do cabo de guarda: reusa a regra da
// entidade de domínio (mesma mensagem do cadastro manual), sem duplicá-la.
function groundWireTypeCheck(payload: ImportPayload): string[] {
  try {
    GroundWireVersionEntity.assertTypeApplicability(
      payload,
      payload['type'] as GroundWireType,
    );
    return [];
  } catch (error) {
    if (error instanceof InvalidCatalogDataException) {
      return [error.message];
    }
    throw error;
  }
}

function target<TInput>(
  catalogKey: CatalogImportKey,
  useCases: CatalogCreator<TInput>,
  domainCheck?: (payload: ImportPayload) => string[],
): CatalogImportTarget {
  return {
    async listCodes() {
      return (await useCases.list()).map((item) => item.code);
    },
    async validate(payload) {
      const messages = await validateImportPayload(catalogKey, payload);
      return messages.length === 0 && domainCheck
        ? domainCheck(payload)
        : messages;
    },
    async create(payload, effectiveFrom, createdBy) {
      // Payload já validado pelo DTO do catálogo (validate acima)
      const input = { ...payload, effectiveFrom } as unknown as TInput;
      await useCases.create(input, createdBy);
    },
  };
}

/** Adaptadores de destino: validação pelo DTO + criação pelo caso de uso existente. */
export function buildCatalogImportTargets(
  set: CatalogImportUseCaseSet,
): CatalogImportTargets {
  return {
    'conductor-cables': target<CreateConductorCableInput>(
      'conductor-cables',
      set.conductorCables,
    ),
    'ground-wires': target<CreateGroundWireInput>(
      'ground-wires',
      set.groundWires,
      groundWireTypeCheck,
    ),
    'guy-wires': target<CreateGuyWireInput>('guy-wires', set.guyWires),
    insulators: target<CreateInsulatorInput>('insulators', set.insulators),
    'soil-types': target<CreateSoilTypeInput>('soil-types', set.soilTypes),
    'labor-roles': target<CreateLaborRoleInput>('labor-roles', set.laborRoles),
    equipment: target<CreateEquipmentInput>('equipment', set.equipment),
    'fixed-costs': target<CreateFixedCostInput>('fixed-costs', set.fixedCosts),
  };
}
