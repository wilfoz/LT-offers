import { FixedCostCategory } from '@lt-offers/domain';

export const FIXED_COST_CATEGORY_LABELS: Record<FixedCostCategory, string> = {
  CANTEIRO: 'Canteiro de Obras',
  ENGENHARIA_SUPERVISAO: 'Engenharia e Supervisão',
  MOBILIZACAO_DESMOBILIZACAO: 'Mobilização e Desmobilização',
  SEGUROS_GARANTIAS: 'Seguros e Garantias',
  ADMINISTRACAO_CENTRAL_LOCAL: 'Administração Local/Central',
  OUTROS: 'Outros Custos Fixos',
};

export const FIXED_COST_CATEGORIES: {
  value: FixedCostCategory;
  label: string;
}[] = [
  { value: 'CANTEIRO', label: 'Canteiro de Obras' },
  { value: 'ENGENHARIA_SUPERVISAO', label: 'Engenharia e Supervisão' },
  {
    value: 'MOBILIZACAO_DESMOBILIZACAO',
    label: 'Mobilização e Desmobilização',
  },
  { value: 'SEGUROS_GARANTIAS', label: 'Seguros e Garantias' },
  {
    value: 'ADMINISTRACAO_CENTRAL_LOCAL',
    label: 'Administração Local/Central',
  },
  { value: 'OUTROS', label: 'Outros Custos Fixos' },
];

export function fixedCostCategoryLabel(category: FixedCostCategory): string {
  return FIXED_COST_CATEGORY_LABELS[category] ?? category;
}
