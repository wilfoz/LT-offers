import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
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
import { DATE_PATTERN, UF_METADATA_MAP, BrazilianUf } from '@lt-offers/domain';
import { decimalScaleValidator } from './form-utils';
import {
  RainfallParametersVersion,
  ScheduleParametersApi,
} from './schedule-parameters-api.service';

export const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

/** Fator de produtividade é um percentual multiplicador entre 0 e 1. */
function factorRangeValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value = String(control.value ?? '').trim();
  if (value === '') {
    return null;
  }
  return Number(value) > 1 ? { factorRange: true } : null;
}

interface BandGroup {
  position: FormControl<number>;
  upperLimitMm: FormControl<string>;
  productivityFactor: FormControl<string>;
}

interface UfGroup {
  uf: FormControl<string>;
  monthlyMm: FormArray<FormControl<string>>;
}

@Component({
  selector: 'app-rainfall-parameters',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <section>
      <h2>Parâmetros de chuva (RN-16)</h2>
      <p>
        Matriz de precipitação histórica por UF e mês, faixas de severidade e
        percentuais de produtividade. Editar cria uma nova versão com vigência;
        as versões anteriores permanecem imutáveis e as ofertas fechadas
        reproduzem seus números originais.
      </p>

      @if (currentVersion()) {
        <p class="mono">
          Versão vigente desde {{ currentVersion()!.effectiveFrom }} (por
          {{ currentVersion()!.createdBy }})
        </p>
      }

      <form [formGroup]="form" (ngSubmit)="save()">
        <h3>Faixas de severidade</h3>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Faixa</th>
                <th>Limite superior (mm/mês)</th>
                <th>Fator de produtividade (0 a 1)</th>
              </tr>
            </thead>
            <tbody formArrayName="bands">
              @for (band of bands.controls; track $index) {
                <tr [formGroupName]="$index">
                  <td class="mono">{{ band.controls.position.value }}</td>
                  <td>
                    @if (isOpenBand($index)) {
                      <span>aberta (acima da faixa anterior)</span>
                    } @else {
                      <input
                        formControlName="upperLimitMm"
                        inputmode="decimal"
                        [attr.aria-label]="
                          'Limite superior da faixa ' +
                          band.controls.position.value
                        "
                      />
                      @if (bandLimitError($index)) {
                        <p class="error" role="alert">
                          {{ bandLimitError($index) }}
                        </p>
                      }
                    }
                  </td>
                  <td>
                    <input
                      formControlName="productivityFactor"
                      inputmode="decimal"
                      [attr.aria-label]="
                        'Fator de produtividade da faixa ' +
                        band.controls.position.value
                      "
                    />
                    @if (bandFactorError($index)) {
                      <p class="error" role="alert">
                        {{ bandFactorError($index) }}
                      </p>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <h3>Precipitação média histórica (mm) por UF × mês</h3>
        <div class="table-scroll">
          <table class="dense">
            <thead>
              <tr>
                <th>UF</th>
                @for (label of monthLabels; track label) {
                  <th>{{ label }}</th>
                }
              </tr>
            </thead>
            <tbody formArrayName="ufSeries">
              @for (series of ufSeries.controls; track $index) {
                <tr [formGroupName]="$index">
                  <th class="mono" [title]="ufName(series.controls.uf.value)">
                    {{ series.controls.uf.value }}
                  </th>
                  @for (
                    cell of series.controls.monthlyMm.controls;
                    track $index;
                    let month = $index
                  ) {
                    <td formArrayName="monthlyMm">
                      <input
                        class="cell"
                        [formControlName]="month"
                        inputmode="decimal"
                        [attr.aria-label]="
                          series.controls.uf.value +
                          ' ' +
                          monthLabels[month] +
                          ' (mm)'
                        "
                      />
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (matrixError()) {
          <p class="error" role="alert">{{ matrixError() }}</p>
        }

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="effective-from"
        >
          <mat-label>Início de vigência da nova versão *</mat-label>
          <input matInput formControlName="effectiveFrom" type="date" />
          @if (effectiveFromError()) {
            <mat-error>{{ effectiveFromError() }}</mat-error>
          }
        </mat-form-field>

        @if (serverError()) {
          <p class="error" role="alert">{{ serverError() }}</p>
        }

        <div class="actions">
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
    table input {
      width: 6rem;
      padding: 0.25rem;
    }
    table input.cell {
      width: 3.5rem;
    }
    .error {
      color: var(--mat-sys-error);
      margin: 0.15rem 0 0;
    }
    .effective-from {
      margin-top: 1rem;
      max-width: 20rem;
      display: block;
    }
    .actions {
      margin-top: 1rem;
    }
    h3 {
      margin-top: 1.5rem;
    }
  `,
})
export class RainfallParametersComponent {
  private readonly api = inject(ScheduleParametersApi);
  private readonly snackBar = inject(MatSnackBar);

  readonly monthLabels = MONTH_LABELS;
  readonly currentVersion = signal<RainfallParametersVersion | null>(null);
  readonly serverError = signal('');
  readonly saving = signal(false);

  readonly form = new FormGroup({
    bands: new FormArray<FormGroup<BandGroup>>([]),
    ufSeries: new FormArray<FormGroup<UfGroup>>([]),
    effectiveFrom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(DATE_PATTERN)],
    }),
  });

  constructor() {
    this.loadCurrent();
  }

  get bands(): FormArray<FormGroup<BandGroup>> {
    return this.form.controls.bands;
  }

  get ufSeries(): FormArray<FormGroup<UfGroup>> {
    return this.form.controls.ufSeries;
  }

  isOpenBand(index: number): boolean {
    return index === this.bands.length - 1;
  }

  ufName(uf: string): string {
    return UF_METADATA_MAP[uf as BrazilianUf]?.name ?? uf;
  }

  bandLimitError(index: number): string {
    const control = this.bands.at(index).controls.upperLimitMm;
    if (!control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control.hasError('decimalScale')) {
      return 'Use no máximo 1 casa decimal';
    }
    return 'Informe um número decimal com ponto (ex.: 49.9)';
  }

  bandFactorError(index: number): string {
    const control = this.bands.at(index).controls.productivityFactor;
    if (!control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control.hasError('factorRange')) {
      return 'O fator deve estar entre 0 e 1';
    }
    if (control.hasError('decimalScale')) {
      return 'Use no máximo 4 casas decimais';
    }
    return 'Informe um número decimal com ponto (ex.: 0.85)';
  }

  /** Primeiro erro da grade UF × mês, pós-toque (uma mensagem para a grade). */
  matrixError(): string {
    for (const series of this.ufSeries.controls) {
      const uf = series.controls.uf.value;
      const cells = series.controls.monthlyMm.controls;
      for (let month = 0; month < cells.length; month++) {
        const cell = cells[month];
        if (!cell.touched || cell.valid) {
          continue;
        }
        const label = `${uf} em ${MONTH_LABELS[month]}`;
        if (cell.hasError('required')) {
          return `Preencha a precipitação de ${label} — precipitação ausente não vira zero`;
        }
        if (cell.hasError('decimalScale')) {
          return `Precipitação de ${label} com mais de 1 casa decimal`;
        }
        return `Precipitação de ${label} deve ser um número decimal com ponto (ex.: 120.5)`;
      }
    }
    return '';
  }

  effectiveFromError(): string {
    const control = this.form.controls.effectiveFrom;
    if (!control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
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

    this.api
      .createRainfallVersion({
        effectiveFrom: this.form.controls.effectiveFrom.value.trim(),
        bands: this.bands.controls.map((band, index) => ({
          position: band.controls.position.value,
          upperLimitMm: this.isOpenBand(index)
            ? null
            : band.controls.upperLimitMm.value.trim(),
          productivityFactor: band.controls.productivityFactor.value.trim(),
        })),
        ufSeries: this.ufSeries.controls.map((series) => ({
          uf: series.controls.uf.value,
          monthlyMm: series.controls.monthlyMm.controls.map((cell) =>
            cell.value.trim(),
          ),
        })),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Parâmetros de chuva salvos', 'Fechar', {
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
    this.api.getRainfall().subscribe({
      next: (version) => {
        this.currentVersion.set(version);
        this.rebuildForm(version);
        this.form.enable({ emitEvent: false });
      },
      error: () =>
        this.serverError.set(
          'Não foi possível carregar os parâmetros vigentes; recarregue a página antes de criar uma nova versão',
        ),
    });
  }

  private rebuildForm(version: RainfallParametersVersion): void {
    this.bands.clear({ emitEvent: false });
    const bands = [...version.parameters.bands].sort(
      (a, b) => a.position - b.position,
    );
    bands.forEach((band, index) => {
      const isLast = index === bands.length - 1;
      this.bands.push(
        new FormGroup<BandGroup>({
          position: new FormControl(band.position, { nonNullable: true }),
          upperLimitMm: new FormControl(band.upperLimitMm ?? '', {
            nonNullable: true,
            validators: isLast
              ? []
              : [Validators.required, decimalScaleValidator(1)],
          }),
          productivityFactor: new FormControl(band.productivityFactor, {
            nonNullable: true,
            validators: [
              Validators.required,
              decimalScaleValidator(4),
              factorRangeValidator,
            ],
          }),
        }),
        { emitEvent: false },
      );
    });

    this.ufSeries.clear({ emitEvent: false });
    for (const series of version.parameters.ufSeries) {
      this.ufSeries.push(
        new FormGroup<UfGroup>({
          uf: new FormControl(series.uf, { nonNullable: true }),
          monthlyMm: new FormArray(
            series.monthlyMm.map(
              (mm) =>
                new FormControl(mm, {
                  nonNullable: true,
                  validators: [Validators.required, decimalScaleValidator(1)],
                }),
            ),
          ),
        }),
        { emitEvent: false },
      );
    }
  }
}
