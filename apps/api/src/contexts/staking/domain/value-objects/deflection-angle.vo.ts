export class DeflectionAngle {
  private readonly _degrees: number;

  constructor(degrees: number) {
    if (isNaN(degrees) || degrees < 0) {
      throw new Error(
        'O ângulo de deflexão não pode ser negativo ou inválido.',
      );
    }
    this._degrees = degrees;
  }

  public get degrees(): number {
    return this._degrees;
  }

  public toDegreesString(fractionDigits = 2): string {
    return this._degrees.toFixed(fractionDigits);
  }

  public static fromNumber(value: number): DeflectionAngle {
    return new DeflectionAngle(value);
  }

  public static fromString(value: string): DeflectionAngle {
    const parsed = Number(value.replace(',', '.'));
    return new DeflectionAngle(parsed);
  }
}
