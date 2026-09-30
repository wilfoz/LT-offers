import { CatalogImportKey, ImportPayload } from '@lt-offers/domain';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';
import {
  CreateConductorCableDto,
  CreateEquipmentDto,
  CreateFixedCostDto,
  CreateGroundWireDto,
  CreateGuyWireDto,
  CreateInsulatorDto,
  CreateLaborRoleDto,
  CreateSoilTypeDto,
} from '../http/dto';

/**
 * DTO de criação de cada catálogo importável: a validação da prévia e do
 * commit passa pelo mesmo DTO do cadastro manual (design, goal "nenhuma regra
 * duplicada") — inclusive regras entre campos, como a faixa de NSPT.
 */
export const CATALOG_IMPORT_DTOS: Record<CatalogImportKey, new () => object> = {
  'conductor-cables': CreateConductorCableDto,
  'ground-wires': CreateGroundWireDto,
  'guy-wires': CreateGuyWireDto,
  insulators: CreateInsulatorDto,
  'soil-types': CreateSoilTypeDto,
  'labor-roles': CreateLaborRoleDto,
  equipment: CreateEquipmentDto,
  'fixed-costs': CreateFixedCostDto,
};

function collectMessages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...collectMessages(error.children ?? []),
  ]);
}

/** Mensagens pt-BR (RNF-14) do DTO de criação para o payload; [] = válido. */
export async function validateImportPayload(
  catalogKey: CatalogImportKey,
  payload: ImportPayload,
): Promise<string[]> {
  const instance = plainToInstance(CATALOG_IMPORT_DTOS[catalogKey], payload);
  // whitelist como o ValidationPipe global: chave fora do DTO não chega ao caso de uso
  return collectMessages(await validate(instance, { whitelist: true }));
}
