import { GroundWireSummary, GroundWireType } from '@lt-offers/domain';

/** Rótulos de exibição dos tipos de cabo de guarda (RNF-14). */
export const GROUND_WIRE_TYPE_LABELS: Record<GroundWireType, string> = {
  STEEL: 'Aço',
  OPGW: 'OPGW',
};

/**
 * Resumo dos atributos específicos do tipo para a listagem; campo não
 * informado aparece como "—" (RNF-09: ausência visível, nunca zero).
 */
export function typeSpecificSummary(item: GroundWireSummary): string {
  const version = item.effectiveVersion;
  if (!version) {
    return '—';
  }
  const dash = (value: string | number | null) => value ?? '—';
  if (item.type === 'STEEL') {
    return `galv. ${dash(version.galvanizationClass)} · grau ${dash(
      version.strengthGrade,
    )} · ${dash(version.wireCount)} fios`;
  }
  return `${dash(version.manufacturer)} · I²t ${dash(
    version.i2tKa2s,
  )} kA²·s · ${dash(version.fiberCount)} fibras`;
}
