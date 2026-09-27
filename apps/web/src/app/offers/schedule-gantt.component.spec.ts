import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ScheduleGanttComponent } from './schedule-gantt.component';
import { ScheduleApiService } from './schedule-api.service';
import { ScheduleSummary } from '@lt-offers/domain';

describe('ScheduleGanttComponent', () => {
  let component: ScheduleGanttComponent;
  let fixture: ComponentFixture<ScheduleGanttComponent>;
  let apiSpy: {
    getLineSchedule: ReturnType<typeof vi.fn>;
    getLineCamps: ReturnType<typeof vi.fn>;
  };

  const mockSchedule: ScheduleSummary = {
    lineId: 1,
    lineName: 'LT 500 kV Teste',
    startMonth: 1,
    totalDurationMonths: 18,
    totalDirectLaborCost: '1500000.00',
    totalEquipmentCost: '800000.00',
    totalIndirectCost: '450000.00',
    totalScheduleCost: '2750000.00',
    warnings: ['Alerta de teste'],
    milestones: [
      {
        id: 'ms-li',
        code: 'LI',
        name: 'Licença de Instalação',
        targetMonth: 2,
        isMandatory: true,
      },
    ],
    activities: [
      {
        id: 'act-1',
        lineId: 1,
        code: 'CIV-01',
        name: 'Obras Civis',
        group: 'CIVIL_WORKS',
        quantitySource: 'TOTAL_FOUNDATIONS',
        totalQuantity: '100.00',
        quantityUnit: 'torres',
        crewCount: 2,
        startMonth: 2,
        durationMonths: 6,
        endMonth: 7,
        monthlyProduction: '16.67',
        predecessors: [],
        mobilizationCost: '50000.00',
        monthlyRecurringCost: '160000.00',
        demobilizationCost: '30000.00',
        totalCost: '1040000.00',
        status: 'PLANNED',
      },
    ],
  };

  beforeEach(async () => {
    apiSpy = {
      getLineSchedule: vi.fn().mockReturnValue(of(mockSchedule)),
      getLineCamps: vi.fn().mockReturnValue(
        of({
          lineId: 1,
          camps: [],
          totalImplementationCost: '0',
          totalOperatingCost: '0',
          totalDemobilizationCost: '0',
          totalCampsCost: '0',
          monthlyDistribution: [],
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [ScheduleGanttComponent],
      providers: [{ provide: ScheduleApiService, useValue: apiSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleGanttComponent);
    component = fixture.componentInstance;
    component.lineId = 1;
    fixture.detectChanges();
  });

  it('deve inicializar e carregar o cronograma com sucesso', () => {
    expect(component).toBeTruthy();
    expect(apiSpy.getLineSchedule).toHaveBeenCalledWith(1);
    expect(component.schedule()).toEqual(mockSchedule);
    expect(component.loading()).toBe(false);
  });

  it('deve formatar valores monetários corretamente', () => {
    const formatted = component.formatCurrency('1000.00');
    expect(formatted).toContain('1.000,00');
  });

  it('deve filtrar atividades pelo grupo selecionado', () => {
    component.selectedGroupFilter = 'ALL';
    expect(component.filteredActivities().length).toBe(1);

    component.selectedGroupFilter = 'STRINGING';
    expect(component.filteredActivities().length).toBe(0);
  });

  it('deve exibir a pendência de data de início quando o cronograma não está ancorado (RNF-09)', () => {
    expect(component.startDateLabel()).toBe('Data de início não informada');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Data de início não informada');
  });

  it('deve exibir a data de início quando o cronograma está ancorado', () => {
    apiSpy.getLineSchedule.mockReturnValue(
      of({ ...mockSchedule, scheduleStartDate: '2026-07-01' }),
    );
    component.loadSchedule();
    fixture.detectChanges();

    expect(component.startDateLabel()).toBe('Obra a partir de 2026-07-01');
  });

  it('deve contar os meses penalizados e montar o tooltip com os fatores aplicados', () => {
    const withBreakdown = {
      ...mockSchedule.activities[0],
      monthlyBreakdown: [
        {
          projectMonth: 2,
          civilYear: 2026,
          civilMonth: 8,
          rainfallFactor: '1.0000',
          calendarFactor: '0.9545',
          effectiveProduction: '19.09',
          plannedProduction: '19.09',
        },
        {
          projectMonth: 3,
          civilYear: 2026,
          civilMonth: 9,
          rainfallFactor: '0.9500',
          calendarFactor: '1.0000',
          effectiveProduction: '19.00',
          plannedProduction: '19.00',
        },
        {
          projectMonth: 4,
          civilYear: 2026,
          civilMonth: 10,
          rainfallFactor: '1.0000',
          calendarFactor: '1.0000',
          effectiveProduction: '20.00',
          plannedProduction: '20.00',
        },
      ],
    };
    apiSpy.getLineSchedule.mockReturnValue(
      of({ ...mockSchedule, activities: [withBreakdown] }),
    );
    component.loadSchedule();
    fixture.detectChanges();

    const act = component.schedule()!.activities[0];
    expect(component.penalizedMonths(act)).toBe(2);
    const tooltip = component.breakdownTooltip(act);
    expect(tooltip).toContain(
      'M2 (08/2026): chuva 1.0000 × calendário 0.9545 → 19.09/mês',
    );

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('fatores em 2 meses');
  });

  it('deve renderizar os alertas do motor (mês parado, pendências) no banner', () => {
    apiSpy.getLineSchedule.mockReturnValue(
      of({
        ...mockSchedule,
        warnings: [
          'Data de início do cronograma não informada: feriados e dias não laborais não foram considerados no cálculo.',
          "Atividade 'Obras Civis': mês 3 sem produção efetiva — a atividade avança sem consumo no período.",
        ],
      }),
    );
    component.loadSchedule();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Data de início do cronograma não informada');
    expect(text).toContain('mês 3 sem produção efetiva');
  });
});
