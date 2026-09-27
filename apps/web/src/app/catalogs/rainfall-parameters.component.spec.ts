import { TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DEFAULT_RAINFALL_PARAMETERS } from '@lt-offers/domain';
import { RainfallParametersComponent } from './rainfall-parameters.component';
import { ScheduleParametersApi } from './schedule-parameters-api.service';

const currentVersion = {
  id: 1,
  effectiveFrom: '2020-01-01',
  createdBy: 'sistema',
  createdAt: '2020-01-01T00:00:00.000Z',
  parameters: DEFAULT_RAINFALL_PARAMETERS,
};

describe('RainfallParametersComponent (parâmetros de chuva, RN-16)', () => {
  const apiMock = {
    getRainfall: vi.fn(),
    createRainfallVersion: vi.fn(),
    getWorkCalendar: vi.fn(),
    createWorkCalendarVersion: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [RainfallParametersComponent],
      providers: [{ provide: ScheduleParametersApi, useValue: apiMock }],
    }).compileComponents();
    const fixture = TestBed.createComponent(RainfallParametersComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.getRainfall.mockReturnValue(of(currentVersion));
    apiMock.createRainfallVersion.mockReturnValue(of(currentVersion));
  });

  it('carrega a versão vigente e preenche faixas e matriz das 27 UFs', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.form.enabled).toBe(true);
    expect(component.bands.length).toBe(5);
    expect(component.ufSeries.length).toBe(27);
    expect(component.bands.at(4).controls.productivityFactor.value).toBe(
      '0.65',
    );
  });

  it('prefill pendente mantém o formulário desabilitado e o salvar inerte', async () => {
    apiMock.getRainfall.mockReturnValue(NEVER);
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.form.disabled).toBe(true);
    component.save();
    expect(apiMock.createRainfallVersion).not.toHaveBeenCalled();
  });

  it('falha de leitura exibe erro e bloqueia a gravação de versão vazia', async () => {
    apiMock.getRainfall.mockReturnValue(throwError(() => new Error('offline')));
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.serverError()).toContain(
      'Não foi possível carregar os parâmetros vigentes',
    );
    component.save();
    expect(apiMock.createRainfallVersion).not.toHaveBeenCalled();
  });

  it('rejeita percentual fora de 0 a 1 com mensagem em português', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.bands.at(0).controls.productivityFactor.setValue('1.2');
    component.form.controls.effectiveFrom.setValue('2026-10-01');
    component.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('O fator deve estar entre 0 e 1');
    expect(apiMock.createRainfallVersion).not.toHaveBeenCalled();
  });

  it('rejeita fator com mais de 4 casas decimais (escala da coluna)', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.bands.at(1).controls.productivityFactor.setValue('0.95555');
    component.form.controls.effectiveFrom.setValue('2026-10-01');
    component.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Use no máximo 4 casas decimais');
    expect(apiMock.createRainfallVersion).not.toHaveBeenCalled();
  });

  it('rejeita célula inválida da grade identificando UF e mês', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    const mgIndex = component.ufSeries.controls.findIndex(
      (series) => series.controls.uf.value === 'MG',
    );
    component.ufSeries.at(mgIndex).controls.monthlyMm.at(3).setValue('120.55');
    component.form.controls.effectiveFrom.setValue('2026-10-01');
    component.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(
      'Precipitação de MG em Abr com mais de 1 casa decimal',
    );
    expect(apiMock.createRainfallVersion).not.toHaveBeenCalled();
  });

  it('rejeita limite de faixa com mais de 1 casa decimal', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.bands.at(0).controls.upperLimitMm.setValue('49.95');
    component.form.controls.effectiveFrom.setValue('2026-10-01');
    component.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Use no máximo 1 casa decimal');
    expect(apiMock.createRainfallVersion).not.toHaveBeenCalled();
  });

  it('exige a data de vigência da nova versão', async () => {
    const fixture = await mount();
    fixture.componentInstance.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Campo obrigatório');
    expect(apiMock.createRainfallVersion).not.toHaveBeenCalled();
  });

  it('salva nova versão com faixas (última aberta) e matriz completas', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.bands.at(4).controls.productivityFactor.setValue('0.70');
    component.form.controls.effectiveFrom.setValue('2026-10-01');
    component.save();

    expect(apiMock.createRainfallVersion).toHaveBeenCalledTimes(1);
    const payload = apiMock.createRainfallVersion.mock.calls[0][0];
    expect(payload.effectiveFrom).toBe('2026-10-01');
    expect(payload.bands).toHaveLength(5);
    expect(payload.bands[4]).toEqual({
      position: 5,
      upperLimitMm: null,
      productivityFactor: '0.70',
    });
    expect(payload.ufSeries).toHaveLength(27);
    expect(payload.ufSeries[0].monthlyMm).toHaveLength(12);
  });

  it('exibe as mensagens do servidor em caso de rejeição estrutural', async () => {
    apiMock.createRainfallVersion.mockReturnValue(
      throwError(() => ({
        error: {
          message: [
            'A matriz de precipitação está incompleta: falta a série da UF BA.',
          ],
        },
      })),
    );
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.form.controls.effectiveFrom.setValue('2026-10-01');
    component.save();
    fixture.detectChanges();

    expect(component.serverError()).toContain('falta a série da UF BA');
  });
});
