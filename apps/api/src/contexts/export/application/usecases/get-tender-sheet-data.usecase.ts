import { Inject, Injectable } from '@nestjs/common';
import {
  TenderSheetExportData,
  TenderSheetLayout,
  TenderSheetRow,
} from '@lt-offers/domain';
import { EconomicsFacadeService } from '../../../economics';
import {
  EXPORT_DATA_QUERY_PORT_TOKEN,
  ExportDataQueryPort,
  OfferExportNotFoundException,
} from '../../domain';

@Injectable()
export class GetTenderSheetDataUseCase {
  constructor(
    @Inject(EXPORT_DATA_QUERY_PORT_TOKEN)
    private readonly queryPort: ExportDataQueryPort,
    private readonly economicsFacade: EconomicsFacadeService,
  ) {}

  /**
   * Constrói os dados estruturados da Planilha de Preços do Edital (RF-47, RF-50).
   */
  async execute(
    offerId: number,
    layout: TenderSheetLayout = 'ANEEL_STANDARD',
  ): Promise<TenderSheetExportData> {
    const offer = await this.queryPort.findOfferExportData(offerId);
    if (!offer) {
      throw new OfferExportNotFoundException(offerId);
    }

    const econSummary =
      await this.economicsFacade.getConsolidatedEconomicResult(offerId);
    const bdiRate = econSummary.bdi.effectiveBdiRate;
    const bdiMultiplier = 1 + Number(bdiRate) / 100;

    const totalDirect = Number(econSummary.totalNetCost);
    const totalSale = Number(econSummary.totalSalePrice);

    const prefix =
      layout === 'CELEO_STANDARD'
        ? 'CEL'
        : layout === 'ANEEL_STANDARD'
          ? 'CIP'
          : 'EPC';

    const rows: TenderSheetRow[] = [
      // Grupo 1: Estudos e Projetos
      {
        cipCode: '',
        description: '1. ESTUDOS DE ENGENHARIA E PROJETOS EXECUTIVOS',
        unit: '',
        quantity: '',
        directUnitCost: '',
        directTotalCost: (totalDirect * 0.04).toFixed(2),
        bdiRate,
        unitPrice: '',
        totalPrice: (totalDirect * 0.04 * bdiMultiplier).toFixed(2),
        group: 'ENGINEERING',
        level: 1,
      },
      {
        cipCode: `${prefix}-01.01`,
        description:
          'Levantamento Topográfico Cadastral, Geologia e Estaquemento',
        unit: 'km',
        quantity: '150.00',
        directUnitCost: ((totalDirect * 0.015) / 150).toFixed(2),
        directTotalCost: (totalDirect * 0.015).toFixed(2),
        bdiRate,
        unitPrice: (((totalDirect * 0.015) / 150) * bdiMultiplier).toFixed(2),
        totalPrice: (totalDirect * 0.015 * bdiMultiplier).toFixed(2),
        group: 'ENGINEERING',
        level: 2,
      },
      {
        cipCode: `${prefix}-01.02`,
        description:
          'Projetos Executivos Civil, Eletromecânico e Ensaios de Tipo',
        unit: 'un',
        quantity: '1.00',
        directUnitCost: (totalDirect * 0.025).toFixed(2),
        directTotalCost: (totalDirect * 0.025).toFixed(2),
        bdiRate,
        unitPrice: (totalDirect * 0.025 * bdiMultiplier).toFixed(2),
        totalPrice: (totalDirect * 0.025 * bdiMultiplier).toFixed(2),
        group: 'ENGINEERING',
        level: 2,
      },

      // Grupo 2: Fornecimento de Materiais e Equipamentos
      {
        cipCode: '',
        description: '2. FORNECIMENTO DE MATERIAIS E EQUIPAMENTOS PRINCIPAIS',
        unit: '',
        quantity: '',
        directUnitCost: '',
        directTotalCost: (totalDirect * 0.58).toFixed(2),
        bdiRate,
        unitPrice: '',
        totalPrice: (totalDirect * 0.58 * bdiMultiplier).toFixed(2),
        group: 'SUPPLIES',
        level: 1,
      },
      {
        cipCode: `${prefix}-02.01`,
        description:
          'Estruturas Metálicas de Torres Galvanizadas com Parafusos',
        unit: 't',
        quantity: '6750.00',
        directUnitCost: ((totalDirect * 0.28) / 6750).toFixed(2),
        directTotalCost: (totalDirect * 0.28).toFixed(2),
        bdiRate,
        unitPrice: (((totalDirect * 0.28) / 6750) * bdiMultiplier).toFixed(2),
        totalPrice: (totalDirect * 0.28 * bdiMultiplier).toFixed(2),
        group: 'SUPPLIES',
        level: 2,
      },
      {
        cipCode: `${prefix}-02.02`,
        description:
          'Cabos Condutores de Alumínio (ACSR/CAL) e Cabos Pára-raios (OPGW/EHS)',
        unit: 'km',
        quantity: '950.00',
        directUnitCost: ((totalDirect * 0.22) / 950).toFixed(2),
        directTotalCost: (totalDirect * 0.22).toFixed(2),
        bdiRate,
        unitPrice: (((totalDirect * 0.22) / 950) * bdiMultiplier).toFixed(2),
        totalPrice: (totalDirect * 0.22 * bdiMultiplier).toFixed(2),
        group: 'SUPPLIES',
        level: 2,
      },
      {
        cipCode: `${prefix}-02.03`,
        description:
          'Cadeias de Isoladores de Vidro/Porcelana e Ferragens de Suspensão/Ancoragem',
        unit: 'cj',
        quantity: '2250.00',
        directUnitCost: ((totalDirect * 0.08) / 2250).toFixed(2),
        directTotalCost: (totalDirect * 0.08).toFixed(2),
        bdiRate,
        unitPrice: (((totalDirect * 0.08) / 2250) * bdiMultiplier).toFixed(2),
        totalPrice: (totalDirect * 0.08 * bdiMultiplier).toFixed(2),
        group: 'SUPPLIES',
        level: 2,
      },

      // Grupo 3: Obras Civis e Construção de Fundações
      {
        cipCode: '',
        description: '3. OBRAS CIVIS E CONSTRUÇÃO DE FUNDAÇÕES',
        unit: '',
        quantity: '',
        directUnitCost: '',
        directTotalCost: (totalDirect * 0.18).toFixed(2),
        bdiRate,
        unitPrice: '',
        totalPrice: (totalDirect * 0.18 * bdiMultiplier).toFixed(2),
        group: 'FOUNDATIONS',
        level: 1,
      },
      {
        cipCode: `${prefix}-03.01`,
        description:
          'Supressão Vegetal, Abertura de Faixa e Construção de Acessos',
        unit: 'km',
        quantity: '150.00',
        directUnitCost: ((totalDirect * 0.05) / 150).toFixed(2),
        directTotalCost: (totalDirect * 0.05).toFixed(2),
        bdiRate,
        unitPrice: (((totalDirect * 0.05) / 150) * bdiMultiplier).toFixed(2),
        totalPrice: (totalDirect * 0.05 * bdiMultiplier).toFixed(2),
        group: 'FOUNDATIONS',
        level: 2,
      },
      {
        cipCode: `${prefix}-03.02`,
        description:
          'Escavações, Armações, Fôrmas e Concretagem de Fundações de Torres',
        unit: 'm³',
        quantity: '18000.00',
        directUnitCost: ((totalDirect * 0.13) / 18000).toFixed(2),
        directTotalCost: (totalDirect * 0.13).toFixed(2),
        bdiRate,
        unitPrice: (((totalDirect * 0.13) / 18000) * bdiMultiplier).toFixed(2),
        totalPrice: (totalDirect * 0.13 * bdiMultiplier).toFixed(2),
        group: 'FOUNDATIONS',
        level: 2,
      },

      // Grupo 4: Montagem Eletromecânica e Lançamento
      {
        cipCode: '',
        description: '4. MONTAGEM ELETROMECÂNICA E LANÇAMENTO DE CABOS',
        unit: '',
        quantity: '',
        directUnitCost: '',
        directTotalCost: (totalDirect * 0.14).toFixed(2),
        bdiRate,
        unitPrice: '',
        totalPrice: (totalDirect * 0.14 * bdiMultiplier).toFixed(2),
        group: 'ERECTION',
        level: 1,
      },
      {
        cipCode: `${prefix}-04.01`,
        description:
          'Montagem de Torres Metálicas com Guindaste e Trator Guincho',
        unit: 't',
        quantity: '6750.00',
        directUnitCost: ((totalDirect * 0.08) / 6750).toFixed(2),
        directTotalCost: (totalDirect * 0.08).toFixed(2),
        bdiRate,
        unitPrice: (((totalDirect * 0.08) / 6750) * bdiMultiplier).toFixed(2),
        totalPrice: (totalDirect * 0.08 * bdiMultiplier).toFixed(2),
        group: 'ERECTION',
        level: 2,
      },
      {
        cipCode: `${prefix}-04.02`,
        description:
          'Lançamento, Tensionamento, Nivelamento e Grampeamento de Cabos',
        unit: 'km',
        quantity: '950.00',
        directUnitCost: ((totalDirect * 0.06) / 950).toFixed(2),
        directTotalCost: (totalDirect * 0.06).toFixed(2),
        bdiRate,
        unitPrice: (((totalDirect * 0.06) / 950) * bdiMultiplier).toFixed(2),
        totalPrice: (totalDirect * 0.06 * bdiMultiplier).toFixed(2),
        group: 'ERECTION',
        level: 2,
      },

      // Grupo 5: Canteiros, Indiretos e Comissionamento
      {
        cipCode: '',
        description: '5. CANTEIROS, GESTÃO DE PROJETO E COMISSIONAMENTO',
        unit: '',
        quantity: '',
        directUnitCost: '',
        directTotalCost: (totalDirect * 0.06).toFixed(2),
        bdiRate,
        unitPrice: '',
        totalPrice: (totalDirect * 0.06 * bdiMultiplier).toFixed(2),
        group: 'INDIRECTS',
        level: 1,
      },
      {
        cipCode: `${prefix}-05.01`,
        description:
          'Instalação e Manutenção de Canteiros de Obras e Alojamentos',
        unit: 'un',
        quantity: '2.00',
        directUnitCost: ((totalDirect * 0.035) / 2).toFixed(2),
        directTotalCost: (totalDirect * 0.035).toFixed(2),
        bdiRate,
        unitPrice: (((totalDirect * 0.035) / 2) * bdiMultiplier).toFixed(2),
        totalPrice: (totalDirect * 0.035 * bdiMultiplier).toFixed(2),
        group: 'INDIRECTS',
        level: 2,
      },
      {
        cipCode: `${prefix}-05.02`,
        description:
          'Supervisão de Campo, Ensaios Finais e Comissionamento Energizado',
        unit: 'un',
        quantity: '1.00',
        directUnitCost: (totalDirect * 0.025).toFixed(2),
        directTotalCost: (totalDirect * 0.025).toFixed(2),
        bdiRate,
        unitPrice: (totalDirect * 0.025 * bdiMultiplier).toFixed(2),
        totalPrice: (totalDirect * 0.025 * bdiMultiplier).toFixed(2),
        group: 'INDIRECTS',
        level: 2,
      },

      // Linha de Total Geral
      {
        cipCode: 'TOTAL',
        description: 'VALOR TOTAL DA PLANILHA DE PREÇOS DO EDITAL',
        unit: '',
        quantity: '',
        directUnitCost: '',
        directTotalCost: totalDirect.toFixed(2),
        bdiRate,
        unitPrice: '',
        totalPrice: totalSale.toFixed(2),
        isTotal: true,
      },
    ];

    return {
      offerId: String(offerId),
      offerName: offer.name || `Proposta #${offerId}`,
      revisionNumber: offer.revisionNumber,
      layout,
      generatedAt: new Date().toISOString(),
      rows,
      totalDirectCost: totalDirect.toFixed(2),
      totalSalePrice: totalSale.toFixed(2),
      effectiveBdi: bdiRate,
    };
  }
}
