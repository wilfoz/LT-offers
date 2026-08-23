/**
 * Resolução de vigência (spec catalogos/versionamento-vigencia): a versão
 * vigente para uma data de referência é a de maior effectiveFrom menor ou
 * igual à data. Funções puras — a data de referência chega sempre como
 * parâmetro.
 */

export interface HasEffectiveFrom {
  effectiveFrom: Date;
}

export function resolveEffectiveVersion<T extends HasEffectiveFrom>(
  versions: T[],
  referenceDate: Date,
): T | undefined {
  return versions
    .filter((v) => v.effectiveFrom.getTime() <= referenceDate.getTime())
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0];
}

export interface RequiredFields {
  description: string | null;
  weightTonPerKm: unknown | null;
  reelLengthM: unknown | null;
  diameterMm: unknown | null;
  utsKn: unknown | null;
}

// Rótulos exibidos ao usuário — permanecem em pt-BR (RNF-14)
const LABELS: Record<keyof RequiredFields, string> = {
  description: 'descrição',
  weightTonPerKm: 'peso (ton/km)',
  reelLengthM: 'bobina (m)',
  diameterMm: 'diâmetro (mm)',
  utsKn: 'UTS (kN)',
};

function isMissing(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  return typeof value === 'string' && value.trim() === '';
}

/** Campos obrigatórios não informados, para sinalização (RF-11, RNF-09). */
export function pendingFields(version: RequiredFields): string[] {
  return (Object.keys(LABELS) as (keyof RequiredFields)[])
    .filter((field) => isMissing(version[field]))
    .map((field) => LABELS[field]);
}
