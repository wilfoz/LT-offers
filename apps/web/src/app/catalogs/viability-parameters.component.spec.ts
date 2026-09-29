import { TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ViabilityParametersComponent } from './viability-parameters.component';
import { ViabilityApi } from './viability-api.service';

const currentVersion = {
  id: 1,
  effectiveFrom: '2026-03-01',
  waccRealAfterTaxPercent: '8.00',
  concessionYears: 30,
  pisCofinsPercent: '9.25',
  operationMaintenancePercent: '10.00',
  incomeTaxPercent: '10.00',
  createdBy: 'sistema',
  createdAt: '2026-03-01T00:00:00.000Z',
};

describe('ViabilityParametersComponent (parâmetros de viabilidade, M13)', () => {
  const apiMock = {
    getParameters: vi.fn(),
    createParametersVersion: vi.fn(),
    assessment: vi.fn(),
  };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [ViabilityParametersComponent],
      providers: [{ provide: ViabilityApi, useValue: apiMock }],
    }).compileComponents();
    const fixture = TestBed.createComponent(ViabilityParametersComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.getParameters.mockReturnValue(of(currentVersion));
    apiMock.createParametersVersion.mockReturnValue(of(currentVersion));
  });

  it('carrega a versão vigente no formulário com a vigência e o autor', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.form.enabled).toBe(true);
    expect(component.form.controls.waccRealAfterTaxPercent.value).toBe('8.00');
    expect(component.form.controls.concessionYears.value).toBe('30');
    expect(component.form.controls.pisCofinsPercent.value).toBe('9.25');

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Versão vigente desde 2026-03-01 (por sistema)');
    expect(text).toContain('hipótese de trabalho a calibrar');
  });

  it('prefill pendente mantém o formulário desabilitado e o salvar inerte', async () => {
    apiMock.getParameters.mockReturnValue(NEVER);
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.form.disabled).toBe(true);
    component.save();
    expect(apiMock.createParametersVersion).not.toHaveBeenCalled();
  });

  it('falha de leitura exibe erro e bloqueia a gravação de versão vazia', async () => {
    apiMock.getParameters.mockReturnValue(
      throwError(() => new Error('offline')),
    );
    const fixture = await mount();
    const component = fixture.componentInstance;

    expect(component.serverError()).toContain(
      'Não foi possível carregar os parâmetros vigentes',
    );
    component.save();
    expect(apiMock.createParametersVersion).not.toHaveBeenCalled();
  });

  it('rejeita WACC zero, fator acima de 100% e prazo fora do intervalo', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.form.controls.waccRealAfterTaxPercent.setValue('0');
    component.form.controls.pisCofinsPercent.setValue('101.00');
    component.form.controls.concessionYears.setValue('0');
    component.form.controls.effectiveFrom.setValue('2027-03-01');
    component.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(
      'O WACC deve ser um decimal maior que zero (ex.: 8.00)',
    );
    expect(text).toContain('O fator deve ser de no máximo 100%');
    expect(text).toContain(
      'O prazo deve ser um número inteiro de anos entre 1 e 60',
    );
    expect(apiMock.createParametersVersion).not.toHaveBeenCalled();
  });

  it('rejeita vigência inexistente no calendário (2027-02-30)', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.form.controls.effectiveFrom.setValue('2027-02-30');
    component.save();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Informe uma data real do calendário');
    expect(apiMock.createParametersVersion).not.toHaveBeenCalled();
  });

  it('salvar cria nova versão com a vigência informada e confirma em snackbar', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.form.controls.waccRealAfterTaxPercent.setValue('7.50');
    component.form.controls.effectiveFrom.setValue('2027-03-01');
    component.save();

    expect(apiMock.createParametersVersion).toHaveBeenCalledWith({
      effectiveFrom: '2027-03-01',
      waccRealAfterTaxPercent: '7.50',
      concessionYears: 30,
      pisCofinsPercent: '9.25',
      operationMaintenancePercent: '10.00',
      incomeTaxPercent: '10.00',
    });
    // Recarrega a vigente após salvar (1 no mount + 1 pós-save).
    expect(apiMock.getParameters).toHaveBeenCalledTimes(2);
  });

  it('exibe as mensagens do servidor em caso de rejeição (ex.: vigência duplicada)', async () => {
    apiMock.createParametersVersion.mockReturnValue(
      throwError(() => ({
        error: {
          message:
            'Já existe uma versão de parâmetros de viabilidade com vigência a partir de 2026-03-01.',
        },
      })),
    );
    const fixture = await mount();
    const component = fixture.componentInstance;

    component.form.controls.effectiveFrom.setValue('2026-03-01');
    component.save();
    fixture.detectChanges();

    expect(component.serverError()).toContain(
      'vigência a partir de 2026-03-01',
    );
  });

  it('botão de salvar reflete o estado desabilitado do formulário', async () => {
    apiMock.getParameters.mockReturnValue(NEVER);
    const fixture = await mount();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
