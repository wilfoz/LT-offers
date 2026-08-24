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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  DATE_PATTERN,
  NON_NEGATIVE_INT_PATTERN,
  POSITIVE_DECIMAL_PATTERN,
  TOWER_FUNCTIONS,
  TowerFunction,
  TowerTypeVersionInput,
  TowerWeightPoint,
} from '@lt-offers/domain';
import { intOrNull } from './form-utils';
import { TOWER_FUNCTION_LABELS } from './tower-function-labels';
import { TowerTypesApi } from './tower-types-api.service';

type WeightRowGroup = FormGroup<{
  heightM: FormControl<string>;
  weightKg: FormControl<string>;
}>;

// Espelha a validação da API: decimal positivo (> 0) com escala limitada à
// precisão da coluna do banco (altura 3 casas, peso 2).
function weightValueValidator(maxScale: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (value === '') {
      return null; // required é validador próprio
    }
    if (!POSITIVE_DECIMAL_PATTERN.test(value) || Number(value) <= 0) {
      return { weightValue: true };
    }
    const decimals = value.split('.')[1] ?? '';
    return decimals.length <= maxScale ? null : { weightScale: true };
  };
}

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
  imports: [ReactiveFormsModule, RouterLink],
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

      <form [formGroup]="form" (ngSubmit)="save()">
        @if (!editId()) {
          <div>
            <label for="code">Sigla *</label>
            <input id="code" formControlName="code" maxlength="30" />
            @if (errorFor('code')) {
              <p class="error" role="alert">{{ errorFor('code') }}</p>
            }
          </div>

          <div>
            <label for="function">Função *</label>
            <select id="function" formControlName="function">
              <option value="">Selecione…</option>
              @for (option of functionOptions; track option) {
                <option [value]="option">{{ functionLabels[option] }}</option>
              }
            </select>
            @if (errorFor('function')) {
              <p class="error" role="alert">{{ errorFor('function') }}</p>
            }
          </div>
        } @else {
          <p>
            Sigla: <strong>{{ currentCode() }}</strong> · Função:
            <strong>{{ currentFunctionLabel() }}</strong>
            (fixa desde a criação)
          </p>
        }

        <div>
          <label for="guyCount">Quantidade de estais</label>
          <input id="guyCount" formControlName="guyCount" inputmode="numeric" />
          @if (errorFor('guyCount')) {
            <p class="error" role="alert">{{ errorFor('guyCount') }}</p>
          }
        </div>

        <fieldset formArrayName="weights">
          <legend>Tabela peso × altura</legend>
          @if (weights.controls.length === 0) {
            <p>Nenhum ponto informado — o tipo ficará com pendência.</p>
          }
          @for (row of weights.controls; track row; let i = $index) {
            <div class="weight-row" [formGroupName]="i">
              <div>
                <label [for]="'heightM-' + i">Altura (m)</label>
                <input
                  [id]="'heightM-' + i"
                  formControlName="heightM"
                  inputmode="decimal"
                />
                @if (rowError(i, 'heightM')) {
                  <p class="error" role="alert">{{ rowError(i, 'heightM') }}</p>
                }
              </div>
              <div>
                <label [for]="'weightKg-' + i">Peso (kg)</label>
                <input
                  [id]="'weightKg-' + i"
                  formControlName="weightKg"
                  inputmode="decimal"
                />
                @if (rowError(i, 'weightKg')) {
                  <p class="error" role="alert">
                    {{ rowError(i, 'weightKg') }}
                  </p>
                }
              </div>
              <button type="button" (click)="removeWeight(i)">
                Remover ponto
              </button>
            </div>
          }
          <button type="button" (click)="addWeight()">Adicionar ponto</button>
          @if (duplicateHeightsError()) {
            <p class="error" role="alert">
              Há alturas duplicadas na tabela peso × altura
            </p>
          }
        </fieldset>

        <div>
          <label for="effectiveFrom">
            Início de vigência
            {{ editId() ? '*' : '(opcional; padrão hoje)' }}
          </label>
          <input
            id="effectiveFrom"
            formControlName="effectiveFrom"
            type="date"
          />
          @if (errorFor('effectiveFrom')) {
            <p class="error" role="alert">{{ errorFor('effectiveFrom') }}</p>
          }
        </div>

        @if (serverError()) {
          <p class="error" role="alert">{{ serverError() }}</p>
        }

        <button type="submit" [disabled]="saving() || form.disabled">
          Salvar
        </button>
        <a [routerLink]="['/catalogs/structure-series', seriesId()]">
          Cancelar
        </a>
      </form>
    </section>
  `,
  styles: `
    form {
      display: grid;
      gap: 0.75rem;
      max-width: 34rem;
    }
    label {
      display: block;
      font-weight: 600;
    }
    input,
    select {
      width: 100%;
      padding: 0.35rem;
    }
    fieldset {
      display: grid;
      gap: 0.75rem;
      border: 1px solid #ddd;
      padding: 0.75rem;
    }
    .weight-row {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 0.5rem;
      align-items: end;
    }
    .error {
      color: #b91c1c;
      margin: 0.15rem 0 0;
    }
  `,
})
export class TowerTypeFormComponent {
  private readonly api = inject(TowerTypesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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
          validators: [Validators.required, weightValueValidator(3)],
        }),
        weightKg: new FormControl(point?.weightKg ?? '', {
          nonNullable: true,
          validators: [Validators.required, weightValueValidator(2)],
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
    if (control.hasError('weightScale')) {
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
      next: () =>
        this.router.navigate(['/catalogs/structure-series', seriesId]),
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
