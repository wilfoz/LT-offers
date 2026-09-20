import { CivilDate, EffectivePeriod } from '../value-objects';

export interface HasEffectivePeriod {
  effectivePeriod: EffectivePeriod;
}

/**
 * Função pura para resolver a versão vigente de um item em uma data de referência (RNF-05).
 * Retorna a versão cujo início de vigência é menor ou igual à data de referência
 * e que possui a data de início mais recente.
 */
export function resolveEffectiveEntityVersion<T extends HasEffectivePeriod>(
  versions: T[],
  referenceDate: CivilDate | Date | string,
): T | null {
  const ref =
    referenceDate instanceof CivilDate
      ? referenceDate
      : referenceDate instanceof Date
        ? CivilDate.fromDate(referenceDate)
        : CivilDate.fromString(referenceDate);

  const eligible = versions.filter((v) =>
    v.effectivePeriod.effectiveFrom.isSameOrBefore(ref),
  );

  if (eligible.length === 0) {
    return null;
  }

  eligible.sort(
    (a, b) =>
      b.effectivePeriod.effectiveFrom.getTime() -
      a.effectivePeriod.effectiveFrom.getTime(),
  );

  return eligible[0];
}
