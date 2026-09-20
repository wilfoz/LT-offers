import { Inject, Injectable } from '@nestjs/common';
import {
  LineMaterialPricingSummary,
  MaterialQuote,
  CommodityPricingConfig,
  TaxRegime,
  DestinationStateShare,
  FOUNDATION_QUANTITY_METADATA_MAP,
  FoundationVolumeQuantityField,
} from '@lt-offers/domain';
import {
  MaterialPricingCalculator,
  MaterialPricingInputItem,
} from '@lt-offers/calc-engine';
import { FoundationsFacadeService } from '../../../foundations';
import { TaxationFacadeService } from '../../../taxation';
import {
  PricingSimulationOptions,
  TransmissionLineNotFoundException,
  PRICING_DATA_QUERY_PORT_TOKEN,
  PricingDataQueryPort,
  QUOTES_QUERY_PORT_TOKEN,
  QuotesQueryPort,
} from '../../domain';

@Injectable()
export class CalculateLinePricingUseCase {
  constructor(
    @Inject(PRICING_DATA_QUERY_PORT_TOKEN)
    private readonly pricingDataQuery: PricingDataQueryPort,
    @Inject(QUOTES_QUERY_PORT_TOKEN)
    private readonly quotesQuery: QuotesQueryPort,
    private readonly foundationsFacade: FoundationsFacadeService,
    private readonly taxationFacade: TaxationFacadeService,
  ) {}

  /**
   * Consolida os preços, commodities e tributos de materiais para uma linha de transmissão (RF-28..RF-34).
   */
  async execute(
    lineId: number,
    options?: PricingSimulationOptions,
  ): Promise<LineMaterialPricingSummary> {
    const line = await this.pricingDataQuery.findLinePricingData(lineId);

    if (!line) {
      throw new TransmissionLineNotFoundException(lineId);
    }

    // 1. Destinos tributários da linha (RN-01, RN-05)
    const destinations: DestinationStateShare[] = [];
    if (line.destinationStatePrimary) {
      destinations.push({
        state: line.destinationStatePrimary,
        sharePercent: Number(line.destinationPercentagePrimary || 100),
      });
    }
    if (
      line.destinationStateSecondary &&
      Number(line.destinationPercentageSecondary || 0) > 0
    ) {
      destinations.push({
        state: line.destinationStateSecondary,
        sharePercent: Number(line.destinationPercentageSecondary),
      });
    }
    if (destinations.length === 0) {
      destinations.push({ state: 'MG', sharePercent: 100 });
    }

    // 2. Regime Tributário (RN-04)
    const taxRegime: TaxRegime = options?.taxRegime || 'STANDARD';

    // 3. Obter quantitativos de engenharia calculados da linha
    const lengthKm = Number(line.refinedLengthKm || line.reportLengthKm) || 100;
    const items = await this.buildMaterialPricingItems(
      line.id,
      lengthKm,
      options,
    );

    // 4. Montar mapa de cotações
    const quotesMap: Record<string, MaterialQuote> = {
      ...this.quotesQuery.findQuotesMap(),
    };
    if (options?.quotesOverrides) {
      for (const [code, override] of Object.entries(options.quotesOverrides)) {
        if (quotesMap[code]) {
          quotesMap[code] = { ...quotesMap[code], ...override };
        }
      }
    }

    // 5. Obter tabelas fiscais
    const icmsRulesMap = this.taxationFacade.getIcmsRulesMap();
    const ipiRulesMap = this.taxationFacade.getIpiRulesMap();
    const pisCofinsRule = this.taxationFacade.getPisCofinsRule(taxRegime);

    // 6. Executar cálculo determinístico
    return MaterialPricingCalculator.calculateLinePricing({
      lineId: String(line.id),
      lineName: line.name,
      taxRegime,
      destinations,
      items,
      quotesMap,
      defaultOriginState: 'SP',
      icmsRulesMap,
      ipiRulesMap,
      pisCofinsRule,
    });
  }

  /**
   * Constrói a lista de itens de materiais com quantidades físicas consolidadas.
   */
  private async buildMaterialPricingItems(
    lineId: number,
    lengthKm: number,
    options?: PricingSimulationOptions,
  ): Promise<MaterialPricingInputItem[]> {
    const items: MaterialPricingInputItem[] = [];

    // A. Quantitativos de Fundações de M05
    try {
      const foundationSummary =
        await this.foundationsFacade.getLineFoundationSummary(lineId);

      if (foundationSummary && foundationSummary.materials) {
        for (const item of foundationSummary.materials) {
          const qty = Number(item.totalQuantity);
          if (qty > 0) {
            const meta =
              FOUNDATION_QUANTITY_METADATA_MAP[
                item.field as FoundationVolumeQuantityField
              ];
            items.push({
              materialCode: meta?.code || item.field,
              materialName: item.name,
              family: item.family,
              unit: item.unit,
              quantity: qty,
              ncmCode: item.unit === 'kg' ? '7308.20.00' : undefined,
            });
          }
        }
      }
    } catch {
      // Fallback gracioso se fundações não tiverem sido calculadas ainda
    }

    // B. Materiais de Linha Principais (Estimativa paramétrica da LT)
    // 1. Aço de Torres (~25 toneladas por km)
    const towerWeightTons = Math.round(lengthKm * 25 * 100) / 100;
    items.push({
      materialCode: 'MAT-TOR-EST',
      materialName: 'Aço Estrutural para Torres Treliçadas Galvanizadas',
      family: 'Estruturas e Torres',
      unit: 't',
      quantity: towerWeightTons,
      ncmCode: '7308.20.00',
    });

    // 2. Condutores de Alumínio (~12 toneladas por km em 500 kV, vinculado a commodity)
    const conductorWeightTons = Math.round(lengthKm * 12 * 100) / 100;
    const lmeSpot = options?.spotLmeUsdPerTon ?? 2400;
    const midwestSpot = options?.spotMidwestPremiumUsdPerTon ?? 450;
    const fxSpot = options?.spotExchangeRateBrl ?? 5.5;

    const commodityConfig: CommodityPricingConfig = {
      commodityType: 'ALUMINUM',
      pricingMode: 'SPOT',
      spotLmeUsdPerTon: lmeSpot,
      spotMidwestPremiumUsdPerTon: midwestSpot,
      spotExchangeRateBrl: fxSpot,
      fabricationPremiumBrlPerTon: 3200,
    };

    items.push({
      materialCode: 'MAT-CAB-COND',
      materialName: 'Cabo Condutor de Alumínio CAA Drake 795 kcmil',
      family: 'Condutores',
      unit: 't',
      quantity: conductorWeightTons,
      ncmCode: '7614.10.10',
      isCommodityLinked: true,
      commodityConfig,
    });

    // 3. Cabo de Guarda OPGW (extensão + 5% sobrecomprimento)
    const opgwKm = Math.round(lengthKm * 1.05 * 100) / 100;
    items.push({
      materialCode: 'MAT-CAB-OPGW',
      materialName: 'Cabo de Guarda Óptico OPGW 48 Fibras',
      family: 'Cabos de Guarda',
      unit: 'km',
      quantity: opgwKm,
      ncmCode: '8544.70.10',
    });

    // 4. Isoladores de Vidro (~28 discos por km em 500 kV)
    const isolCount = Math.round(lengthKm * 28);
    items.push({
      materialCode: 'MAT-ISOL-VIDRO',
      materialName: 'Isolador de Vidro Temperado 120 kN',
      family: 'Isoladores',
      unit: 'un',
      quantity: isolCount,
      ncmCode: '8546.10.00',
    });

    // 5. Ferragens e Acessórios (~3 conjuntos por km)
    const ferrCount = Math.round(lengthKm * 3);
    items.push({
      materialCode: 'MAT-FERR-GRAMPO',
      materialName: 'Grampos e Ferragens de Suspensão/Ancoragem',
      family: 'Ferragens',
      unit: 'cj',
      quantity: ferrCount,
      ncmCode: '7326.90.90',
    });

    return items;
  }
}
