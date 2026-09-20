import { DATE_PATTERN } from '@lt-offers/domain';
import { InvalidCivilDateException } from '../exceptions/catalog-domain.exceptions';

export const BUSINESS_TIMEZONE = 'America/Sao_Paulo';

/**
 * Value Object para Data Civil (meia-noite UTC no fuso do negócio).
 * Rejeita datas de calendário inválidas como '2026-02-30' (RNF-05).
 */
export class CivilDate {
  private readonly value: Date;
  private readonly isoDateString: string;

  private constructor(date: Date, isoDateString: string) {
    this.value = date;
    this.isoDateString = isoDateString;
  }

  public static fromString(text: string): CivilDate {
    const date = new Date(`${text}T00:00:00.000Z`);
    const valid =
      DATE_PATTERN.test(text) &&
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === text;

    if (!valid) {
      throw new InvalidCivilDateException(text);
    }

    return new CivilDate(date, text);
  }

  public static fromDate(date: Date): CivilDate {
    const text = date.toISOString().slice(0, 10);
    return CivilDate.fromString(text);
  }

  public static today(now: Date = new Date()): CivilDate {
    const text = new Intl.DateTimeFormat('en-CA', {
      timeZone: BUSINESS_TIMEZONE,
    }).format(now);
    return CivilDate.fromString(text);
  }

  public toDate(): Date {
    return new Date(this.value.getTime());
  }

  public toIsoDateString(): string {
    return this.isoDateString;
  }

  public toISOString(): string {
    return this.value.toISOString();
  }

  public getTime(): number {
    return this.value.getTime();
  }

  public equals(other: CivilDate): boolean {
    return this.isoDateString === other.isoDateString;
  }

  public isBefore(other: CivilDate): boolean {
    return this.value.getTime() < other.value.getTime();
  }

  public isAfter(other: CivilDate): boolean {
    return this.value.getTime() > other.value.getTime();
  }

  public isSameOrBefore(other: CivilDate): boolean {
    return this.value.getTime() <= other.value.getTime();
  }

  public isSameOrAfter(other: CivilDate): boolean {
    return this.value.getTime() >= other.value.getTime();
  }

  public toString(): string {
    return this.isoDateString;
  }
}
