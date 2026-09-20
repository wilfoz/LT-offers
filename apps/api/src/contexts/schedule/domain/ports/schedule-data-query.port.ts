import { MilestoneContract, CampDefinition } from '@lt-offers/domain';
import { ScheduleCalculationInput } from '@lt-offers/calc-engine';

export interface ScheduleLineData {
  lineId: number;
  lineName: string;
  lengthKm: number;
  totalTowers: number;
  uf: string;
  startMonth: number;
  milestones: MilestoneContract[];
  activitiesInput: ScheduleCalculationInput['activities'];
}

export type RawCampInput = Omit<
  CampDefinition,
  'totalPersonnelMonthlyCost' | 'totalMonthlyCost' | 'totalCampCost'
>;

export interface ScheduleLineCampsData {
  lineId: number;
  rawCamps: RawCampInput[];
}

/**
 * Porta de consulta de dados para o cálculo de cronograma físico e dimensionamento de canteiros.
 */
export interface ScheduleDataQueryPort {
  findLineScheduleData(lineId: number): Promise<ScheduleLineData | null>;
  findLineCampsData(lineId: number): Promise<ScheduleLineCampsData | null>;
}
