export class Station {
  private readonly _meters: number;

  constructor(meters: number) {
    if (isNaN(meters) || meters < 0) {
      throw new Error('A estaca não pode ser negativa ou inválida.');
    }
    this._meters = meters;
  }

  public get meters(): number {
    return this._meters;
  }

  public toKm(): number {
    return this._meters / 1000;
  }

  public toMetersString(fractionDigits = 2): string {
    return this._meters.toFixed(fractionDigits);
  }

  public toKmString(fractionDigits = 3): string {
    return (this._meters / 1000).toFixed(fractionDigits);
  }

  public static fromNumber(value: number): Station {
    return new Station(value);
  }

  public static fromString(value: string): Station {
    const parsed = Number(value.replace(',', '.'));
    return new Station(parsed);
  }
}
