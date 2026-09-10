import {
  PrecipitationCalculator,
  ScheduleCalculator,
  CampCalculator,
  HistogramCalculator,
} from '../../index';

describe('Schedule, Precipitation, Camps & Histogram Calculators (M07 & M08)', () => {
  describe('PrecipitationCalculator (RF-37, RN-16)', () => {
    it('deve classificar corretamente os 5 níveis de precipitação pluviométrica', () => {
      expect(PrecipitationCalculator.classifyLevel(30)).toBe(1);
      expect(PrecipitationCalculator.classifyLevel(80)).toBe(2);
      expect(PrecipitationCalculator.classifyLevel(150)).toBe(3);
      expect(PrecipitationCalculator.classifyLevel(250)).toBe(4);
      expect(PrecipitationCalculator.classifyLevel(350)).toBe(5);
    });

    it('deve retornar os fatores de produtividade normativos para cada nível', () => {
      expect(PrecipitationCalculator.getProductivityFactor(1).toText()).toBe('1');
      expect(PrecipitationCalculator.getProductivityFactor(2).toText()).toBe('0.95');
      expect(PrecipitationCalculator.getProductivityFactor(3).toText()).toBe('0.85');
      expect(PrecipitationCalculator.getProductivityFactor(4).toText()).toBe('0.75');
      expect(PrecipitationCalculator.getProductivityFactor(5).toText()).toBe('0.65');
    });

    it('deve calcular a produção efetiva reduzida no período chuvoso', () => {
      // MG em Janeiro possui ~280 mm (Nível 4 -> Fator 0.75)
      // Produção nominal = 20 fundações/mês -> Produção efetiva = 20 * 0.75 = 15 fundações/mês
      const effectiveProd = PrecipitationCalculator.calculateEffectiveProduction('20.00', 'MG', 1);
      expect(effectiveProd.toFixed(2)).toBe('15.00');
    });

    it('deve calcular o fator médio de produtividade para um intervalo de meses', () => {
      // MG meses 6, 7, 8 (Jun, Jul, Ago) são secos (< 50 mm, Nível 1 -> Fator 1.00)
      const avgFactor = PrecipitationCalculator.getAverageProductivityFactor('MG', 6, 3);
      expect(avgFactor.toFixed(2)).toBe('1.00');
    });
  });

  describe('ScheduleCalculator (RF-35, RF-36, RF-38, RF-39, RN-14, RN-15)', () => {
    it('deve calcular durações, custos e datas do cronograma físico', () => {
      const summary = ScheduleCalculator.calculateSchedule({
        lineId: 1,
        lineName: 'LT 500 kV Teste',
        uf: 'MG',
        startMonth: 1,
        milestones: [
          {
            id: 'm-li',
            code: 'LI',
            name: 'Licença de Instalação',
            targetMonth: 2,
            isMandatory: true,
          },
          {
            id: 'm-lo',
            code: 'LO',
            name: 'Entrada em Operação Comercial',
            targetMonth: 18,
            isMandatory: true,
          },
        ],
        activities: [
          {
            id: 'act-1',
            code: 'CIV-01',
            name: 'Fundações',
            group: 'CIVIL_WORKS',
            quantitySource: 'TOTAL_FOUNDATIONS',
            totalQuantity: '120.00',
            quantityUnit: 'torres',
            assignedCrewId: 10,
            assignedCrewName: 'Turma de Fundação',
            crewCount: 2,
            nominalMonthlyProductionPerCrew: '10.00',
            maxMonthlyProductionPerCrew: '15.00',
            startMonth: 2,
            monthlyCostPerCrew: '80000.00',
            mobilizationCostPerCrew: '20000.00',
            demobilizationCostPerCrew: '10000.00',
          },
          {
            id: 'act-2',
            code: 'ELE-01',
            name: 'Montagem de Torres',
            group: 'TOWER_ERECTION',
            quantitySource: 'TOTAL_TOWERS',
            totalQuantity: '120.00',
            quantityUnit: 'torres',
            assignedCrewId: 20,
            assignedCrewName: 'Turma de Montagem',
            crewCount: 2,
            nominalMonthlyProductionPerCrew: '12.00',
            maxMonthlyProductionPerCrew: '16.00',
            startMonth: 5,
            durationMonths: 6,
            monthlyCostPerCrew: '95000.00',
            mobilizationCostPerCrew: '30000.00',
            demobilizationCostPerCrew: '15000.00',
          },
        ],
      });

      expect(summary.activities).toHaveLength(2);
      expect(summary.activities[0].startMonth).toBe(2);
      expect(summary.activities[0].durationMonths).toBeGreaterThanOrEqual(6);
      expect(summary.activities[0].status).toBe('PLANNED');

      // Custos
      expect(parseFloat(summary.totalDirectLaborCost)).toBeGreaterThan(0);
      expect(parseFloat(summary.totalScheduleCost)).toBeGreaterThan(0);
    });

    it('deve emitir alerta de sobreprodução quando a produção exigida excede a máxima (RN-15, RF-38)', () => {
      const summary = ScheduleCalculator.calculateSchedule({
        lineId: 1,
        uf: 'SP',
        startMonth: 1,
        activities: [
          {
            id: 'act-over',
            code: 'STR-01',
            name: 'Lançamento Acelerado',
            group: 'STRINGING',
            quantitySource: 'CONDUCTOR_KM',
            totalQuantity: '200.00',
            quantityUnit: 'km',
            assignedCrewId: 30,
            crewCount: 1,
            nominalMonthlyProductionPerCrew: '25.00',
            maxMonthlyProductionPerCrew: '30.00', // Max = 30 km/mês
            startMonth: 3,
            durationMonths: 4, // 200 km em 4 meses = 50 km/mês > 30 km/mês!
            monthlyCostPerCrew: '100000.00',
          },
        ],
      });

      expect(summary.activities[0].status).toBe('WARNING_OVERPRODUCTION');
      expect(summary.warnings.length).toBeGreaterThan(0);
      expect(summary.warnings[0]).toContain('excede o limite máximo');
    });

    it('deve emitir alerta quando atividade civil inicia antes da Licença de Instalação (RF-39)', () => {
      const summary = ScheduleCalculator.calculateSchedule({
        lineId: 1,
        uf: 'MG',
        startMonth: 1,
        milestones: [
          {
            id: 'm-li',
            code: 'LI',
            name: 'Licença de Instalação',
            targetMonth: 4, // LI no Mês 4
            isMandatory: true,
          },
        ],
        activities: [
          {
            id: 'act-early',
            code: 'CIV-02',
            name: 'Obras Civis Prematuras',
            group: 'CIVIL_WORKS',
            quantitySource: 'TOTAL_FOUNDATIONS',
            totalQuantity: '50.00',
            quantityUnit: 'unidades',
            crewCount: 1,
            nominalMonthlyProductionPerCrew: '10.00',
            startMonth: 2, // Inicia no Mês 2 (< Mês 4)!
            durationMonths: 5,
            monthlyCostPerCrew: '50000.00',
          },
        ],
      });

      expect(summary.activities[0].status).toBe('WARNING_PRECEDENCE');
      expect(summary.warnings[0]).toContain('antes da obtenção da Licença de Instalação');
    });
  });

  describe('CampCalculator (RF-41)', () => {
    it('deve calcular os custos e distribuição mensal de canteiro central e avançados', () => {
      const summary = CampCalculator.calculateSummary(1, [
        {
          id: 'camp-main',
          lineId: 1,
          code: 'CP-01',
          name: 'Canteiro Central',
          type: 'CENTRAL',
          startMonth: 1,
          durationMonths: 12,
          endMonth: 12,
          implementationCost: '200000.00',
          fixedMonthlyCost: '50000.00',
          demobilizationCost: '80000.00',
          personnel: [
            {
              laborRoleId: 1,
              quantity: 2,
              monthlyUnitCost: '15000.00',
              totalMonthlyCost: '30000.00',
            },
          ],
        },
        {
          id: 'camp-adv',
          lineId: 1,
          code: 'CP-02',
          name: 'Canteiro Avançado',
          type: 'ADVANCED',
          startMonth: 6,
          durationMonths: 4,
          endMonth: 9,
          implementationCost: '60000.00',
          fixedMonthlyCost: '20000.00',
          demobilizationCost: '30000.00',
          personnel: [],
        },
      ]);

      expect(summary.camps).toHaveLength(2);
      // Canteiro 1: 200k + (50k + 30k)*12 + 80k = 200k + 960k + 80k = 1.240.000,00
      expect(summary.camps[0].totalCampCost).toBe('1240000.00');
      // Canteiro 2: 60k + 20k*4 + 30k = 60k + 80k + 30k = 170.000,00
      expect(summary.camps[1].totalCampCost).toBe('170000.00');

      expect(summary.totalCampsCost).toBe('1410000.00');
      expect(summary.monthlyDistribution.length).toBeGreaterThan(0);
    });
  });

  describe('HistogramCalculator (RF-42..RF-45, RN-17)', () => {
    it('deve agregar curvas mensais de pessoal, segregar diretos/indiretos e calcular balanço de equipamentos próprios vs locação', () => {
      const histogram = HistogramCalculator.calculateHistogram({
        lineId: 1,
        activities: [
          {
            id: 'act-civ',
            lineId: 1,
            code: 'CIV-01',
            name: 'Fundações',
            group: 'CIVIL_WORKS',
            quantitySource: 'TOTAL_FOUNDATIONS',
            totalQuantity: '100.00',
            quantityUnit: 'torres',
            assignedCrewId: 1,
            crewCount: 2,
            startMonth: 2,
            durationMonths: 4,
            endMonth: 5,
            monthlyProduction: '25.00',
            predecessors: [],
            mobilizationCost: '0.00',
            monthlyRecurringCost: '0.00',
            demobilizationCost: '0.00',
            totalCost: '0.00',
            status: 'PLANNED',
          },
          {
            id: 'act-mont',
            lineId: 1,
            code: 'MON-01',
            name: 'Montagem de Torres',
            group: 'TOWER_ERECTION',
            quantitySource: 'TOTAL_TOWERS',
            totalQuantity: '100.00',
            quantityUnit: 'torres',
            assignedCrewId: 2,
            crewCount: 1,
            startMonth: 4,
            durationMonths: 4,
            endMonth: 7,
            monthlyProduction: '25.00',
            predecessors: [],
            mobilizationCost: '0.00',
            monthlyRecurringCost: '0.00',
            demobilizationCost: '0.00',
            totalCost: '0.00',
            status: 'PLANNED',
          },
        ],
        crews: [
          {
            id: 1,
            code: 'EQ-CIV',
            name: 'Equipe Civil',
            laborRoles: [
              { laborRoleId: 101, laborRoleCode: 'PEDR', laborRoleName: 'Pedreiro', quantity: 4 },
              { laborRoleId: 102, laborRoleCode: 'SERV', laborRoleName: 'Servente', quantity: 8 },
            ],
            equipments: [
              {
                equipmentId: 201,
                equipmentCode: 'CAM-BET',
                equipmentDescription: 'Caminhão Betoneira',
                quantity: 2,
                monthlyRentalRate: '12000.00',
              },
            ],
          },
          {
            id: 2,
            code: 'EQ-MON',
            name: 'Equipe Montagem',
            laborRoles: [
              { laborRoleId: 103, laborRoleCode: 'MONT', laborRoleName: 'Montador', quantity: 6 },
              { laborRoleId: 102, laborRoleCode: 'SERV', laborRoleName: 'Servente', quantity: 4 },
            ],
            equipments: [
              {
                equipmentId: 202,
                equipmentCode: 'GUIND',
                equipmentDescription: 'Guindaste 70t',
                quantity: 1,
                monthlyRentalRate: '35000.00',
              },
              {
                equipmentId: 201,
                equipmentCode: 'CAM-BET',
                equipmentDescription: 'Caminhão Betoneira',
                quantity: 1,
                monthlyRentalRate: '12000.00',
              },
            ],
          },
        ],
        camps: [
          {
            id: 'cp-1',
            lineId: 1,
            code: 'CP-MAIN',
            name: 'Canteiro Central',
            type: 'CENTRAL',
            startMonth: 1,
            durationMonths: 8,
            endMonth: 8,
            implementationCost: '100000.00',
            fixedMonthlyCost: '30000.00',
            demobilizationCost: '50000.00',
            personnel: [
              {
                laborRoleId: 104,
                laborRoleCode: 'ADM-OBRA',
                laborRoleName: 'Administrador de Obra',
                quantity: 2,
                monthlyUnitCost: '12000.00',
                totalMonthlyCost: '24000.00',
              },
            ],
            totalPersonnelMonthlyCost: '24000.00',
            totalMonthlyCost: '54000.00',
            totalCampCost: '582000.00',
          },
        ],
        ownFleet: [
          // A empresa tem 2 Caminhões Betoneira próprios
          { equipmentId: 201, ownUnits: 2 },
        ],
      });

      expect(histogram.totalMonths).toBe(8);
      expect(histogram.manpowerItems.length).toBeGreaterThanOrEqual(4);

      // No Mês 4 e 5:
      // Atividade Civil (crewCount=2): 2 * 2 = 4 Caminhões Betoneira
      // Atividade Montagem (crewCount=1): 1 * 1 = 1 Caminhão Betoneira
      // Total Betoneiras = 5. Frota própria = 2. Déficit a alugar = 3!
      const betoneira = histogram.equipmentItems.find((e) => e.equipmentId === 201);
      expect(betoneira).toBeDefined();
      expect(betoneira!.ownUnitsAvailable).toBe(2);
      expect(betoneira!.peakDemand).toBe(5);

      const mes4Demand = betoneira!.monthlyDemand.find((d) => d.month === 4);
      expect(mes4Demand!.totalRequired).toBe(5);
      expect(mes4Demand!.ownUsed).toBe(2);
      expect(mes4Demand!.deficitToRent).toBe(3);
      expect(mes4Demand!.estimatedRentalCost).toBe('36000.00'); // 3 * 12.000 = 36.000

      // Pico de Mão de Obra
      expect(histogram.peakManpower.month).toBeGreaterThanOrEqual(4);
      expect(histogram.peakManpower.direct).toBeGreaterThan(0);
      expect(histogram.peakManpower.indirect).toBe(2); // 2 adm de canteiro
      expect(histogram.peakManpower.drivingActivities.length).toBeGreaterThan(0);
    });
  });
});
