import {
  FOUNDATION_VOLUME_QUANTITY_FIELDS,
  FoundationVolumeQuantityField,
  FoundationVolumeVersion,
} from '@lt-offers/domain';

/** Rótulos pt-BR das 34 quantidades da matriz de volumes (RNF-14). */
export const FOUNDATION_VOLUME_QUANTITY_LABELS: Record<
  FoundationVolumeQuantityField,
  string
> = {
  excavationHardFootingM3: 'Escavação em rocha dura — sapata (m³)',
  excavationNormalFootingM3: 'Escavação normal — sapata (m³)',
  excavationWaterFootingM3: 'Escavação com água — sapata (m³)',
  excavationHardPrecastM3: 'Escavação em rocha dura — pré-moldado (m³)',
  excavationNormalPrecastM3: 'Escavação normal — pré-moldado (m³)',
  excavationWaterPrecastM3: 'Escavação com água — pré-moldado (m³)',
  excavationHardPileCapM3: 'Escavação em rocha dura — encepado (m³)',
  excavationNormalPileCapM3: 'Escavação normal — encepado (m³)',
  excavationWaterPileCapM3: 'Escavação com água — encepado (m³)',
  excavationPierM3: 'Escavação de pila (m³)',
  anchorBoltDrillingM: 'Perfuração de pernos (m)',
  steelPiersKg: 'Aço — pilas (kg)',
  steelFootingsKg: 'Aço — sapatas (kg)',
  steelPileCapsKg: 'Aço — encepados (kg)',
  steelPrecastKg: 'Aço — pré-moldados (kg)',
  steelRockKg: 'Aço — rocha (kg)',
  steelAnchorBoltsKg: 'Aço — pernos (kg)',
  concretePiersM3: 'Concreto — pilas (m³)',
  concreteFootingsM3: 'Concreto — sapatas (m³)',
  concretePileCapsM3: 'Concreto — encepados (m³)',
  concretePrecastM3: 'Concreto — pré-moldados (m³)',
  concreteRockM3: 'Concreto — rocha (m³)',
  regenerationM3: 'Regeneração de solo (m³)',
  groutM3: 'Grout (m³)',
  backfillSoilM3: 'Reaterro de solo (m³)',
  backfillSoilCementM3: 'Reaterro solo-cimento (m³)',
  formworkM2: 'Formas (m²)',
  helicalPileM: 'Estaca helicoidal (m)',
  steelPileM: 'Estaca metálica (m)',
  triconeM: 'Tricone (m)',
  rootPileM: 'Estaca raiz (m)',
  continuousAugerPileM: 'Hélice contínua (m)',
  micropileM: 'Micropilote (m)',
  concretePileM: 'Estaca de concreto (m)',
};

/** Agrupamento nas cinco famílias do design D1/D4 para o formulário. */
export const FOUNDATION_VOLUME_QUANTITY_GROUPS: {
  legend: string;
  fields: FoundationVolumeQuantityField[];
}[] = [
  {
    legend: 'Escavação',
    fields: [
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
    ],
  },
  {
    legend: 'Perfuração',
    fields: ['anchorBoltDrillingM'],
  },
  {
    legend: 'Aço',
    fields: [
      'steelPiersKg',
      'steelFootingsKg',
      'steelPileCapsKg',
      'steelPrecastKg',
      'steelRockKg',
      'steelAnchorBoltsKg',
    ],
  },
  {
    legend: 'Concreto',
    fields: [
      'concretePiersM3',
      'concreteFootingsM3',
      'concretePileCapsM3',
      'concretePrecastM3',
      'concreteRockM3',
    ],
  },
  {
    legend: 'Complementos',
    fields: [
      'regenerationM3',
      'groutM3',
      'backfillSoilM3',
      'backfillSoilCementM3',
      'formworkM2',
    ],
  },
  {
    legend: 'Metragens de estacas',
    fields: [
      'helicalPileM',
      'steelPileM',
      'triconeM',
      'rootPileM',
      'continuousAugerPileM',
      'micropileM',
      'concretePileM',
    ],
  },
];

/** Contagem de quantidades preenchidas (zero é preenchido, null é não informado). */
export function countInformedQuantities(
  version: FoundationVolumeVersion | null | undefined,
): number {
  if (!version) {
    return 0;
  }
  return FOUNDATION_VOLUME_QUANTITY_FIELDS.filter(
    (field) => version[field] !== null && version[field] !== undefined,
  ).length;
}

/** Resumo textual para listagem / histórico. */
export function quantitiesSummary(
  version: FoundationVolumeVersion | null | undefined,
): string {
  if (!version) {
    return '—';
  }
  const count = countInformedQuantities(version);
  return `${count} de 34 informadas`;
}
