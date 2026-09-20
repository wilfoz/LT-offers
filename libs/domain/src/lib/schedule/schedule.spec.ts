import {
  ScheduleActivity,
  MilestoneContract,
  CampDefinition,
  PrecipitationFactor,
} from '../../index';

describe('Schedule, Camps & Histogram Domain Contracts', () => {
  it('deve instanciar uma atividade de cronograma com campos obrigatórios', () => {
    const activity: ScheduleActivity = {
      id: 'act-1',
      lineId: 10,
      code: 'ACT-CIVIL-01',
      name: 'Escavação e Concretagem de Fundações',
      group: 'CIVIL_WORKS',
      quantitySource: 'TOTAL_FOUNDATIONS',
      totalQuantity: '120.00',
      quantityUnit: 'unidades',
      assignedCrewId: 1,
      assignedCrewName: 'Equipe de Fundação Padrão',
      crewCount: 2,
      startMonth: 2,
      durationMonths: 6,
      endMonth: 7,
      monthlyProduction: '20.00',
      maxMonthlyProduction: '30.00',
      predecessors: [{ activityId: 'act-prelim', type: 'FS', lagMonths: 0 }],
      mobilizationCost: '50000.00',
      monthlyRecurringCost: '120000.00',
      demobilizationCost: '30000.00',
      totalCost: '800000.00',
      status: 'PLANNED',
    };

    expect(activity.group).toBe('CIVIL_WORKS');
    expect(activity.durationMonths).toBe(6);
    expect(activity.crewCount).toBe(2);
    expect(activity.predecessors).toHaveLength(1);
  });

  it('deve instanciar um marco contratual (LI / LO)', () => {
    const milestone: MilestoneContract = {
      id: 'ms-li',
      code: 'LI',
      name: 'Licença de Instalação (LI)',
      targetMonth: 2,
      targetDate: '2026-10-01',
      isMandatory: true,
      description: 'Condição obrigatória para início de obras civis',
    };

    expect(milestone.code).toBe('LI');
    expect(milestone.targetMonth).toBe(2);
    expect(milestone.isMandatory).toBe(true);
  });

  it('deve instanciar um canteiro central com custos e quadro de pessoal', () => {
    const camp: CampDefinition = {
      id: 'camp-main',
      lineId: 10,
      code: 'CP-01',
      name: 'Canteiro Central de Obra',
      type: 'CENTRAL',
      locationKm: '45.00',
      startMonth: 1,
      durationMonths: 18,
      endMonth: 18,
      implementationCost: '350000.00',
      fixedMonthlyCost: '85000.00',
      demobilizationCost: '120000.00',
      personnel: [
        {
          laborRoleId: 1,
          laborRoleCode: 'ENG-SR',
          laborRoleName: 'Engenheiro Residente',
          quantity: 1,
          monthlyUnitCost: '25000.00',
          totalMonthlyCost: '25000.00',
        },
        {
          laborRoleId: 2,
          laborRoleCode: 'TEC-SEG',
          laborRoleName: 'Técnico de Segurança do Trabalho',
          quantity: 2,
          monthlyUnitCost: '9500.00',
          totalMonthlyCost: '19000.00',
        },
      ],
      totalPersonnelMonthlyCost: '44000.00',
      totalMonthlyCost: '129000.00',
      totalCampCost: '2792000.00',
    };

    expect(camp.type).toBe('CENTRAL');
    expect(camp.personnel).toHaveLength(2);
    expect(camp.totalMonthlyCost).toBe('129000.00');
  });

  it('deve instanciar fator de precipitação pluviométrica', () => {
    const precip: PrecipitationFactor = {
      uf: 'MG',
      month: 1, // Janeiro
      precipitationMm: '280.50',
      level: 4,
      productivityFactor: '0.75',
    };

    expect(precip.level).toBe(4);
    expect(precip.productivityFactor).toBe('0.75');
  });
});
