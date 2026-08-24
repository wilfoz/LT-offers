import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  DATE_PATTERN,
  POSITIVE_DECIMAL_PATTERN,
  POSITIVE_INT_PATTERN,
  StructureSeriesVersionInput,
} from '@lt-offers/domain';
import { intOrNull, orNull } from './form-utils';
import { StructureSeriesApi } from './structure-series-api.service';

@Component({
  selector: 'app-structure-series-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <section>
      <h2>
        {{
          editId()
            ? 'Nova versão da série de estrutura'
            : 'Nova série de estrutura'
        }}
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
            <mat-label>Nome *</mat-label>
            <input matInput id="name" formControlName="name" maxlength="100" />
            @if (errorFor('name')) {
              <mat-error>{{ errorFor('name') }}</mat-error>
            }
          </mat-form-field>
        } @else {
          <p class="col-12">
            Nome: <strong>{{ currentName() }}</strong>
          </p>
        }

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Projetista</mat-label>
          <input
            matInput
            id="designer"
            formControlName="designer"
            maxlength="100"
          />
          <mat-hint>Em branco = não informado</mat-hint>
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Tensão (kV)</mat-label>
          <input
            matInput
            id="voltageKv"
            formControlName="voltageKv"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('voltageKv')) {
            <mat-error>{{ errorFor('voltageKv') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Quantidade de circuitos</mat-label>
          <input
            matInput
            id="circuitCount"
            formControlName="circuitCount"
            inputmode="numeric"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('circuitCount')) {
            <mat-error>{{ errorFor('circuitCount') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Cabos por fase</mat-label>
          <input
            matInput
            id="cablesPerPhase"
            formControlName="cablesPerPhase"
            inputmode="numeric"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('cablesPerPhase')) {
            <mat-error>{{ errorFor('cablesPerPhase') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Vento de projeto (m/s)</mat-label>
          <input
            matInput
            id="designWindSpeedMs"
            formControlName="designWindSpeedMs"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('designWindSpeedMs')) {
            <mat-error>{{ errorFor('designWindSpeedMs') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Tipo de isolador</mat-label>
          <input
            matInput
            id="insulatorType"
            formControlName="insulatorType"
            maxlength="100"
          />
          <mat-hint>Em branco = não informado</mat-hint>
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>SIL (MW)</mat-label>
          <input
            matInput
            id="silMw"
            formControlName="silMw"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('silMw')) {
            <mat-error>{{ errorFor('silMw') }}</mat-error>
          }
        </mat-form-field>

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
          <a matButton routerLink="/catalogs/structure-series">Cancelar</a>
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
export class StructureSeriesFormComponent {
  private readonly api = inject(StructureSeriesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly editId = signal<number | null>(null);
  readonly currentName = signal('');
  readonly serverError = signal('');
  readonly saving = signal(false);

  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    designer: new FormControl('', { nonNullable: true }),
    voltageKv: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_DECIMAL_PATTERN)],
    }),
    circuitCount: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_INT_PATTERN)],
    }),
    cablesPerPhase: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_INT_PATTERN)],
    }),
    designWindSpeedMs: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_DECIMAL_PATTERN)],
    }),
    insulatorType: new FormControl('', { nonNullable: true }),
    silMw: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_DECIMAL_PATTERN)],
    }),
    effectiveFrom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(DATE_PATTERN)],
    }),
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === null) {
      this.form.controls.name.addValidators(Validators.required);
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
    if (field === 'circuitCount' || field === 'cablesPerPhase') {
      return 'Informe um número inteiro positivo (ex.: 2)';
    }
    return 'Informe um número decimal positivo com ponto (ex.: 12.34)';
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
          name: this.form.controls.name.value.trim(),
        });

    operation.subscribe({
      next: () => this.router.navigate(['/catalogs/structure-series']),
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
        this.currentName.set(history.name);
        const latest = history.versions[0];
        if (latest) {
          this.form.patchValue({
            designer: latest.designer ?? '',
            voltageKv: latest.voltageKv ?? '',
            circuitCount: latest.circuitCount?.toString() ?? '',
            cablesPerPhase: latest.cablesPerPhase?.toString() ?? '',
            designWindSpeedMs: latest.designWindSpeedMs ?? '',
            insulatorType: latest.insulatorType ?? '',
            silMw: latest.silMw ?? '',
          });
        }
        this.form.enable({ emitEvent: false });
      },
      error: () =>
        this.serverError.set(
          'Não foi possível carregar os dados atuais da série; recarregue a página antes de criar uma nova versão',
        ),
    });
  }

  /** Campo em branco vira null (não informado) — nunca "0" implícito (RNF-09). */
  private toInput(): StructureSeriesVersionInput {
    const value = this.form.getRawValue();
    return {
      designer: orNull(value.designer),
      voltageKv: orNull(value.voltageKv),
      circuitCount: intOrNull(value.circuitCount),
      cablesPerPhase: intOrNull(value.cablesPerPhase),
      designWindSpeedMs: orNull(value.designWindSpeedMs),
      insulatorType: orNull(value.insulatorType),
      silMw: orNull(value.silMw),
      ...(value.effectiveFrom.trim() !== ''
        ? { effectiveFrom: value.effectiveFrom.trim() }
        : {}),
    };
  }
}
