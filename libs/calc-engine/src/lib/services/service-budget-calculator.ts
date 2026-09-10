import {
  ServiceBudgetItem,
  ServiceBudgetSummary,
  ServiceGroup,
  ServiceCostSource,
  ServiceRatios,
} from '@lt-offers/domain';
import { DecimalValue } from '../decimal-value';

export interface ServiceItemCalculationInput {
  id: string;
  code: string;
  name: string;
  group: ServiceGroup;
  cipCode?: string;
  costSource: ServiceCostSource;
  quantity: number | string;
  unit: string;
  unitDirectCost: number | string;
  bdiPercentage?: number | string;
  notes?: string;
}

export interface ServiceBudgetCalculationInput {
  lineId: string;
  lineName: string;
  lineLengthKm: number | string;
  totalTowers: number;
  defaultBdiPercentage?: number | string;
  items: ServiceItemCalculationInput[];
}

export class ServiceBudgetCalculator {
  /**
   * Consolida o orçamento de serviços, códigos CIP, BDI e ratios paramétricos (RF-46..RF-50).
   */
  static calculateServiceBudget(input: ServiceBudgetCalculationInput): ServiceBudgetSummary {
    const lineLengthDec = DecimalValue.of(input.lineLengthKm || '1');
    const totalTowersDec = DecimalValue.of(Math.max(1, input.totalTowers));
    const defaultBdiDec = DecimalValue.of(input.defaultBdiPercentage || '24.50');

    let totalDirectCostDec = DecimalValue.zero();
    let totalSalePriceDec = DecimalValue.zero();

    const groups: ServiceGroup[] = [
      'PRELIMINARY_WORKS',
      'CIVIL_WORKS',
      'ASSEMBLY_WORKS',
      'STRINGING_WORKS',
      'COMMISSIONING',
      'INDIRECTS_SUPPORT',
    ];

    const groupTotals: Record<
      ServiceGroup,
      { directCost: DecimalValue; salePrice: DecimalValue }
    > = {
      PRELIMINARY_WORKS: { directCost: DecimalValue.zero(), salePrice: DecimalValue.zero() },
      CIVIL_WORKS: { directCost: DecimalValue.zero(), salePrice: DecimalValue.zero() },
      ASSEMBLY_WORKS: { directCost: DecimalValue.zero(), salePrice: DecimalValue.zero() },
      STRINGING_WORKS: { directCost: DecimalValue.zero(), salePrice: DecimalValue.zero() },
      COMMISSIONING: { directCost: DecimalValue.zero(), salePrice: DecimalValue.zero() },
      INDIRECTS_SUPPORT: { directCost: DecimalValue.zero(), salePrice: DecimalValue.zero() },
    };

    const calculatedItems: ServiceBudgetItem[] = input.items.map((it) => {
      const qtyDec = DecimalValue.of(it.quantity || '0');
      const unitCostDec = DecimalValue.of(it.unitDirectCost || '0');
      const totalCostDec = qtyDec.times(unitCostDec).round(2, 'half-up');

      const bdiDec = it.bdiPercentage !== undefined ? DecimalValue.of(it.bdiPercentage) : defaultBdiDec;
      const bdiMultiplier = DecimalValue.of('1').plus(bdiDec.dividedBy(DecimalValue.of('100')));

      const unitSaleDec = unitCostDec.times(bdiMultiplier).round(2, 'half-up');
      const totalSaleDec = totalCostDec.times(bdiMultiplier).round(2, 'half-up');

      totalDirectCostDec = totalDirectCostDec.plus(totalCostDec);
      totalSalePriceDec = totalSalePriceDec.plus(totalSaleDec);

      if (groupTotals[it.group]) {
        groupTotals[it.group].directCost = groupTotals[it.group].directCost.plus(totalCostDec);
        groupTotals[it.group].salePrice = groupTotals[it.group].salePrice.plus(totalSaleDec);
      }

      return {
        id: it.id,
        lineId: input.lineId,
        code: it.code,
        name: it.name,
        group: it.group,
        cipCode: it.cipCode,
        costSource: it.costSource,
        quantity: qtyDec.toFixed(2),
        unit: it.unit,
        unitDirectCost: unitCostDec.toFixed(2),
        totalDirectCost: totalCostDec.toFixed(2),
        bdiPercentage: bdiDec.toFixed(2),
        unitSalePrice: unitSaleDec.toFixed(2),
        totalSalePrice: totalSaleDec.toFixed(2),
        notes: it.notes,
      };
    });

    const ratios: ServiceRatios = {
      costPerKm: lineLengthDec.isZero() ? '0.00' : totalDirectCostDec.dividedBy(lineLengthDec).toFixed(2),
      costPerTower: totalTowersDec.isZero() ? '0.00' : totalDirectCostDec.dividedBy(totalTowersDec).toFixed(2),
      salePricePerKm: lineLengthDec.isZero() ? '0.00' : totalSalePriceDec.dividedBy(lineLengthDec).toFixed(2),
      salePricePerTower: totalTowersDec.isZero() ? '0.00' : totalSalePriceDec.dividedBy(totalTowersDec).toFixed(2),
    };

    const byGroup: Record<
      ServiceGroup,
      {
        totalDirectCost: string;
        totalSalePrice: string;
        costPerKm: string;
        costPerTower: string;
      }
    > = {} as any;

    for (const g of groups) {
      const gDirect = groupTotals[g].directCost;
      const gSale = groupTotals[g].salePrice;
      byGroup[g] = {
        totalDirectCost: gDirect.toFixed(2),
        totalSalePrice: gSale.toFixed(2),
        costPerKm: lineLengthDec.isZero() ? '0.00' : gDirect.dividedBy(lineLengthDec).toFixed(2),
        costPerTower: totalTowersDec.isZero() ? '0.00' : gDirect.dividedBy(totalTowersDec).toFixed(2),
      };
    }

    return {
      lineId: input.lineId,
      lineName: input.lineName,
      lineLengthKm: lineLengthDec.toFixed(2),
      totalTowers: input.totalTowers,
      items: calculatedItems,
      totalDirectCost: totalDirectCostDec.toFixed(2),
      totalSalePrice: totalSalePriceDec.toFixed(2),
      ratios,
      byGroup,
    };
  }
}
