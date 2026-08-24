import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  DATE_PATTERN,
  GuyWireVersionInput,
  POSITIVE_DECIMAL_PATTERN,
  POSITIVE_INT_PATTERN,
} from '@lt-offers/domain';
import { intOrNull, orNull } from './form-utils';
import { GuyWiresApi } from './guy-wires-api.service';

@Component({
  selector: 'app-guy-wire-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section>
      <h2>
        {{
          editId() ? 'Nova versão do cabo de tirante' : 'Novo cabo de tirante'
        }}
      </h2>
      <p>
        Campos numéricos usam ponto como separador decimal. Campo em branco
        significa "não informado" — diferente de zero.
      </p>

      <form [formGroup]="form" (ngSubmit)="save()">
        @if (!editId()) {
          <div>
            <label for="code">Código *</label>
            <input id="code" formControlName="code" maxlength="50" />
            @if (errorFor('code')) {
              <p class="error" role="alert">{{ errorFor('code') }}</p>
            }
          </div>
        } @else {
          <p>
            Código: <strong>{{ currentCode() }}</strong>
          </p>
        }

        <div>
          <label for="description">Descrição</label>
          <input
            id="description"
            formControlName="description"
            maxlength="200"
          />
        </div>

        <div>
          <label for="weightTonPerKm">Peso (ton/km)</label>
          <input
            id="weightTonPerKm"
            formControlName="weightTonPerKm"
            inputmode="decimal"
          />
          @if (errorFor('weightTonPerKm')) {
            <p class="error" role="alert">{{ errorFor('weightTonPerKm') }}</p>
          }
        </div>

        <div>
          <label for="reelLengthM">Bobina (m)</label>
          <input
            id="reelLengthM"
            formControlName="reelLengthM"
            inputmode="decimal"
          />
          @if (errorFor('reelLengthM')) {
            <p class="error" role="alert">{{ errorFor('reelLengthM') }}</p>
          }
        </div>

        <div>
          <label for="diameterMm">Diâmetro (mm)</label>
          <input
            id="diameterMm"
            formControlName="diameterMm"
            inputmode="decimal"
          />
          @if (errorFor('diameterMm')) {
            <p class="error" role="alert">{{ errorFor('diameterMm') }}</p>
          }
        </div>

        <div>
          <label for="utsKn">UTS — carga de ruptura (kN)</label>
          <input id="utsKn" formControlName="utsKn" inputmode="decimal" />
          @if (errorFor('utsKn')) {
            <p class="error" role="alert">{{ errorFor('utsKn') }}</p>
          }
        </div>

        <div>
          <label for="galvanizationClass">Classe de galvanização</label>
          <input
            id="galvanizationClass"
            formControlName="galvanizationClass"
            maxlength="50"
          />
        </div>

        <div>
          <label for="strengthGrade">Grau de resistência</label>
          <input
            id="strengthGrade"
            formControlName="strengthGrade"
            maxlength="50"
          />
        </div>

        <div>
          <label for="wireCount">Número de fios</label>
          <input
            id="wireCount"
            formControlName="wireCount"
            inputmode="numeric"
          />
          @if (errorFor('wireCount')) {
            <p class="error" role="alert">{{ errorFor('wireCount') }}</p>
          }
        </div>

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
        <a routerLink="/catalogs/guy-wires">Cancelar</a>
      </form>
    </section>
  `,
  styles: `
    form {
      display: grid;
      gap: 0.75rem;
      max-width: 28rem;
    }
    label {
      display: block;
      font-weight: 600;
    }
    input {
      width: 100%;
      padding: 0.35rem;
    }
    .error {
      color: #b91c1c;
      margin: 0.15rem 0 0;
    }
  `,
})
export class GuyWireFormComponent {
  private readonly api = inject(GuyWiresApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly editId = signal<number | null>(null);
  readonly currentCode = signal('');
  readonly serverError = signal('');
  readonly saving = signal(false);

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    weightTonPerKm: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_DECIMAL_PATTERN)],
    }),
    reelLengthM: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_DECIMAL_PATTERN)],
    }),
    diameterMm: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_DECIMAL_PATTERN)],
    }),
    utsKn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_DECIMAL_PATTERN)],
    }),
    galvanizationClass: new FormControl('', { nonNullable: true }),
    strengthGrade: new FormControl('', { nonNullable: true }),
    wireCount: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(POSITIVE_INT_PATTERN)],
    }),
    effectiveFrom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(DATE_PATTERN)],
    }),
  });

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
    if (field === 'wireCount') {
      return 'Informe um número inteiro positivo (ex.: 7)';
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
          code: this.form.controls.code.value.trim(),
        });

    operation.subscribe({
      next: () => this.router.navigate(['/catalogs/guy-wires']),
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
            weightTonPerKm: latest.weightTonPerKm ?? '',
            reelLengthM: latest.reelLengthM ?? '',
            diameterMm: latest.diameterMm ?? '',
            utsKn: latest.utsKn ?? '',
            galvanizationClass: latest.galvanizationClass ?? '',
            strengthGrade: latest.strengthGrade ?? '',
            wireCount: latest.wireCount?.toString() ?? '',
          });
        }
        this.form.enable({ emitEvent: false });
      },
      error: () =>
        this.serverError.set(
          'Não foi possível carregar os dados atuais do cabo; recarregue a página antes de criar uma nova versão',
        ),
    });
  }

  /** Campo em branco vira null (não informado) — nunca "0" implícito (RNF-09). */
  private toInput(): GuyWireVersionInput {
    const value = this.form.getRawValue();
    return {
      description: orNull(value.description),
      weightTonPerKm: orNull(value.weightTonPerKm),
      reelLengthM: orNull(value.reelLengthM),
      diameterMm: orNull(value.diameterMm),
      utsKn: orNull(value.utsKn),
      galvanizationClass: orNull(value.galvanizationClass),
      strengthGrade: orNull(value.strengthGrade),
      wireCount: intOrNull(value.wireCount),
      ...(value.effectiveFrom.trim() !== ''
        ? { effectiveFrom: value.effectiveFrom.trim() }
        : {}),
    };
  }
}
