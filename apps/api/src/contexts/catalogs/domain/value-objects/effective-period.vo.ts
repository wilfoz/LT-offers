import { CivilDate } from './civil-date.vo';
import { InvalidEffectiveDateRangeException } from '../exceptions/catalog-domain.exceptions';

/**
 * Value Object que encapsula o período de vigência de uma versão de catálogo (RNF-05).
 */
export class EffectivePeriod {
  private readonly _effectiveFrom: CivilDate;
  private readonly _effectiveTo: CivilDate | null;

  constructor(effectiveFrom: CivilDate, effectiveTo: CivilDate | null = null) {
    if (effectiveTo && effectiveTo.isBefore(effectiveFrom)) {
      throw new InvalidEffectiveDateRangeException(
        effectiveFrom.toIsoDateString(),
        effectiveTo.toIsoDateString(),
      );
    }
    this._effectiveFrom = effectiveFrom;
    this._effectiveTo = effectiveTo;
  }

  public get effectiveFrom(): CivilDate {
    return this._effectiveFrom;
  }

  public get effectiveTo(): CivilDate | null {
    return this._effectiveTo;
  }

  public isEffectiveAt(referenceDate: CivilDate | Date | string): boolean {
    const ref =
      referenceDate instanceof CivilDate
        ? referenceDate
        : referenceDate instanceof Date
          ? CivilDate.fromDate(referenceDate)
          : CivilDate.fromString(referenceDate);

    const isAfterOrAtStart = this._effectiveFrom.isSameOrBefore(ref);
    const isBeforeOrAtEnd = this._effectiveTo
      ? ref.isSameOrBefore(this._effectiveTo)
      : true;

    return isAfterOrAtStart && isBeforeOrAtEnd;
  }

  public close(effectiveTo: CivilDate | Date | string): EffectivePeriod {
    const to =
      effectiveTo instanceof CivilDate
        ? effectiveTo
        : effectiveTo instanceof Date
          ? CivilDate.fromDate(effectiveTo)
          : CivilDate.fromString(effectiveTo);

    return new EffectivePeriod(this._effectiveFrom, to);
  }
}
