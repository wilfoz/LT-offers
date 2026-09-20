import { Inject, Injectable } from '@nestjs/common';
import { ServiceBudgetSummary } from '@lt-offers/domain';
import {
  ServiceBudgetCalculator,
  ServiceItemCalculationInput,
} from '@lt-offers/calc-engine';
import {
  ECONOMICS_DATA_QUERY_PORT_TOKEN,
  EconomicsDataQueryPort,
  EconomicsLineNotFoundException,
} from '../../domain';

@Injectable()
export class GetLineServiceBudgetUseCase {
  constructor(
    @Inject(ECONOMICS_DATA_QUERY_PORT_TOKEN)
    private readonly economicsData: EconomicsDataQueryPort,
  ) {}

  /**
   * Orçamento de serviços da linha (M09): itens paramétricos por grupo CIP
   * delegados ao ServiceBudgetCalculator do motor.
   */
  async execute(lineId: number): Promise<ServiceBudgetSummary> {
    const line = await this.economicsData.findLineEconomicsData(lineId);

    if (!line) {
      throw new EconomicsLineNotFoundException(lineId);
    }

    const lengthKm = Number(line.refinedLengthKm || line.reportLengthKm || 100);
    const totalTowers = Math.max(1, Math.round(lengthKm * 2.5));

    const itemsInput: ServiceItemCalculationInput[] = [
      {
        id: `srv-prelim-${lineId}`,
        code: 'SRV_PRELIM_01',
        name: 'Acessos e Supressão Vegetal da Faixa de Servidão',
        group: 'PRELIMINARY_WORKS',
        cipCode: 'GR01.01.01',
        costSource: 'SUBCONTRACT_QUOTED',
        quantity: lengthKm,
        unit: 'km',
        unitDirectCost: '18500.00',
        bdiPercentage: '24.50',
        notes: 'Abertura de acessos e limpeza de faixa mecanizada',
      },
      {
        id: `srv-civil-${lineId}`,
        code: 'SRV_CIVIL_01',
        name: 'Escavação, Armação, Formas e Concretagem de Fundações',
        group: 'CIVIL_WORKS',
        cipCode: 'GR01.02.01',
        costSource: 'SCHEDULE_DIRECT',
        quantity: totalTowers,
        unit: 'fundação',
        unitDirectCost: '22400.00',
        bdiPercentage: '24.50',
        notes: 'Fundações padrão tubulão/grelha calculadas em M05',
      },
      {
        id: `srv-assemb-${lineId}`,
        code: 'SRV_ASSEMB_01',
        name: 'Montagem Eletromecânica de Estruturas Metálicas',
        group: 'ASSEMBLY_WORKS',
        cipCode: 'GR02.01.01',
        costSource: 'SCHEDULE_DIRECT',
        quantity: totalTowers,
        unit: 'torre',
        unitDirectCost: '31500.00',
        bdiPercentage: '24.50',
        notes: 'Montagem de torres autoportantes e estaiadas',
      },
      {
        id: `srv-string-${lineId}`,
        code: 'SRV_STRING_01',
        name: 'Lançamento e Tensionamento de Cabos Condutores e OPGW',
        group: 'STRINGING_WORKS',
        cipCode: 'GR03.01.01',
        costSource: 'SCHEDULE_DIRECT',
        quantity: lengthKm,
        unit: 'km',
        unitDirectCost: '42000.00',
        bdiPercentage: '24.50',
        notes: 'Lançamento contínuo com freio e guincho tracionador',
      },
      {
        id: `srv-comm-${lineId}`,
        code: 'SRV_COMM_01',
        name: 'Ensaios Elétricos, Comissionamento e Energização',
        group: 'COMMISSIONING',
        cipCode: 'GR04.01.01',
        costSource: 'PARAMETRIC_ADJUSTED',
        quantity: 1,
        unit: 'gl',
        unitDirectCost: '450000.00',
        bdiPercentage: '24.50',
        notes: 'Testes de continuidade, isolamento e parâmetros elétricos',
      },
      {
        id: `srv-ind-${lineId}`,
        code: 'SRV_IND_01',
        name: 'Apoio de Canteiros, Topografia e Gestão de Campo',
        group: 'INDIRECTS_SUPPORT',
        cipCode: 'GR05.01.01',
        costSource: 'SCHEDULE_DIRECT',
        quantity: lengthKm,
        unit: 'km',
        unitDirectCost: '12000.00',
        bdiPercentage: '24.50',
        notes: 'Equipes de apoio topográfico e fiscalização',
      },
    ];

    return ServiceBudgetCalculator.calculateServiceBudget({
      lineId: String(lineId),
      lineName: line.name || `Linha de Transmissão ${lineId}`,
      lineLengthKm: lengthKm,
      totalTowers,
      defaultBdiPercentage: '24.50',
      items: itemsInput,
    });
  }
}
