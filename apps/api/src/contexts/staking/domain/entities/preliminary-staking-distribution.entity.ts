import { PreliminaryPercentages } from '../value-objects';

export interface PreliminaryStakingDistributionProps {
  id?: number;
  transmissionLineId: number;
  soilPercentages: PreliminaryPercentages;
  foundationPercentages: PreliminaryPercentages;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PreliminaryStakingDistribution {
  public readonly id?: number;
  public readonly transmissionLineId: number;
  private _soilPercentages: PreliminaryPercentages;
  private _foundationPercentages: PreliminaryPercentages;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: PreliminaryStakingDistributionProps) {
    props.soilPercentages.validate('tipo de solo');
    props.foundationPercentages.validate('tipo de fundação');

    this.id = props.id;
    this.transmissionLineId = props.transmissionLineId;
    this._soilPercentages = props.soilPercentages;
    this._foundationPercentages = props.foundationPercentages;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public get soilPercentages(): PreliminaryPercentages {
    return this._soilPercentages;
  }

  public get foundationPercentages(): PreliminaryPercentages {
    return this._foundationPercentages;
  }

  public update(
    soilPercentages: PreliminaryPercentages,
    foundationPercentages: PreliminaryPercentages,
  ): void {
    soilPercentages.validate('tipo de solo');
    foundationPercentages.validate('tipo de fundação');
    this._soilPercentages = soilPercentages;
    this._foundationPercentages = foundationPercentages;
  }
}
