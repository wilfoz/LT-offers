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
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  DATE_PATTERN,
  NON_NEGATIVE_INT_PATTERN,
  SoilTypeVersionInput,
} from '@lt-offers/domain';
import { decimalScaleValidator, intOrNull, orNull } from './form-utils';
import { SoilTypesApi } from './soil-types-api.service';

// Escala de cada campo decimal = precisão da coluna no schema (fonte única
// para o validator e para a mensagem de erro); zero permitido.
const DECIMAL_SCALES = {
  allowableCompressionStressKgfCm2: 2,
  specificWeightKgfM3: 2,
  internalFrictionAngleDeg: 3,
  cohesionKgCm2: 3,
} as const;

type DecimalField = keyof typeof DECIMAL_SCALES;

// Faixa de NSPT espelhando a API: meia-faixa é rejeitada (par completo ou
// nenhum) e mínimo inclusivo deve ser menor que máximo exclusivo. Validador
// de grupo — o erro é exibido junto aos dois campos.
function nsptRangeValidator(group: AbstractControl): ValidationErrors | null {
  const min = String(group.get('nsptMin')?.value ?? '').trim();
  const max = String(group.get('nsptMax')?.value ?? '').trim();
  if (min === '' && max === '') {
    return null;
  }
  if (min === '' || max === '') {
    return { nsptPair: true };
  }
  if (Number(min) >= Number(max)) {
    return { nsptOrder: true };
  }
  return null;
}

@Component({
  selector: 'app-soil-type-form',
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
        {{ editId() ? 'Nova versão do tipo de solo' : 'Novo tipo de solo' }}
      </h2>
      <p>
        Campos numéricos usam ponto como separador decimal. Campo em branco
        significa "não informado" — diferente de zero.
      </p>

      <form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
        @if (!editId()) {
          <mat-form-field
            appearance="outline"
            floatLabel="always"
            subscriptSizing="dynamic"
            class="col-6"
          >
            <mat-label>Código *</mat-label>
            <input matInput id="code" formControlName="code" maxlength="50" />
            <mat-hint>Ex.: I, II, IVS, R, E, IA</mat-hint>
            @if (errorFor('code')) {
              <mat-error>{{ errorFor('code') }}</mat-error>
            }
          </mat-form-field>
        } @else {
          <p class="col-12">
            Código: <strong class="mono">{{ currentCode() }}</strong>
          </p>
        }

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Descrição</mat-label>
          <input
            matInput
            id="description"
            formControlName="description"
            maxlength="200"
          />
          <mat-hint>Em branco = não informado</mat-hint>
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Submerso</mat-label>
          <mat-select id="submerged" formControlName="submerged">
            <mat-option value="">Não informado</mat-option>
            <mat-option value="true">Sim</mat-option>
            <mat-option value="false">Não</mat-option>
          </mat-select>
          <mat-hint>Não informado conta como pendência</mat-hint>
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Tensão admissível à compressão (kgf/cm²)</mat-label>
          <input
            matInput
            id="allowableCompressionStressKgfCm2"
            formControlName="allowableCompressionStressKgfCm2"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('allowableCompressionStressKgfCm2')) {
            <mat-error>
              {{ errorFor('allowableCompressionStressKgfCm2') }}
            </mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Peso específico (kgf/m³)</mat-label>
          <input
            matInput
            id="specificWeightKgfM3"
            formControlName="specificWeightKgfM3"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('specificWeightKgfM3')) {
            <mat-error>{{ errorFor('specificWeightKgfM3') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Ângulo de atrito interno (°)</mat-label>
          <input
            matInput
            id="internalFrictionAngleDeg"
            formControlName="internalFrictionAngleDeg"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('internalFrictionAngleDeg')) {
            <mat-error>{{ errorFor('internalFrictionAngleDeg') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Coesão (kg/cm²)</mat-label>
          <input
            matInput
            id="cohesionKgCm2"
            formControlName="cohesionKgCm2"
            inputmode="decimal"
          />
          <mat-hint>Não se aplica a rocha — deixe em branco</mat-hint>
          @if (errorFor('cohesionKgCm2')) {
            <mat-error>{{ errorFor('cohesionKgCm2') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-3"
        >
          <mat-label>NSPT mínimo (inclusivo)</mat-label>
          <input
            matInput
            id="nsptMin"
            formControlName="nsptMin"
            inputmode="numeric"
          />
          @if (errorFor('nsptMin')) {
            <mat-error>{{ errorFor('nsptMin') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-3"
        >
          <mat-label>NSPT máximo (exclusivo)</mat-label>
          <input
            matInput
            id="nsptMax"
            formControlName="nsptMax"
            inputmode="numeric"
          />
          @if (errorFor('nsptMax')) {
            <mat-error>{{ errorFor('nsptMax') }}</mat-error>
          }
        </mat-form-field>

        @if (nsptRangeError()) {
          <p class="error col-12" role="alert">{{ nsptRangeError() }}</p>
        }

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
          <a matButton routerLink="/catalogs/soil-types">Cancelar</a>
        </div>
      </form>
    </section>
  `,
  styles: `
    form {
      max-width: 48rem;
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
  `,
})
export class SoilTypeFormComponent {
  private readonly api = inject(SoilTypesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly editId = signal<number | null>(null);
  readonly currentCode = signal('');
  readonly serverError = signal('');
  readonly saving = signal(false);

  readonly form = new FormGroup(
    {
      code: new FormControl('', { nonNullable: true }),
      description: new FormControl('', { nonNullable: true }),
      submerged: new FormControl<'' | 'true' | 'false'>('', {
        nonNullable: true,
      }),
      allowableCompressionStressKgfCm2: new FormControl('', {
        nonNullable: true,
        validators: [
          decimalScaleValidator(
            DECIMAL_SCALES.allowableCompressionStressKgfCm2,
          ),
        ],
      }),
      specificWeightKgfM3: new FormControl('', {
        nonNullable: true,
        validators: [decimalScaleValidator(DECIMAL_SCALES.specificWeightKgfM3)],
      }),
      internalFrictionAngleDeg: new FormControl('', {
        nonNullable: true,
        validators: [
          decimalScaleValidator(DECIMAL_SCALES.internalFrictionAngleDeg),
        ],
      }),
      cohesionKgCm2: new FormControl('', {
        nonNullable: true,
        validators: [decimalScaleValidator(DECIMAL_SCALES.cohesionKgCm2)],
      }),
      nsptMin: new FormControl('', {
        nonNullable: true,
        validators: [Validators.pattern(NON_NEGATIVE_INT_PATTERN)],
      }),
      nsptMax: new FormControl('', {
        nonNullable: true,
        validators: [Validators.pattern(NON_NEGATIVE_INT_PATTERN)],
      }),
      effectiveFrom: new FormControl('', {
        nonNullable: true,
        validators: [Validators.pattern(DATE_PATTERN)],
      }),
    },
    { validators: [nsptRangeValidator] },
  );

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === null) {
      this.form.controls.code.addValidators(Validators.required);
    } else {
      const id = Number(idParam);
      if (Number.isInteger(id) && id > 0) {
        this.prepareEdit(id);
      } else {
        this.serverError.set('Identificador inválido');
        this.form.disable({ emitEvent: false });
      }
    }
  }

  errorFor(field: keyof typeof this.form.controls): string {
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
    if (field === 'nsptMin' || field === 'nsptMax') {
      return 'Informe um número inteiro maior ou igual a zero';
    }
    if (control.hasError('decimalScale')) {
      return `Use no máximo ${DECIMAL_SCALES[field as DecimalField]} casas decimais`;
    }
    return 'Informe um número decimal positivo com ponto (ex.: 12.34)';
  }

  /** Erro da faixa como um todo (par incompleto ou invertida), pós-toque. */
  nsptRangeError(): string {
    const { nsptMin, nsptMax } = this.form.controls;
    if (!nsptMin.touched && !nsptMax.touched) {
      return '';
    }
    if (this.form.hasError('nsptPair')) {
      return 'Informe a faixa de NSPT completa (mínimo e máximo) ou deixe ambos em branco';
    }
    if (this.form.hasError('nsptOrder')) {
      return 'O NSPT mínimo deve ser menor que o NSPT máximo';
    }
    return '';
  }

  save(): void {
    // Formulário desabilitado = prefill da edição pendente ou falho; salvar
    // aqui gravaria uma versão toda nula por cima dos valores vigentes.
    if (this.form.disabled) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    this.serverError.set('');

    const id = this.editId();
    const input = this.toInput();
    const operation = id
      ? this.api.createVersion(id, {
          ...input,
          effectiveFrom: this.form.getRawValue().effectiveFrom.trim(),
        })
      : this.api.create({
          ...input,
          code: this.form.controls.code.value.trim(),
        });

    operation.subscribe({
      next: () => {
        this.snackBar.open('Tipo de solo salvo', 'Fechar', { duration: 4000 });
        this.router.navigate(['/catalogs/soil-types']);
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

  private prepareEdit(id: number): void {
    this.editId.set(id);
    this.form.controls.effectiveFrom.addValidators(Validators.required);
    this.form.disable({ emitEvent: false });
    this.api.history(id).subscribe({
      next: (history) => {
        this.currentCode.set(history.code);
        const latest = history.versions[0];
        if (latest) {
          this.form.patchValue({
            description: latest.description ?? '',
            submerged:
              latest.submerged === null
                ? ''
                : latest.submerged
                  ? 'true'
                  : 'false',
            allowableCompressionStressKgfCm2:
              latest.allowableCompressionStressKgfCm2 ?? '',
            specificWeightKgfM3: latest.specificWeightKgfM3 ?? '',
            internalFrictionAngleDeg: latest.internalFrictionAngleDeg ?? '',
            cohesionKgCm2: latest.cohesionKgCm2 ?? '',
            nsptMin: latest.nsptMin === null ? '' : String(latest.nsptMin),
            nsptMax: latest.nsptMax === null ? '' : String(latest.nsptMax),
          });
        }
        this.form.enable({ emitEvent: false });
      },
      error: () =>
        this.serverError.set(
          'Não foi possível carregar os dados atuais do tipo de solo; recarregue a página antes de criar uma nova versão',
        ),
    });
  }

  /** Campo em branco vira null (não informado) — nunca "0" implícito (RNF-09). */
  private toInput(): SoilTypeVersionInput {
    const value = this.form.getRawValue();
    return {
      description: orNull(value.description),
      submerged: value.submerged === '' ? null : value.submerged === 'true',
      allowableCompressionStressKgfCm2: orNull(
        value.allowableCompressionStressKgfCm2,
      ),
      specificWeightKgfM3: orNull(value.specificWeightKgfM3),
      internalFrictionAngleDeg: orNull(value.internalFrictionAngleDeg),
      cohesionKgCm2: orNull(value.cohesionKgCm2),
      nsptMin: intOrNull(value.nsptMin),
      nsptMax: intOrNull(value.nsptMax),
      ...(value.effectiveFrom.trim() !== ''
        ? { effectiveFrom: value.effectiveFrom.trim() }
        : {}),
    };
  }
}
