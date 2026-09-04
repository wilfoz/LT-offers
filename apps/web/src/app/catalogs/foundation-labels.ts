import {
  FoundationApplication,
  FoundationElementCountField,
  FoundationTypeVersion,
} from '@lt-offers/domain';

/** Rótulos de exibição das aplicações de fundação (RNF-14). */
export const FOUNDATION_APPLICATION_LABELS: Record<
  FoundationApplication,
  string
> = {
  SELF_SUPPORTING: 'Autoportante',
  GUYED: 'Estaiada',
  CROSS_ROPE: 'Cross-rope',
};

/** Rótulos pt-BR dos 17 elementos de fundação (RNF-14). */
export const FOUNDATION_ELEMENT_COUNT_LABELS: Record<
  FoundationElementCountField,
  string
> = {
  spreadFootingCount: 'fuste sapata',
  precastMastCount: 'preformado mastro',
  precastGuyCount: 'preformado tirante',
  straightPierCount: 'pila reta',
  belledPierCount: 'pila campana',
  slabPierCount: 'pila com laje',
  straightPierGuyCount: 'pila reta tirante',
  belledPierGuyCount: 'pila campana tirante',
  rockAnchorCount: 'ancoragem em rocha',
  concretePileCount: 'estaca de concreto',
  steelPileCount: 'estaca metálica',
  helicalMastCount: 'helicoidal mastro',
  helicalGuyCount: 'helicoidal tirante',
  triconeCount: 'tricone',
  rootPileCount: 'estaca raiz',
  micropileCount: 'micropilote',
  continuousAugerPileCount: 'hélice contínua',
};

/** Agrupamento por família para o formulário (design D4). */
export const FOUNDATION_ELEMENT_GROUPS: {
  legend: string;
  fields: FoundationElementCountField[];
}[] = [
  {
    legend: 'Sapatas e preformados',
    fields: ['spreadFootingCount', 'precastMastCount', 'precastGuyCount'],
  },
  {
    legend: 'Pilas',
    fields: [
      'straightPierCount',
      'belledPierCount',
      'slabPierCount',
      'straightPierGuyCount',
      'belledPierGuyCount',
    ],
  },
  {
    legend: 'Rocha',
    fields: ['rockAnchorCount', 'triconeCount'],
  },
  {
    legend: 'Estacas',
    fields: [
      'concretePileCount',
      'steelPileCount',
      'helicalMastCount',
      'helicalGuyCount',
      'rootPileCount',
      'micropileCount',
      'continuousAugerPileCount',
    ],
  },
];

/**
 * Resumo da composição para listagem/histórico: só os elementos informados,
 * como "4 × fuste sapata"; nenhum informado aparece como "—" (RNF-09:
 * ausência visível — zero informado é exibido).
 */
export function compositionSummary(
  version: FoundationTypeVersion | null | undefined,
): string {
  if (!version) {
    return '—';
  }
  const parts = (
    Object.keys(
      FOUNDATION_ELEMENT_COUNT_LABELS,
    ) as FoundationElementCountField[]
  )
    .filter((field) => version[field] !== null)
    .map(
      (field) =>
        `${version[field]} × ${FOUNDATION_ELEMENT_COUNT_LABELS[field]}`,
    );
  return parts.length > 0 ? parts.join(' · ') : '—';
}
