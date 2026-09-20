import { DecimalValue } from '@lt-offers/calc-engine';
import { InvalidDestinationSharesException } from '../exceptions/offer-domain.exceptions';

export interface TransmissionLineProps {
  id?: number;
  revisionId?: number;
  code: string;
  name: string;
  nominalVoltageKv: string;
  refinedLengthKm: string;
  reportLengthKm: string;
  circuitCount: number;
  bundleConductorCount: number;
  destinationStatePrimary: string;
  destinationPercentagePrimary: string;
  destinationStateSecondary?: string | null;
  destinationPercentageSecondary?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TransmissionLine {
  private constructor(private readonly _props: TransmissionLineProps) {
    this.validateInvariants();
  }

  static create(
    props: Omit<TransmissionLineProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): TransmissionLine {
    return new TransmissionLine({
      ...props,
      destinationStateSecondary: props.destinationStateSecondary ?? null,
      destinationPercentageSecondary:
        props.destinationPercentageSecondary ?? '0',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: TransmissionLineProps): TransmissionLine {
    return new TransmissionLine(props);
  }

  private validateInvariants(): void {
    const p1 = DecimalValue.of(this._props.destinationPercentagePrimary || '0');
    const p2 = DecimalValue.of(
      this._props.destinationPercentageSecondary || '0',
    );
    const total = p1.plus(p2);

    if (!total.equals(DecimalValue.of(100))) {
      throw new InvalidDestinationSharesException(
        this._props.code,
        total.toString(),
      );
    }
  }

  get id(): number | undefined {
    return this._props.id;
  }

  get revisionId(): number | undefined {
    return this._props.revisionId;
  }

  get code(): string {
    return this._props.code;
  }

  get name(): string {
    return this._props.name;
  }

  get nominalVoltageKv(): string {
    return this._props.nominalVoltageKv;
  }

  get refinedLengthKm(): string {
    return this._props.refinedLengthKm;
  }

  get reportLengthKm(): string {
    return this._props.reportLengthKm;
  }

  get circuitCount(): number {
    return this._props.circuitCount;
  }

  get bundleConductorCount(): number {
    return this._props.bundleConductorCount;
  }

  get destinationStatePrimary(): string {
    return this._props.destinationStatePrimary;
  }

  get destinationPercentagePrimary(): string {
    return this._props.destinationPercentagePrimary;
  }

  get destinationStateSecondary(): string | null | undefined {
    return this._props.destinationStateSecondary;
  }

  get destinationPercentageSecondary(): string | null | undefined {
    return this._props.destinationPercentageSecondary;
  }

  get createdAt(): Date | undefined {
    return this._props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._props.updatedAt;
  }

  toRawProps(): TransmissionLineProps {
    return { ...this._props };
  }
}
