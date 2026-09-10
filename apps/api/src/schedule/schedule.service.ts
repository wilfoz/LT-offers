import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ScheduleSummary,
  CampCostSummary,
  MilestoneContract,
  CampDefinition,
} from '@lt-offers/domain';
import {
  ScheduleCalculator,
  CampCalculator,
} from '@lt-offers/calc-engine';
import { PrismaService } from '../app/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async getLineSchedule(lineId: number): Promise<ScheduleSummary> {
    const line = await this.prisma.transmissionLine.findUnique({
      where: { id: lineId },
      include: {
        offerRevision: {
          include: {
            offer: true,
          },
        },
      },
    });

    if (!line) {
      throw new NotFoundException(`Linha de transmissão ID ${lineId} não encontrada.`);
    }

    const lengthKm = Number(line.refinedLengthKm || line.reportLengthKm || 100);
    const totalTowers = Math.max(1, Math.round(lengthKm * 2.5));
    const uf = 'MG'; // UF padrão de referência da proposta

    const milestones: MilestoneContract[] = [
      {
        id: `ms-li-${lineId}`,
        code: 'LI',
        name: 'Licença de Instalação (LI)',
        targetMonth: 2,
        isMandatory: true,
        description: 'Condição precedente obrigatória para obras de campo',
      },
      {
        id: `ms-lo-${lineId}`,
        code: 'LO',
        name: 'Entrada em Operação Comercial (LO)',
        targetMonth: 18,
        isMandatory: true,
        description: 'Marco final de comissionamento e faturamento',
      },
    ];

    const activitiesInput = [
      {
        id: `act-ind-${lineId}`,
        code: 'ACT-01-IND',
        name: 'Gestão, Engenharia e Apoio Indireto',
        group: 'INDIRECTS' as const,
        quantitySource: 'MANUAL' as const,
        totalQuantity: '18.00',
        quantityUnit: 'meses',
        crewCount: 1,
        nominalMonthlyProductionPerCrew: '1.00',
        startMonth: 1,
        durationMonths: 18,
        monthlyCostPerCrew: '65000.00',
        mobilizationCostPerCrew: '25000.00',
        demobilizationCostPerCrew: '15000.00',
      },
      {
        id: `act-prelim-${lineId}`,
        code: 'ACT-02-PRELIM',
        name: 'Abertura de Acessos e Limpeza de Faixa',
        group: 'PRELIMINARIES' as const,
        quantitySource: 'ROW_CLEARING_HA' as const,
        totalQuantity: (lengthKm * 5).toFixed(2), // 5 ha/km
        quantityUnit: 'ha',
        assignedCrewId: 1,
        assignedCrewName: 'Equipe de Terraplenagem e Desmatamento',
        crewCount: 2,
        nominalMonthlyProductionPerCrew: '45.00',
        maxMonthlyProductionPerCrew: '60.00',
        startMonth: 2,
        monthlyCostPerCrew: '75000.00',
        mobilizationCostPerCrew: '35000.00',
        demobilizationCostPerCrew: '20000.00',
      },
      {
        id: `act-civil-${lineId}`,
        code: 'ACT-03-CIVIL',
        name: 'Escavação, Armação e Concretagem de Fundações',
        group: 'CIVIL_WORKS' as const,
        quantitySource: 'TOTAL_FOUNDATIONS' as const,
        totalQuantity: totalTowers.toFixed(2),
        quantityUnit: 'torres',
        assignedCrewId: 2,
        assignedCrewName: 'Equipe de Obras Civis e Fundações',
        crewCount: 3,
        nominalMonthlyProductionPerCrew: '12.00',
        maxMonthlyProductionPerCrew: '18.00',
        startMonth: 3,
        monthlyCostPerCrew: '85000.00',
        mobilizationCostPerCrew: '40000.00',
        demobilizationCostPerCrew: '25000.00',
      },
      {
        id: `act-erect-${lineId}`,
        code: 'ACT-04-ERECT',
        name: 'Montagem Eletromecânica de Torres e Acessórios',
        group: 'TOWER_ERECTION' as const,
        quantitySource: 'TOTAL_TOWERS' as const,
        totalQuantity: totalTowers.toFixed(2),
        quantityUnit: 'torres',
        assignedCrewId: 3,
        assignedCrewName: 'Equipe de Montagem Pesada',
        crewCount: 2,
        nominalMonthlyProductionPerCrew: '15.00',
        maxMonthlyProductionPerCrew: '20.00',
        startMonth: 6,
        monthlyCostPerCrew: '95000.00',
        mobilizationCostPerCrew: '50000.00',
        demobilizationCostPerCrew: '30000.00',
      },
      {
        id: `act-string-${lineId}`,
        code: 'ACT-05-STRING',
        name: 'Lançamento de Cabos Condutores e OPGW',
        group: 'STRINGING' as const,
        quantitySource: 'CONDUCTOR_KM' as const,
        totalQuantity: lengthKm.toFixed(2),
        quantityUnit: 'km',
        assignedCrewId: 4,
        assignedCrewName: 'Equipe de Lançamento e Tensionamento',
        crewCount: 2,
        nominalMonthlyProductionPerCrew: '15.00',
        maxMonthlyProductionPerCrew: '22.00',
        startMonth: 10,
        monthlyCostPerCrew: '120000.00',
        mobilizationCostPerCrew: '60000.00',
        demobilizationCostPerCrew: '35000.00',
      },
      {
        id: `act-comm-${lineId}`,
        code: 'ACT-06-COMM',
        name: 'Ensaios Elétricos, Comissionamento e Energização',
        group: 'COMMISSIONING' as const,
        quantitySource: 'MANUAL' as const,
        totalQuantity: '1.00',
        quantityUnit: 'seção',
        assignedCrewId: 5,
        assignedCrewName: 'Equipe Especializada de Ensaios e Comissionamento',
        crewCount: 1,
        nominalMonthlyProductionPerCrew: '1.00',
        startMonth: 16,
        durationMonths: 2,
        monthlyCostPerCrew: '90000.00',
        mobilizationCostPerCrew: '20000.00',
        demobilizationCostPerCrew: '15000.00',
      },
    ];

    return ScheduleCalculator.calculateSchedule({
      lineId,
      lineName: line.name || `Linha ID ${lineId}`,
      uf,
      startMonth: 1,
      activities: activitiesInput,
      milestones,
    });
  }

  async getLineCamps(lineId: number): Promise<CampCostSummary> {
    const line = await this.prisma.transmissionLine.findUnique({
      where: { id: lineId },
    });

    if (!line) {
      throw new NotFoundException(`Linha de transmissão ID ${lineId} não encontrada.`);
    }

    const rawCamps: Omit<CampDefinition, 'totalPersonnelMonthlyCost' | 'totalMonthlyCost' | 'totalCampCost'>[] = [
      {
        id: `camp-central-${lineId}`,
        lineId,
        code: 'CP-CENTRAL',
        name: 'Canteiro Central de Obra e Alojamento Principal',
        type: 'CENTRAL',
        locationKm: '35.00',
        startMonth: 1,
        durationMonths: 18,
        endMonth: 18,
        implementationCost: '350000.00',
        fixedMonthlyCost: '75000.00',
        demobilizationCost: '110000.00',
        personnel: [
          {
            laborRoleId: 1,
            laborRoleCode: 'ENG-RES',
            laborRoleName: 'Engenheiro Residente',
            quantity: 1,
            monthlyUnitCost: '22000.00',
            totalMonthlyCost: '22000.00',
          },
          {
            laborRoleId: 2,
            laborRoleCode: 'TEC-SEG',
            laborRoleName: 'Técnico de Segurança do Trabalho',
            quantity: 2,
            monthlyUnitCost: '8500.00',
            totalMonthlyCost: '17000.00',
          },
          {
            laborRoleId: 3,
            laborRoleCode: 'ALMOX',
            laborRoleName: 'Almoxarife / Fiel de Pátio',
            quantity: 2,
            monthlyUnitCost: '6000.00',
            totalMonthlyCost: '12000.00',
          },
        ],
      },
      {
        id: `camp-adv1-${lineId}`,
        lineId,
        code: 'CP-ADV-01',
        name: 'Canteiro Avançado - Trecho Norte',
        type: 'ADVANCED',
        locationKm: '80.00',
        startMonth: 4,
        durationMonths: 8,
        endMonth: 11,
        implementationCost: '85000.00',
        fixedMonthlyCost: '25000.00',
        demobilizationCost: '35000.00',
        personnel: [
          {
            laborRoleId: 3,
            laborRoleCode: 'ALMOX',
            laborRoleName: 'Almoxarife Local',
            quantity: 1,
            monthlyUnitCost: '6000.00',
            totalMonthlyCost: '6000.00',
          },
          {
            laborRoleId: 4,
            laborRoleCode: 'VIGIA',
            laborRoleName: 'Vigilante Noturno',
            quantity: 2,
            monthlyUnitCost: '4500.00',
            totalMonthlyCost: '9000.00',
          },
        ],
      },
    ];

    return CampCalculator.calculateSummary(lineId, rawCamps);
  }
}
