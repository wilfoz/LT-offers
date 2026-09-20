import { CampCostSummary, CampDefinition } from '@lt-offers/domain';

export interface CampPlan extends CampCostSummary {
  lineId: number;
  camps: CampDefinition[];
  totalImplementationCost: string;
  totalOperatingCost: string;
  totalDemobilizationCost: string;
  totalCampsCost: string;
  monthlyDistribution: {
    month: number;
    cost: string;
  }[];
}
