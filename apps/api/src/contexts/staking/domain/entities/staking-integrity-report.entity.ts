import { StakingInvalidCombinationDetail } from '@lt-offers/domain';

export interface StakingIntegrityReportProps {
  totalTowers: number;
  unassignedSoilCount: number;
  unassignedFoundationCount: number;
  invalidCombinations: StakingInvalidCombinationDetail[];
  totalStationLengthKm: string;
  lineRefinedLengthKm: string;
  lengthDiscrepancyKm: string | null;
}

export class StakingIntegrityReport {
  public readonly totalTowers: number;
  public readonly unassignedSoilCount: number;
  public readonly unassignedFoundationCount: number;
  public readonly invalidCombinations: StakingInvalidCombinationDetail[];
  public readonly totalStationLengthKm: string;
  public readonly lineRefinedLengthKm: string;
  public readonly lengthDiscrepancyKm: string | null;

  constructor(props: StakingIntegrityReportProps) {
    this.totalTowers = props.totalTowers;
    this.unassignedSoilCount = props.unassignedSoilCount;
    this.unassignedFoundationCount = props.unassignedFoundationCount;
    this.invalidCombinations = props.invalidCombinations;
    this.totalStationLengthKm = props.totalStationLengthKm;
    this.lineRefinedLengthKm = props.lineRefinedLengthKm;
    this.lengthDiscrepancyKm = props.lengthDiscrepancyKm;
  }

  public get hasErrors(): boolean {
    return (
      this.unassignedSoilCount > 0 ||
      this.unassignedFoundationCount > 0 ||
      this.invalidCombinations.length > 0
    );
  }

  public get invalidCombinationsCount(): number {
    return this.invalidCombinations.length;
  }
}
