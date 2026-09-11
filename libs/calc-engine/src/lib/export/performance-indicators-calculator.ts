import { DecimalValue } from '../decimal-value';
import {
  PerformanceIndicators,
  PerformanceIndicatorsSummary,
} from '@lt-offers/domain';

export interface LinePerformanceData {
  lineId?: string;
  lineName?: string;
  lengthKm: string | number;
  towerCount: number;
  totalSalePrice: string | number;
  suppliesSalePrice?: string | number;
  servicesSalePrice?: string | number;
  totalConcreteVolumeM3?: string | number;
  totalSteelWeightTons?: string | number;
}

export interface PerformanceIndicatorsCalculatorInput {
  offerId: string;
  lines: LinePerformanceData[];
}

/**
 * Calculador de Indicadores Sintéticos de Performance e Benchmarking (RF-49, M09).
 * R$/km, R$/torre, t/km de aço, m³/km de concreto, densidade de estruturas e vão médio.
 */
export class PerformanceIndicatorsCalculator {
  /**
   * Calcula os indicadores sintéticos para uma linha específica.
   */
  static calculateLine(line: LinePerformanceData): PerformanceIndicators {
    const length = DecimalValue.of(line.lengthKm || 0);
    const towers = line.towerCount || 0;
    const towerDec = DecimalValue.of(towers);
    const totalPrice = DecimalValue.of(line.totalSalePrice || 0);
    const suppliesPrice = DecimalValue.of(line.suppliesSalePrice || 0);
    const servicesPrice = DecimalValue.of(line.servicesSalePrice || 0);
    const concreteM3 = DecimalValue.of(line.totalConcreteVolumeM3 || 0);
    const steelTons = DecimalValue.of(line.totalSteelWeightTons || 0);

    const hasLength = length.greaterThan(DecimalValue.zero());
    const hasTowers = towers > 0;

    const costPerKm = hasLength
      ? totalPrice.dividedBy(length).toFixed(2)
      : '0.00';
    const costPerTower = hasTowers
      ? totalPrice.dividedBy(towerDec).toFixed(2)
      : '0.00';

    const suppliesCostPerKm = hasLength
      ? suppliesPrice.dividedBy(length).toFixed(2)
      : '0.00';
    const suppliesCostPerTower = hasTowers
      ? suppliesPrice.dividedBy(towerDec).toFixed(2)
      : '0.00';

    const servicesCostPerKm = hasLength
      ? servicesPrice.dividedBy(length).toFixed(2)
      : '0.00';
    const servicesCostPerTower = hasTowers
      ? servicesPrice.dividedBy(towerDec).toFixed(2)
      : '0.00';

    const structuresDensityPerKm = hasLength
      ? towerDec.dividedBy(length).toFixed(2)
      : '0.00';

    let averageSpanMeters = '0.00';
    if (hasLength && towers > 1) {
      const spanCount = DecimalValue.of(towers - 1);
      averageSpanMeters = length
        .times(DecimalValue.of(1000))
        .dividedBy(spanCount)
        .toFixed(2);
    } else if (hasLength && towers === 1) {
      averageSpanMeters = length.times(DecimalValue.of(1000)).toFixed(2);
    }

    const concretePerKm = hasLength
      ? concreteM3.dividedBy(length).toFixed(2)
      : '0.00';
    const concretePerTower = hasTowers
      ? concreteM3.dividedBy(towerDec).toFixed(2)
      : '0.00';

    const steelPerKm = hasLength
      ? steelTons.dividedBy(length).toFixed(2)
      : '0.00';
    const steelPerTower = hasTowers
      ? steelTons.dividedBy(towerDec).toFixed(2)
      : '0.00';

    return {
      lineId: line.lineId,
      lineName: line.lineName,
      lengthKm: length.toFixed(2),
      towerCount: towers,
      costPerKm,
      costPerTower,
      suppliesCostPerKm,
      suppliesCostPerTower,
      servicesCostPerKm,
      servicesCostPerTower,
      structuresDensityPerKm,
      averageSpanMeters,
      concretePerKm,
      concretePerTower,
      steelPerKm,
      steelPerTower,
    };
  }

  /**
   * Consolida os indicadores para todas as linhas e gera o sumário consolidado da oferta (RF-49).
   */
  static calculateSummary(
    input: PerformanceIndicatorsCalculatorInput,
  ): PerformanceIndicatorsSummary {
    const byLine = input.lines.map((line) => this.calculateLine(line));

    let totalLength = DecimalValue.zero();
    let totalTowers = 0;
    let totalPrice = DecimalValue.zero();
    let totalSupplies = DecimalValue.zero();
    let totalServices = DecimalValue.zero();
    let totalConcrete = DecimalValue.zero();
    let totalSteel = DecimalValue.zero();

    for (const line of input.lines) {
      totalLength = totalLength.plus(DecimalValue.of(line.lengthKm || 0));
      totalTowers += line.towerCount || 0;
      totalPrice = totalPrice.plus(DecimalValue.of(line.totalSalePrice || 0));
      totalSupplies = totalSupplies.plus(
        DecimalValue.of(line.suppliesSalePrice || 0),
      );
      totalServices = totalServices.plus(
        DecimalValue.of(line.servicesSalePrice || 0),
      );
      totalConcrete = totalConcrete.plus(
        DecimalValue.of(line.totalConcreteVolumeM3 || 0),
      );
      totalSteel = totalSteel.plus(
        DecimalValue.of(line.totalSteelWeightTons || 0),
      );
    }

    const consolidatedLine: LinePerformanceData = {
      lineName: 'Consolidado da Proposta',
      lengthKm: totalLength.toText(),
      towerCount: totalTowers,
      totalSalePrice: totalPrice.toText(),
      suppliesSalePrice: totalSupplies.toText(),
      servicesSalePrice: totalServices.toText(),
      totalConcreteVolumeM3: totalConcrete.toText(),
      totalSteelWeightTons: totalSteel.toText(),
    };

    const consolidated = this.calculateLine(consolidatedLine);

    return {
      offerId: input.offerId,
      consolidated,
      byLine,
    };
  }
}
