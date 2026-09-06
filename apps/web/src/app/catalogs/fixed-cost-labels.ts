import { FixedCostCategory } from '@lt-offers/domain';

export const FIXED_COST_CATEGORY_LABELS: Record<FixedCostCategory, string> = {
  EPI: 'EPI (Equipamentos de Proteção)',
  MEDICAL_EXAM: 'Exames Médicos',
  UNIFORM: 'Uniformes',
  MOB_DEMOB: 'Mobilização e Desmobilização',
  TRAVEL_HOUSING: 'Passagens e Hospedagens',
  OTHER: 'Outros Custos Fixos',
};

export const FIXED_COST_CATEGORIES: {
  value: FixedCostCategory;
  label: string;
}[] = [
  { value: 'EPI', label: 'EPI (Equipamentos de Proteção)' },
  { value: 'MEDICAL_EXAM', label: 'Exames Médicos' },
  { value: 'UNIFORM', label: 'Uniformes' },
  {
    value: 'MOB_DEMOB',
    label: 'Mobilização e Desmobilização',
  },
  { value: 'TRAVEL_HOUSING', label: 'Passagens e Hospedagens' },
  { value: 'OTHER', label: 'Outros Custos Fixos' },
];

export function fixedCostCategoryLabel(category: FixedCostCategory): string {
  return FIXED_COST_CATEGORY_LABELS[category] ?? category;
}
