import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  DATE_PATTERN,
  ViabilityParametersVersionItem,
} from '@lt-offers/domain';
import { civilDateValidator, decimalScaleValidator } from './form-utils';
import { ViabilityApi } from './viability-api.service';

/** Fatores de dedução são percentuais da RAP: no máximo 100%. */
function percentUpTo100Validator(
  control: AbstractControl,
): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (value === '') {
    return null;
  }
  return Number(value) > 100 ? { percentRange: true } : null;
}

@Component({
  selector: 'app-viability-parameters',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <section>
      <h2>Parâmetros de viabilidade (M13)</h2>
      <p>
        WACC regulatório real após impostos, prazo de recebimento da RAP e
        fatores de dedução usados no parecer de viabilidade do lote. Editar cria
        uma nova versão com vigência; as versões anteriores permanecem imutáveis
        e cada oferta reproduz o parecer da versão vigente na sua data.
      </p>
      <p>
        Os fatores de dedução (PIS/COFINS, O&amp;M e IR/CSLL) são hipótese de
        trabalho a calibrar; o WACC segue o valor regulatório vigente da ANEEL.
      </p>

      @if (currentVersion()) {
        <p class="mono">
          Versão vigente desde {{ currentVersion()!.effectiveFrom }} (por
          {{ currentVersion()!.createdBy }})
        </p>
      }

      <form [formGroup]="form" (ngSubmit)="save()" class="form-grid">
        <mat-form-field appearance="outline" floatLabel="always" class="col-6">
          <mat-label>WACC real após impostos (% a.a.)</mat-label>
          <input
            matInput
            formControlName="waccRealAfterTaxPercent"
            inputmode="decimal"
          />
          @if (waccError()) {
            <mat-error>{{ waccError() }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" floatLabel="always" class="col-6">
          <mat-label>Prazo de recebimento da RAP (anos)</mat-label>
          <input
            matInput
            formControlName="concessionYears"
            inputmode="numeric"
          />
          @if (yearsError()) {
            <mat-error>{{ yearsError() }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" floatLabel="always" class="col-4">
          <mat-label>PIS/COFINS (% da RAP)</mat-label>
          <input
            matInput
            formControlName="pisCofinsPercent"
            inputmode="decimal"
          />
          @if (factorError('pisCofinsPercent')) {
            <mat-error>{{ factorError('pisCofinsPercent') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" floatLabel="always" class="col-4">
          <mat-label>O&amp;M (% da RAP)</mat-label>
          <input
            matInput
            formControlName="operationMaintenancePercent"
            inputmode="decimal"
          />
          @if (factorError('operationMaintenancePercent')) {
            <mat-error>{{
              factorError('operationMaintenancePercent')
            }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" floatLabel="always" class="col-4">
          <mat-label>IR/CSLL (%)</mat-label>
          <input
            matInput
            formControlName="incomeTaxPercent"
            inputmode="decimal"
          />
          @if (factorError('incomeTaxPercent')) {
            <mat-error>{{ factorError('incomeTaxPercent') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" floatLabel="always" class="col-6">
          <mat-label>Início de vigência da nova versão *</mat-label>
          <input matInput formControlName="effectiveFrom" type="date" />
          @if (effectiveFromError()) {
            <mat-error>{{ effectiveFromError() }}</mat-error>
          }
        </mat-form-field>

        @if (serverError()) {
          <p class="error col-12" role="alert">{{ serverError() }}</p>
        }

        <div class="actions col-12">
          <button
            matButton="filled"
            type="submit"
            [disabled]="saving() || form.disabled"
          >
            Salvar nova versão
          </button>
        </div>
      </form>
    </section>
  `,
  styles: `
    .error {
      color: var(--mat-sys-error);
      margin: 0.15rem 0 0;
    }
    .actions {
      margin-top: 1rem;
    }
  `,
})
export class ViabilityParametersComponent {
  private readonly api = inject(ViabilityApi);
  private readonly snackBar = inject(MatSnackBar);

  readonly currentVersion = signal<ViabilityParametersVersionItem | null>(null);
  readonly serverError = signal('');
  readonly saving = signal(false);

  readonly form = new FormGroup({
    waccRealAfterTaxPercent: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        decimalScaleValidator(2, { nonZero: true }),
      ],
    }),
    concessionYears: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/^\d+$/),
        Validators.min(1),
        Validators.max(60),
      ],
    }),
    pisCofinsPercent: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        decimalScaleValidator(2),
        percentUpTo100Validator,
      ],
    }),
    operationMaintenancePercent: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        decimalScaleValidator(2),
        percentUpTo100Validator,
      ],
    }),
    incomeTaxPercent: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        decimalScaleValidator(2),
        percentUpTo100Validator,
      ],
    }),
    effectiveFrom: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(DATE_PATTERN),
        civilDateValidator,
      ],
    }),
  });

  constructor() {
    this.loadCurrent();
  }

  waccError(): string {
    const control = this.form.controls.waccRealAfterTaxPercent;
    if (!control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control.hasError('decimalScale')) {
      return 'Use no máximo 2 casas decimais';
    }
    return 'O WACC deve ser um decimal maior que zero (ex.: 8.00)';
  }

  yearsError(): string {
    const control = this.form.controls.concessionYears;
    if (!control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    return 'O prazo deve ser um número inteiro de anos entre 1 e 60';
  }

  factorError(
    field:
      'pisCofinsPercent' | 'operationMaintenancePercent' | 'incomeTaxPercent',
  ): string {
    const control = this.form.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control.hasError('percentRange')) {
      return 'O fator deve ser de no máximo 100%';
    }
    if (control.hasError('decimalScale')) {
      return 'Use no máximo 2 casas decimais';
    }
    return 'Informe um percentual decimal com ponto (ex.: 9.25)';
  }

  effectiveFromError(): string {
    const control = this.form.controls.effectiveFrom;
    if (!control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control.hasError('civilDate')) {
      return 'Informe uma data real do calendário';
    }
    return 'Informe uma data no formato AAAA-MM-DD';
  }

  save(): void {
    // Formulário desabilitado = prefill pendente ou falho; salvar aqui
    // gravaria uma versão vazia por cima dos parâmetros vigentes.
    if (this.form.disabled) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    this.serverError.set('');

    const raw = this.form.getRawValue();
    this.api
      .createParametersVersion({
        effectiveFrom: raw.effectiveFrom.trim(),
        waccRealAfterTaxPercent: raw.waccRealAfterTaxPercent.trim(),
        concessionYears: Number(raw.concessionYears.trim()),
        pisCofinsPercent: raw.pisCofinsPercent.trim(),
        operationMaintenancePercent: raw.operationMaintenancePercent.trim(),
        incomeTaxPercent: raw.incomeTaxPercent.trim(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Parâmetros de viabilidade salvos', 'Fechar', {
            duration: 4000,
          });
          this.form.controls.effectiveFrom.reset('');
          this.loadCurrent();
        },
        error: (error) => {
          this.saving.set(false);
          const message = error?.error?.message;
          this.serverError.set(
            Array.isArray(message)
              ? message.join('; ')
              : (message ?? 'Não foi possível salvar; tente novamente'),
          );
        },
      });
  }

  private loadCurrent(): void {
    // Prefill bloqueante: sem os valores vigentes o formulário não salva.
    this.form.disable({ emitEvent: false });
    this.api.getParameters().subscribe({
      next: (version) => {
        this.currentVersion.set(version);
        this.form.patchValue(
          {
            waccRealAfterTaxPercent: version.waccRealAfterTaxPercent,
            concessionYears: String(version.concessionYears),
            pisCofinsPercent: version.pisCofinsPercent,
            operationMaintenancePercent: version.operationMaintenancePercent,
            incomeTaxPercent: version.incomeTaxPercent,
          },
          { emitEvent: false },
        );
        this.form.enable({ emitEvent: false });
      },
      error: () =>
        this.serverError.set(
          'Não foi possível carregar os parâmetros vigentes; recarregue a página antes de criar uma nova versão',
        ),
    });
  }
}
