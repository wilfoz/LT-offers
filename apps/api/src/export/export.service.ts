import { Injectable, NotFoundException } from '@nestjs/common';
import {
  TenderSheetLayout,
  TenderSheetExportData,
  TenderSheetRow,
  MeasurementSheetExportData,
  MeasurementSheetRow,
  CashflowExportData,
  PerformanceIndicatorsSummary,
  FullOfferPackage,
} from '@lt-offers/domain';
import {
  PerformanceIndicatorsCalculator,
  LinePerformanceData,
} from '@lt-offers/calc-engine';
import { PrismaService } from '../app/prisma.service';
import { EconomicsFacadeService } from '../contexts/economics';
import { ExcelGeneratorService } from './excel-generator.service';

@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly economicsFacade: EconomicsFacadeService,
    private readonly excelGenerator: ExcelGeneratorService,
  ) {}

  /**
   * Obtém os indicadores sintéticos de desempenho e custo (RF-49).
   */
  async getPerformanceIndicators(
    offerId: number,
  ): Promise<PerformanceIndicatorsSummary> {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        revisions: {
          include: {
            transmissionLines: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException(`Oferta ID ${offerId} não encontrada.`);
    }

    const latestRevision =
      offer.revisions && offer.revisions.length > 0
        ? offer.revisions[offer.revisions.length - 1]
        : null;
    const lines =
      (latestRevision && (latestRevision as any).transmissionLines) || [];

    const lineInputs: LinePerformanceData[] = [];

    if (lines.length === 0) {
      // Linha default se não houver cadastro específico
      const econResult = await this.economicsFacade.getLineEconomicResult(1);
      lineInputs.push({
        lineId: '1',
        lineName: 'LT Padrão 500kV',
        lengthKm: 100,
        towerCount: 250,
        totalSalePrice: econResult.totalSalePrice,
        suppliesSalePrice: (Number(econResult.totalSalePrice) * 0.62).toFixed(
          2,
        ),
        servicesSalePrice: (Number(econResult.totalSalePrice) * 0.38).toFixed(
          2,
        ),
        totalConcreteVolumeM3: 12000,
        totalSteelWeightTons: 4500,
      });
    } else {
      for (const line of lines) {
        const lengthKm = Number(
          line.refinedLengthKm || line.reportLengthKm || 100,
        );
        const towerCount = Math.max(1, Math.round(lengthKm * 2.5));
        const econResult = await this.economicsFacade.getLineEconomicResult(
          line.id,
        );

        lineInputs.push({
          lineId: String(line.id),
          lineName: line.name || `Linha de Transmissão ${line.id}`,
          lengthKm,
          towerCount,
          totalSalePrice: econResult.totalSalePrice,
          suppliesSalePrice: (Number(econResult.totalSalePrice) * 0.62).toFixed(
            2,
          ),
          servicesSalePrice: (Number(econResult.totalSalePrice) * 0.38).toFixed(
            2,
          ),
          totalConcreteVolumeM3: Math.round(towerCount * 48),
          totalSteelWeightTons: Math.round(towerCount * 18),
        });
      }
    }

    return PerformanceIndicatorsCalculator.calculateSummary({
      offerId: String(offerId),
      lines: lineInputs,
    });
  }

  /**
   * Constrói os dados estruturados da Planilha de Preços do Edital (RF-47, RF-50).
   */
  async getTenderSheetData(
    offerId: number,
    layout: TenderSheetLayout = 'ANEEL_STANDARD',
  ): Promise<TenderSheetExportData> {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        revisions: {
          include: {
            transmissionLines: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException(`Oferta ID ${offerId} não encontrada.`);
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
      revisionNumber:
        offer.revisions && offer.revisions.length > 0
          ? offer.revisions[offer.revisions.length - 1].revisionNumber
          : 0,
      layout,
      generatedAt: new Date().toISOString(),
      rows,
      totalDirectCost: totalDirect.toFixed(2),
      totalSalePrice: totalSale.toFixed(2),
      effectiveBdi: bdiRate,
    };
  }

  /**
   * Constrói os dados da Folha de Medição Contratual e Preços Unitários (RF-48).
   */
  async getMeasurementSheetData(
    offerId: number,
  ): Promise<MeasurementSheetExportData> {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        revisions: true,
      },
    });

    if (!offer) {
      throw new NotFoundException(`Oferta ID ${offerId} não encontrada.`);
    }

    const econSummary =
      await this.economicsFacade.getConsolidatedEconomicResult(offerId);
    const totalSale = Number(econSummary.totalSalePrice);

    const items: MeasurementSheetRow[] = [
      {
        itemCode: 'M1 / PU1',
        discipline: 'TOPOGRAFIA',
        description:
          'Levantamento topográfico, cadastramento de proprietários e estaqueamento de torres',
        unit: 'km',
        contractQuantity: '150.00',
        measurementCriteria:
          'Extensão de diretriz estaqueada e aprovada pela fiscalização em campo',
        unitPriceWithTax: ((totalSale * 0.02) / 150).toFixed(2),
        totalContractPrice: (totalSale * 0.02).toFixed(2),
      },
      {
        itemCode: 'M2 / PU2',
        discipline: 'MEIO AMBIENTE',
        description:
          'Supressão vegetal, limpeza de praça de torre e abertura de acessos',
        unit: 'ha',
        contractQuantity: '450.00',
        measurementCriteria:
          'Área efetivamente suprimida com bota-fora e cercamento executados',
        unitPriceWithTax: ((totalSale * 0.04) / 450).toFixed(2),
        totalContractPrice: (totalSale * 0.04).toFixed(2),
      },
      {
        itemCode: 'M3 / PU3',
        discipline: 'CIVIL / FUNDAÇÕES',
        description:
          'Escavação manual e mecanizada para blocos e estacas de fundações',
        unit: 'm³',
        contractQuantity: '24500.00',
        measurementCriteria:
          'Volume geométrico teórico escavado conforme projeto executivo',
        unitPriceWithTax: ((totalSale * 0.03) / 24500).toFixed(2),
        totalContractPrice: (totalSale * 0.03).toFixed(2),
      },
      {
        itemCode: 'M4 / PU4',
        discipline: 'CIVIL / FUNDAÇÕES',
        description:
          'Concreto usinado fck >= 30 MPa lançado com cura úmida e fôrmas',
        unit: 'm³',
        contractQuantity: '18000.00',
        measurementCriteria:
          'Volume geométrico de concreto dosado lançado e com corpos de prova rompidos',
        unitPriceWithTax: ((totalSale * 0.12) / 18000).toFixed(2),
        totalContractPrice: (totalSale * 0.12).toFixed(2),
      },
      {
        itemCode: 'M5 / PU5',
        discipline: 'CIVIL / FUNDAÇÕES',
        description:
          'Armadura em aço CA-50 / CA-60 cortada, dobrada e posicionada em fundações',
        unit: 'kg',
        contractQuantity: '1450000.00',
        measurementCriteria:
          'Peso nominal de aço verificado nas fôrmas antes da concretagem',
        unitPriceWithTax: ((totalSale * 0.06) / 1450000).toFixed(2),
        totalContractPrice: (totalSale * 0.06).toFixed(2),
      },
      {
        itemCode: 'M6 / PU6',
        discipline: 'ELETROMECÂNICA',
        description:
          'Montagem e aperto de estruturas metálicas de torres autoportantes e estaiadas',
        unit: 't',
        contractQuantity: '6750.00',
        measurementCriteria:
          'Toneladas de torre completamente erguidas, aprumadas e com torque conferido',
        unitPriceWithTax: ((totalSale * 0.1) / 6750).toFixed(2),
        totalContractPrice: (totalSale * 0.1).toFixed(2),
      },
      {
        itemCode: 'M7 / PU7',
        discipline: 'ELETROMECÂNICA',
        description:
          'Lançamento, tensionamento e regulagem de flecha de cabos condutores de fase',
        unit: 'km-fase',
        contractQuantity: '950.00',
        measurementCriteria:
          'Extensão de fase puxada sob tração mecânica com grampeamento concluído',
        unitPriceWithTax: ((totalSale * 0.08) / 950).toFixed(2),
        totalContractPrice: (totalSale * 0.08).toFixed(2),
      },
      {
        itemCode: 'M8 / PU8',
        discipline: 'ELETROMECÂNICA',
        description:
          'Lançamento de cabo pára-raios OPGW com fusão óptica de fibras',
        unit: 'km',
        contractQuantity: '150.00',
        measurementCriteria:
          'Extensão lançada com relatório de reflectometria OTDR aprovado',
        unitPriceWithTax: ((totalSale * 0.03) / 150).toFixed(2),
        totalContractPrice: (totalSale * 0.03).toFixed(2),
      },
      {
        itemCode: 'M9 / PU9',
        discipline: 'ATERRAMENTO',
        description:
          'Instalação de malha e contra-pesos de aterramento de pé de torre',
        unit: 'un',
        contractQuantity: '375.00',
        measurementCriteria:
          'Pé de torre aterrado com resistência de aterramento homologada em laudo',
        unitPriceWithTax: ((totalSale * 0.02) / 375).toFixed(2),
        totalContractPrice: (totalSale * 0.02).toFixed(2),
      },
      {
        itemCode: 'M10 / PU10',
        discipline: 'COMISSIONAMENTO',
        description:
          'Ensaios elétricos finais, inspeção aérea e energização assistida',
        unit: 'un',
        contractQuantity: '1.00',
        measurementCriteria:
          'Emissão do Termo de Recebimento Provisório (TRP) e energização comercial',
        unitPriceWithTax: (totalSale * 0.5).toFixed(2), // Suprimentos agregados + entrega final
        totalContractPrice: (totalSale * 0.5).toFixed(2),
      },
    ];

    const totalContractAmount = items
      .reduce((sum, item) => sum + Number(item.totalContractPrice), 0)
      .toFixed(2);

    return {
      offerId: String(offerId),
      offerName: offer.name || `Proposta #${offerId}`,
      revisionNumber:
        offer.revisions && offer.revisions.length > 0
          ? offer.revisions[offer.revisions.length - 1].revisionNumber
          : 0,
      generatedAt: new Date().toISOString(),
      items,
      totalContractAmount,
    };
  }

  /**
   * Constrói os dados do Cronograma de Faturamento e Desembolso Mensal (RF-60).
   */
  async getCashflowExportData(offerId: number): Promise<CashflowExportData> {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { revisions: true },
    });

    if (!offer) {
      throw new NotFoundException(`Oferta ID ${offerId} não encontrada.`);
    }

    const cashflowSummary =
      await this.economicsFacade.getConsolidatedCashflow(offerId);

    const peakMonth = cashflowSummary.financialExposure?.peakMonth || 1;
    const peakAmount =
      cashflowSummary.financialExposure?.maxNegativeExposure || '0.00';

    const months = cashflowSummary.monthlyPoints.map((pt) => ({
      monthIndex: pt.month,
      monthLabel: `Mês ${String(pt.month).padStart(2, '0')}`,
      suppliesDisbursement: pt.materialsOutflow,
      servicesDisbursement: pt.servicesOutflow,
      indirectDisbursement: pt.indirectsOutflow,
      monthlyTotalDisbursement: pt.totalOutflow,
      accumulatedDisbursement: pt.accumulatedOutflow,
      monthlyBilling: pt.totalInflow,
      accumulatedBilling: pt.accumulatedInflow,
      netCashflow: pt.netMonthlyCashflow,
      isPeakExposure: pt.month === peakMonth,
    }));

    return {
      offerId: String(offerId),
      offerName: offer.name || `Proposta #${offerId}`,
      revisionNumber:
        offer.revisions && offer.revisions.length > 0
          ? offer.revisions[offer.revisions.length - 1].revisionNumber
          : 0,
      generatedAt: new Date().toISOString(),
      months,
      peakExposureMonth: peakMonth,
      peakExposureAmount: peakAmount,
      totalDisbursement: cashflowSummary.totalOutflow,
      totalBilling: cashflowSummary.totalInflow,
    };
  }

  /**
   * Constrói o Pacote Aberto Integral da Oferta em JSON (RNF-18).
   */
  async getFullOfferPackage(offerId: number): Promise<FullOfferPackage> {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        revisions: {
          include: {
            transmissionLines: true,
          },
        },
      },
    });

    if (!offer) {
      throw new NotFoundException(`Oferta ID ${offerId} não encontrada.`);
    }

    const latestRevision =
      offer.revisions && offer.revisions.length > 0
        ? offer.revisions[offer.revisions.length - 1]
        : null;
    const lines =
      (latestRevision && (latestRevision as any).transmissionLines) || [];

    const performanceIndicators = await this.getPerformanceIndicators(offerId);
    const econSummary =
      await this.economicsFacade.getConsolidatedEconomicResult(offerId);
    const cashflowSummary =
      await this.economicsFacade.getConsolidatedCashflow(offerId);

    return {
      metadata: {
        exportTimestamp: new Date().toISOString(),
        version: '1.0.0',
        schemaVersion: 'open-lt-offer-v1',
        exportedBy: 'LT-Offers System',
      },
      offer: {
        id: offer.id,
        name: offer.name,
        code: (offer as any).code || `PROP-${offer.id}`,
        client: (offer as any).client || 'Concessionária Transmissão',
        createdAt: offer.createdAt,
      },
      transmissionLines: lines.map((l: any) => ({
        id: l.id,
        name: l.name,
        voltageKv: l.voltageKv || 500,
        lengthKm: Number(l.refinedLengthKm || l.reportLengthKm || 100),
      })),
      staking: [],
      pricingSummary: econSummary as unknown as Record<string, unknown>,
      bdiParameters: (econSummary.coefficients || {}) as unknown as Record<
        string,
        unknown
      >,
      cashflow: cashflowSummary as unknown as Record<string, unknown>,
      risks: [],
      governance: {
        approvalStatus: 'IN_REVIEW',
      },
      performanceIndicators,
    };
  }

  /**
   * Exporta a Planilha de Preços do Edital em Buffer binário XLSX.
   */
  async exportTenderSheet(
    offerId: number,
    layout: TenderSheetLayout = 'ANEEL_STANDARD',
  ): Promise<Buffer> {
    const data = await this.getTenderSheetData(offerId, layout);
    return this.excelGenerator.generateTenderSheet(data);
  }

  /**
   * Exporta a Folha de Medição Contratual em Buffer binário XLSX.
   */
  async exportMeasurementSheet(offerId: number): Promise<Buffer> {
    const data = await this.getMeasurementSheetData(offerId);
    return this.excelGenerator.generateMeasurementSheet(data);
  }

  /**
   * Exporta o Cronograma de Faturamento e Desembolso em Buffer binário XLSX.
   */
  async exportCashflowSheet(offerId: number): Promise<Buffer> {
    const data = await this.getCashflowExportData(offerId);
    return this.excelGenerator.generateCashflowSheet(data);
  }
}
