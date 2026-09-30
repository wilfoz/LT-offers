import {
  FIXED_COST_CATEGORIES as CATEGORY_VALUES,
  FIXED_COST_CATEGORY_LABELS,
  FixedCostCategory,
} from '@lt-offers/domain';

/** Rótulos das categorias (RNF-14), vindos da domain. */
export { FIXED_COST_CATEGORY_LABELS };

export const FIXED_COST_CATEGORIES: {
  value: FixedCostCategory;
  label: string;
}[] = CATEGORY_VALUES.map((value) => ({
  value,
  label: FIXED_COST_CATEGORY_LABELS[value],
}));

export function fixedCostCategoryLabel(category: FixedCostCategory): string {
  return FIXED_COST_CATEGORY_LABELS[category] ?? category;
}
