import { GetLineScheduleUseCase } from './get-line-schedule.usecase';
import { GetLineCampsUseCase } from './get-line-camps.usecase';
import {
  ScheduleDataQueryPort,
  ScheduleLineData,
  ScheduleLineCampsData,
  LineScheduleNotFoundException,
} from '../../domain';

describe('Schedule Use Cases (M07, RF-35..RF-41)', () => {
  let mockPort: ScheduleDataQueryPort;
  let getLineScheduleUseCase: GetLineScheduleUseCase;
  let getLineCampsUseCase: GetLineCampsUseCase;

  const sampleLineData: ScheduleLineData = {
    lineId: 1,
    lineName: 'LT 500 kV Poções III - Padre Paraíso C1',
    lengthKm: 100,
    totalTowers: 250,
    uf: 'MG',
    startMonth: 1,
    milestones: [
      {
        id: 'ms-li-1',
        code: 'LI',
        name: 'Licença de Instalação (LI)',
        targetMonth: 2,
        isMandatory: true,
        description: 'Condição precedente obrigatória para obras de campo',
      },
      {
        id: 'ms-lo-1',
        code: 'LO',
        name: 'Entrada em Operação Comercial (LO)',
        targetMonth: 18,
        isMandatory: true,
        description: 'Marco final de comissionamento e faturamento',
      },
    ],
    activitiesInput: [
      {
        id: 'act-ind-1',
        code: 'ACT-01-IND',
        name: 'Gestão, Engenharia e Apoio Indireto',
        group: 'INDIRECTS',
        quantitySource: 'MANUAL',
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
        id: 'act-prelim-1',
        code: 'ACT-02-PRELIM',
        name: 'Abertura de Acessos e Limpeza de Faixa',
        group: 'PRELIMINARIES',
        quantitySource: 'ROW_CLEARING_HA',
        totalQuantity: '500.00',
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
        id: 'act-civil-1',
        code: 'ACT-03-CIVIL',
        name: 'Escavação, Armação e Concretagem de Fundações',
        group: 'CIVIL_WORKS',
        quantitySource: 'TOTAL_FOUNDATIONS',
        totalQuantity: '250.00',
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
        id: 'act-erect-1',
        code: 'ACT-04-ERECT',
        name: 'Montagem Eletromecânica de Torres e Acessórios',
        group: 'TOWER_ERECTION',
        quantitySource: 'TOTAL_TOWERS',
        totalQuantity: '250.00',
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
        id: 'act-string-1',
        code: 'ACT-05-STRING',
        name: 'Lançamento de Cabos Condutores e OPGW',
        group: 'STRINGING',
        quantitySource: 'CONDUCTOR_KM',
        totalQuantity: '100.00',
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
        id: 'act-comm-1',
        code: 'ACT-06-COMM',
        name: 'Ensaios Elétricos, Comissionamento e Energização',
        group: 'COMMISSIONING',
        quantitySource: 'MANUAL',
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
    ],
  };

  const sampleCampsData: ScheduleLineCampsData = {
    lineId: 1,
    rawCamps: [
      {
        id: 'camp-central-1',
        lineId: 1,
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
        id: 'camp-adv1-1',
        lineId: 1,
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
    ],
  };

  beforeEach(() => {
    mockPort = {
      findLineScheduleData: jest.fn().mockResolvedValue(sampleLineData),
      findLineCampsData: jest.fn().mockResolvedValue(sampleCampsData),
    };

    getLineScheduleUseCase = new GetLineScheduleUseCase(mockPort);
    getLineCampsUseCase = new GetLineCampsUseCase(mockPort);
  });

  describe('GetLineScheduleUseCase', () => {
    it('deve retornar o cronograma físico da linha com atividades, durações e marcos', async () => {
      const summary = await getLineScheduleUseCase.execute(1);

      expect(summary.lineId).toBe(1);
      expect(summary.activities.length).toBeGreaterThanOrEqual(5);
      expect(summary.milestones.length).toBe(2);
      expect(summary.totalDurationMonths).toBeGreaterThanOrEqual(12);
      expect(parseFloat(summary.totalScheduleCost)).toBeGreaterThan(0);
    });

    it('deve lançar LineScheduleNotFoundException quando a linha não existir', async () => {
      jest.spyOn(mockPort, 'findLineScheduleData').mockResolvedValue(null);

      await expect(getLineScheduleUseCase.execute(999)).rejects.toThrow(
        LineScheduleNotFoundException,
      );
    });
  });

  describe('GetLineCampsUseCase', () => {
    it('deve retornar a estrutura e dimensionamento de canteiros da linha', async () => {
      const camps = await getLineCampsUseCase.execute(1);

      expect(camps.lineId).toBe(1);
      expect(camps.camps.length).toBeGreaterThanOrEqual(2);
      expect(parseFloat(camps.totalCampsCost)).toBeGreaterThan(0);
      expect(camps.monthlyDistribution.length).toBeGreaterThan(0);
    });

    it('deve lançar LineScheduleNotFoundException quando a linha não existir', async () => {
      jest.spyOn(mockPort, 'findLineCampsData').mockResolvedValue(null);

      await expect(getLineCampsUseCase.execute(999)).rejects.toThrow(
        LineScheduleNotFoundException,
      );
    });
  });
});
