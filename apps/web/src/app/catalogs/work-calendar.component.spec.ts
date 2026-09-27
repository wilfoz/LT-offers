import { TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DEFAULT_WORK_CALENDAR } from '@lt-offers/domain';
import { WorkCalendarComponent } from './work-calendar.component';
import { ScheduleParametersApi } from './schedule-parameters-api.service';

const currentVersion = {
  id: 1,
  effectiveFrom: '2020-01-01',
  createdBy: 'sistema',
  createdAt: '2020-01-01T00:00:00.000Z',
  calendar: DEFAULT_WORK_CALENDAR,
};

describe('WorkCalendarComponent (calendário de trabalho)', () => {
  const apiMock = {
    getRainfall: vi.fn(),
    createRainfallVersion: vi.fn(),
    getWorkCalendar: vi.fn(),
    createWorkCalendarVersion: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [WorkCalendarComponent],
      providers: [{ provide: ScheduleParametersApi, useValue: apiMock }],
    }).compileComponents();
    const fixture = TestBed.createComponent(WorkCalendarComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.getWorkCalendar.mockReturnValue(of(currentVersion));
    apiMock.createWorkCalendarVersion.mockReturnValue(of(currentVersion));
  });

  it('carrega o calendário vigente com dias não laborais e feriados', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.form.enabled).toBe(true);
    expect(component.form.controls.standardWorkingDaysPerMonth.value).toBe(
      '22.00',
    );
    expect(component.form.controls.nonWorkingWeekdays.controls[0].value).toBe(
      true,
    ); // domingo
    expect(component.form.controls.nonWorkingWeekdays.controls[6].value).toBe(
      true,
    ); // sábado
    expect(component.holidays.length).toBe(
      DEFAULT_WORK_CALENDAR.holidays.length,
    );
  });

  it('prefill pendente mantém o formulário desabilitado e o salvar inerte', async () => {
    apiMock.getWorkCalendar.mockReturnValue(NEVER);
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.form.disabled).toBe(true);
    component.save();
    expect(apiMock.createWorkCalendarVersion).not.toHaveBeenCalled();
  });

  it('falha de leitura exibe erro e bloqueia a gravação', async () => {
    apiMock.getWorkCalendar.mockReturnValue(
      throwError(() => new Error('offline')),
    );
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.serverError()).toContain(
      'Não foi possível carregar o calendário vigente',
    );
    component.save();
    expect(apiMock.createWorkCalendarVersion).not.toHaveBeenCalled();
  });

  it('rejeita data de feriado inexistente no calendário (2027-02-30)', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.addHoliday({
      date: '2027-02-30',
      name: 'Data impossível',
      recurring: false,
      uf: '',
    });
    component.form.controls.effectiveFrom.setValue('2027-01-01');
    component.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Data de calendário inexistente');
    expect(apiMock.createWorkCalendarVersion).not.toHaveBeenCalled();
  });

  it('exibe feriado recorrente como mês-dia, sem o ano de referência', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.monthDayOf('2020-12-25')).toBe('25/12 (todo ano)');
    expect(component.monthDayOf('')).toBe('');
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('25/12 (todo ano)');
  });

  it('exige nome do feriado e rejeita UF desconhecida', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.addHoliday({
      date: '2027-06-10',
      name: '',
      recurring: false,
      uf: 'ZZ',
    });
    component.form.controls.effectiveFrom.setValue('2027-01-01');
    component.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Campo obrigatório');
    expect(text).toContain('UF inválida');
    expect(apiMock.createWorkCalendarVersion).not.toHaveBeenCalled();
  });

  it('bloqueia calendário com os 7 dias da semana não laborais', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.form.controls.nonWorkingWeekdays.controls.forEach((control) =>
      control.setValue(true),
    );
    component.form.controls.effectiveFrom.setValue('2027-01-01');
    component.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(
      'Os 7 dias da semana não podem ser todos não laborais',
    );
    expect(apiMock.createWorkCalendarVersion).not.toHaveBeenCalled();
  });

  it('salva nova versão com UF em branco como feriado nacional (null)', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.addHoliday({
      date: '2027-02-09',
      name: 'Carnaval',
      recurring: false,
      uf: '',
    });
    component.form.controls.effectiveFrom.setValue('2027-01-01');
    component.save();

    expect(apiMock.createWorkCalendarVersion).toHaveBeenCalledTimes(1);
    const payload = apiMock.createWorkCalendarVersion.mock.calls[0][0];
    expect(payload.effectiveFrom).toBe('2027-01-01');
    expect(payload.nonWorkingWeekdays).toEqual([0, 6]);
    const carnaval = payload.holidays.find(
      (holiday: { name: string }) => holiday.name === 'Carnaval',
    );
    expect(carnaval).toEqual({
      date: '2027-02-09',
      name: 'Carnaval',
      recurring: false,
      uf: null,
    });
  });

  it('normaliza a UF do feriado estadual para maiúsculas', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.addHoliday({
      date: '2027-07-02',
      name: 'Independência da Bahia',
      recurring: true,
      uf: 'ba',
    });
    component.form.controls.effectiveFrom.setValue('2027-01-01');
    component.save();

    const payload = apiMock.createWorkCalendarVersion.mock.calls[0][0];
    const bahia = payload.holidays.find(
      (holiday: { name: string }) => holiday.name === 'Independência da Bahia',
    );
    expect(bahia.uf).toBe('BA');
  });
});
