import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  DATE_PATTERN,
  NON_NEGATIVE_INT_PATTERN,
  TOWER_FUNCTIONS,
  TowerFunction,
  TowerTypeVersionInput,
  TowerWeightPoint,
} from '@lt-offers/domain';
import { decimalScaleValidator, intOrNull } from './form-utils';
import { TOWER_FUNCTION_LABELS } from './tower-function-labels';
import { TowerTypesApi } from './tower-types-api.service';

type WeightRowGroup = FormGroup<{
  heightM: FormControl<string>;
  weightKg: FormControl<string>;
}>;

// Validação de escala espelhando a API (altura 3 casas, peso 2; zero também
// inválido): decimalScaleValidator compartilhado em form-utils.ts.

// Duplicata apontada no form antes do submit; "24" e "24.000" são a mesma
// altura (comparação numérica, como na API).
const uniqueHeightsValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const rows = (control as FormArray<WeightRowGroup>).controls;
  const heights = rows
    .map((row) => Number(String(row.controls.heightM.value ?? '').trim()))
    .filter((height) => Number.isFinite(height) && height > 0);
  return new Set(heights).size === heights.length
    ? null
    : { duplicateHeights: true };
};

@Component({
  selector: 'app-tower-type-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <section>
      <h2>
        {{ editId() ? 'Nova versão do tipo de torre' : 'Novo tipo de torre' }}
      </h2>
      <p>
        Campos numéricos usam ponto como separador decimal. Campo em branco
        significa "não informado" — diferente de zero (uma torre autoportante
        tem zero estais).
      </p>

      <form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
        @if (!editId()) {
          <mat-form-field
            appearance="outline"
            floatLabel="always"
            subscriptSizing="dynamic"
            class="col-6"
          >
            <mat-label>Sigla *</mat-label>
            <input matInput id="code" formControlName="code" maxlength="30" />
            @if (errorFor('code')) {
              <mat-error>{{ errorFor('code') }}</mat-error>
            }
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            floatLabel="always"
            subscriptSizing="dynamic"
            class="col-6"
          >
            <mat-label>Função *</mat-label>
            <mat-select id="function" formControlName="function">
              <mat-option value="">Selecione…</mat-option>
              @for (option of functionOptions; track option) {
                <mat-option [value]="option">
                  {{ functionLabels[option] }}
                </mat-option>
              }
            </mat-select>
            @if (errorFor('function')) {
              <mat-error>{{ errorFor('function') }}</mat-error>
            }
          </mat-form-field>
        } @else {
          <p class="col-12">
            Sigla: <strong class="mono">{{ currentCode() }}</strong> · Função:
            <strong>{{ currentFunctionLabel() }}</strong>
            (fixa desde a criação)
          </p>
        }

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Quantidade de estais</mat-label>
          <input
            matInput
            id="guyCount"
            formControlName="guyCount"
            inputmode="numeric"
          />
          <mat-hint>Em branco = não informado; 0 = autoportante</mat-hint>
          @if (errorFor('guyCount')) {
            <mat-error>{{ errorFor('guyCount') }}</mat-error>
          }
        </mat-form-field>

        <fieldset class="col-12" formArrayName="weights">
          <legend>Tabela peso × altura</legend>
          @if (weights.controls.length === 0) {
            <p>Nenhum ponto informado — o tipo ficará com pendência.</p>
          }
          @for (row of weights.controls; track row; let i = $index) {
            <div class="weight-row" [formGroupName]="i">
              <mat-form-field
                appearance="outline"
                floatLabel="always"
                subscriptSizing="dynamic"
              >
                <mat-label>Altura (m)</mat-label>
                <input
                  matInput
                  [id]="'heightM-' + i"
                  formControlName="heightM"
                  inputmode="decimal"
                />
                @if (rowError(i, 'heightM')) {
                  <mat-error>{{ rowError(i, 'heightM') }}</mat-error>
                }
              </mat-form-field>
              <mat-form-field
                appearance="outline"
                floatLabel="always"
                subscriptSizing="dynamic"
              >
                <mat-label>Peso (kg)</mat-label>
                <input
                  matInput
                  [id]="'weightKg-' + i"
                  formControlName="weightKg"
                  inputmode="decimal"
                />
                @if (rowError(i, 'weightKg')) {
                  <mat-error>{{ rowError(i, 'weightKg') }}</mat-error>
                }
              </mat-form-field>
              <button
                matButton="outlined"
                type="button"
                (click)="removeWeight(i)"
              >
                Remover ponto
              </button>
            </div>
          }
          <button matButton="outlined" type="button" (click)="addWeight()">
            Adicionar ponto
          </button>
          @if (duplicateHeightsError()) {
            <p class="error" role="alert">
              Há alturas duplicadas na tabela peso × altura
            </p>
          }
        </fieldset>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>
            Início de vigência {{ editId() ? '*' : '(opcional; padrão hoje)' }}
          </mat-label>
          <input
            matInput
            id="effectiveFrom"
            formControlName="effectiveFrom"
            type="date"
          />
          @if (errorFor('effectiveFrom')) {
            <mat-error>{{ errorFor('effectiveFrom') }}</mat-error>
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
            Salvar
          </button>
          <a
            matButton
            [routerLink]="
              seriesId() !== null
                ? ['/catalogs/structure-series', seriesId()]
                : ['/catalogs/structure-series']
            "
          >
            Cancelar
          </a>
        </div>
      </form>
    </section>
  `,
  styles: `
    form {
      max-width: 48rem;
    }
    fieldset {
      display: grid;
      gap: 1rem;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 0;
      padding: 1rem;
      justify-items: start;
    }
    legend {
      font: var(--mat-sys-label-medium);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--mat-sys-on-surface-variant);
      padding-inline: 0.25rem;
    }
    .weight-row {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 1rem;
      align-items: center;
      width: 100%;
    }
    .error {
      color: var(--mat-sys-error);
      margin: 0.15rem 0 0;
    }
    .actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    @media (max-width: 768px) {
      .weight-row {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class TowerTypeFormComponent {
  private readonly api = inject(TowerTypesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly functionOptions = TOWER_FUNCTIONS;
  readonly functionLabels = TOWER_FUNCTION_LABELS;

  readonly seriesId = signal<number | null>(null);
  readonly editId = signal<number | null>(null);
  readonly currentCode = signal('');
  readonly currentFunctionLabel = signal('');
  readonly serverError = signal('');
  readonly saving = signal(false);

  readonly weights = new FormArray<WeightRowGroup>([], {
    validators: [uniqueHeightsValidator],
  });

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true }),
    function: new FormControl<TowerFunction | ''>('', { nonNullable: true }),
    guyCount: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(NON_NEGATIVE_INT_PATTERN)],
    }),
    weights: this.weights,
    effectiveFrom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(DATE_PATTERN)],
    }),
  });

  constructor() {
    const paramMap = this.route.snapshot.paramMap;
    const seriesIdParam = Number(paramMap.get('seriesId'));
    if (!Number.isInteger(seriesIdParam) || seriesIdParam <= 0) {
      this.serverError.set('Identificador inválido');
      this.form.disable({ emitEvent: false });
      return;
    }
    this.seriesId.set(seriesIdParam);

    const idParam = paramMap.get('id');
    if (idParam === null) {
      this.form.controls.code.addValidators(Validators.required);
      this.form.controls.function.addValidators(Validators.required);
    } else {
      const id = Number(idParam);
      if (Number.isInteger(id) && id > 0) {
        this.prepareEdit(seriesIdParam, id);
      } else {
        this.serverError.set('Identificador inválido');
        this.form.disable({ emitEvent: false });
      }
    }
  }

  addWeight(point?: TowerWeightPoint): void {
    this.weights.push(
      new FormGroup({
        heightM: new FormControl(point?.heightM ?? '', {
          nonNullable: true,
          validators: [
            Validators.required,
            decimalScaleValidator(3, { nonZero: true }),
          ],
        }),
        weightKg: new FormControl(point?.weightKg ?? '', {
          nonNullable: true,
          validators: [
            Validators.required,
            decimalScaleValidator(2, { nonZero: true }),
          ],
        }),
      }),
    );
  }

  removeWeight(index: number): void {
    this.weights.removeAt(index);
  }

  errorFor(field: 'code' | 'function' | 'guyCount' | 'effectiveFrom'): string {
    const control = this.form.controls[field];
    if (!control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (field === 'effectiveFrom') {
      return 'Informe uma data no formato AAAA-MM-DD';
    }
    return 'Informe um número inteiro maior ou igual a zero (0 = autoportante)';
  }

  rowError(index: number, field: 'heightM' | 'weightKg'): string {
    const control = this.weights.at(index)?.controls[field];
    if (!control || !control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control.hasError('decimalScale')) {
      return field === 'heightM'
        ? 'Use no máximo 3 casas decimais'
        : 'Use no máximo 2 casas decimais';
    }
    return 'Informe um número decimal positivo com ponto (ex.: 24.5)';
  }

  duplicateHeightsError(): boolean {
    return this.weights.touched && this.weights.hasError('duplicateHeights');
  }

  save(): void {
    // Formulário desabilitado = prefill da edição pendente ou falho (ou rota
    // inválida); salvar gravaria uma versão nula por cima dos valores vigentes.
    if (this.form.disabled) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const seriesId = this.seriesId();
    if (seriesId === null) {
      return;
    }
    this.saving.set(true);
    this.serverError.set('');

    const id = this.editId();
    const input = this.toInput();
    const operation = id
      ? this.api.createVersion(seriesId, id, {
          ...input,
          effectiveFrom: this.form.getRawValue().effectiveFrom.trim(),
        })
      : this.api.create(seriesId, {
          ...input,
          code: this.form.controls.code.value.trim(),
          function: this.form.controls.function.value as TowerFunction,
        });

    operation.subscribe({
      next: () => {
        this.snackBar.open('Tipo de torre salvo', 'Fechar', { duration: 4000 });
        this.router.navigate(['/catalogs/structure-series', seriesId]);
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

  private prepareEdit(seriesId: number, id: number): void {
    this.editId.set(id);
    this.form.controls.effectiveFrom.addValidators(Validators.required);
    this.form.disable({ emitEvent: false });
    this.api.history(seriesId, id).subscribe({
      next: (history) => {
        this.currentCode.set(history.code);
        this.currentFunctionLabel.set(TOWER_FUNCTION_LABELS[history.function]);
        const latest = history.versions[0];
        if (latest) {
          this.form.patchValue({
            guyCount: latest.guyCount?.toString() ?? '',
          });
          this.weights.clear();
          for (const point of latest.weights) {
            this.addWeight(point);
          }
        }
        this.form.enable({ emitEvent: false });
      },
      error: () =>
        this.serverError.set(
          'Não foi possível carregar os dados atuais do tipo de torre; recarregue a página antes de criar uma nova versão',
        ),
    });
  }

  /**
   * Campo em branco vira null (não informado) — nunca "0" implícito (RNF-09);
   * a tabela vai sempre completa: cada versão grava seu snapshot de pontos.
   */
  private toInput(): TowerTypeVersionInput {
    const value = this.form.getRawValue();
    return {
      guyCount: intOrNull(value.guyCount),
      weights: this.weights.controls.map((row) => ({
        heightM: row.controls.heightM.value.trim(),
        weightKg: row.controls.weightKg.value.trim(),
      })),
      ...(value.effectiveFrom.trim() !== ''
        ? { effectiveFrom: value.effectiveFrom.trim() }
        : {}),
    };
  }
}
