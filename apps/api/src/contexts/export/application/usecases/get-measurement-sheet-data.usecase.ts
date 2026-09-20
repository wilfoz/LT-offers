import { Inject, Injectable } from '@nestjs/common';
import {
  MeasurementSheetExportData,
  MeasurementSheetRow,
} from '@lt-offers/domain';
import { EconomicsFacadeService } from '../../../economics';
import {
  EXPORT_DATA_QUERY_PORT_TOKEN,
  ExportDataQueryPort,
  OfferExportNotFoundException,
} from '../../domain';

@Injectable()
export class GetMeasurementSheetDataUseCase {
  constructor(
    @Inject(EXPORT_DATA_QUERY_PORT_TOKEN)
    private readonly queryPort: ExportDataQueryPort,
    private readonly economicsFacade: EconomicsFacadeService,
  ) {}

  /**
   * Constrói os dados da Folha de Medição Contratual e Preços Unitários (RF-48).
   */
  async execute(offerId: number): Promise<MeasurementSheetExportData> {
    const offer = await this.queryPort.findOfferExportData(offerId);
    if (!offer) {
      throw new OfferExportNotFoundException(offerId);
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
        unitPriceWithTax: (totalSale * 0.5).toFixed(2),
        totalContractPrice: (totalSale * 0.5).toFixed(2),
      },
    ];

    const totalContractAmount = items
      .reduce((sum, item) => sum + Number(item.totalContractPrice), 0)
      .toFixed(2);

    return {
      offerId: String(offerId),
      offerName: offer.name || `Proposta #${offerId}`,
      revisionNumber: offer.revisionNumber,
      generatedAt: new Date().toISOString(),
      items,
      totalContractAmount,
    };
  }
}
