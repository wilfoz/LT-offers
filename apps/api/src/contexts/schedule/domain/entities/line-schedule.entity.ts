import {
  ScheduleSummary,
  ScheduleActivity,
  MilestoneContract,
} from '@lt-offers/domain';

export interface LineSchedule extends ScheduleSummary {
  lineId: number;
  lineName?: string;
  startMonth: number;
  totalDurationMonths: number;
  activities: ScheduleActivity[];
  milestones: MilestoneContract[];
  totalDirectLaborCost: string;
  totalEquipmentCost: string;
  totalIndirectCost: string;
  totalScheduleCost: string;
  warnings: string[];
}
