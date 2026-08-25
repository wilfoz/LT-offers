/**
 * Contratos da matriz de volumes de fundação (origem DB_FUN, RN-13) trocados
 * entre api e web. Cada entrada é identificada pela combinação única tipo de
 * torre × tipo de solo × tipo de fundação (imutável após a criação); as
 * quantidades são decimais ≥ 0 que trafegam como string (RNF-08), com null =
 * "não informado", distinto de "0" (RNF-09). Unidades: hipótese registrada no
 * proposal da change (a planilha não as declara).
 */

/**
 * Campos de quantidade da combinação, na ordem das colunas da DB_FUN — a
 * ordem é reusada por api (pendências) e web (formulário por família).
 */
export const FOUNDATION_VOLUME_QUANTITY_FIELDS = [
  'excavationHardFootingM3',
  'excavationNormalFootingM3',
  'excavationWaterFootingM3',
  'excavationHardPrecastM3',
  'excavationNormalPrecastM3',
  'excavationWaterPrecastM3',
  'excavationHardPileCapM3',
  'excavationNormalPileCapM3',
  'excavationWaterPileCapM3',
  'excavationPierM3',
  'anchorBoltDrillingM',
  'steelPiersKg',
  'steelFootingsKg',
  'steelPileCapsKg',
  'steelPrecastKg',
  'steelRockKg',
  'steelAnchorBoltsKg',
  'concretePiersM3',
  'concreteFootingsM3',
  'concretePileCapsM3',
  'concretePrecastM3',
  'concreteRockM3',
  'regenerationM3',
  'groutM3',
  'backfillSoilM3',
  'backfillSoilCementM3',
  'formworkM2',
  'helicalPileM',
  'steelPileM',
  'triconeM',
  'rootPileM',
  'continuousAugerPileM',
  'micropileM',
  'concretePileM',
] as const;
export type FoundationVolumeQuantityField =
  (typeof FOUNDATION_VOLUME_QUANTITY_FIELDS)[number];

export type FoundationVolumeQuantities = {
  [K in FoundationVolumeQuantityField]: string | null;
};

/** Rótulos da combinação para exibição — a listagem é ilegível só com ids. */
export interface FoundationVolumeCombination {
  towerTypeId: number;
  seriesName: string;
  towerCode: string;
  soilTypeId: number;
  soilCode: string;
  foundationTypeId: number;
  foundationCode: string;
}

export interface FoundationVolumeVersion extends FoundationVolumeQuantities {
  id: number;
  effectiveFrom: string;
  createdBy: string;
  createdAt: string;
}

export interface FoundationVolumeSummary {
  id: number;
  combination: FoundationVolumeCombination;
  effectiveVersion: FoundationVolumeVersion | null;
  pendingFields: string[];
}

export interface FoundationVolumeHistory {
  id: number;
  combination: FoundationVolumeCombination;
  versions: FoundationVolumeVersion[];
}

export interface FoundationVolumeVersionInput extends Partial<FoundationVolumeQuantities> {
  effectiveFrom?: string;
}

/** Nova versão de entrada existente: a data de vigência é obrigatória. */
export interface NewFoundationVolumeVersionInput extends FoundationVolumeVersionInput {
  effectiveFrom: string;
}

export interface NewFoundationVolumeInput extends FoundationVolumeVersionInput {
  towerTypeId: number;
  soilTypeId: number;
  foundationTypeId: number;
}
