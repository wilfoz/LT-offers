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
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ConductorCableVersionInput,
  DATE_PATTERN,
  POSITIVE_DECIMAL_PATTERN,
} from '@lt-offers/domain';
import { ConductorCablesApi } from './conductor-cables-api.service';
import { orNull } from './form-utils';

@Component({
  selector: 'app-conductor-cable-form',
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
        {{ editId() ? 'Nova versão do cabo condutor' : 'Novo cabo condutor' }}
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
          class="col-12"
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
          <mat-label>Peso (ton/km)</mat-label>
          <input
            matInput
            id="weightTonPerKm"
            formControlName="weightTonPerKm"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('weightTonPerKm')) {
            <mat-error>{{ errorFor('weightTonPerKm') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Bobina (m)</mat-label>
          <input
            matInput
            id="reelLengthM"
            formControlName="reelLengthM"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('reelLengthM')) {
            <mat-error>{{ errorFor('reelLengthM') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Diâmetro (mm)</mat-label>
          <input
            matInput
            id="diameterMm"
            formControlName="diameterMm"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('diameterMm')) {
            <mat-error>{{ errorFor('diameterMm') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>UTS — carga de ruptura (kN)</mat-label>
          <input
            matInput
            id="utsKn"
            formControlName="utsKn"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('utsKn')) {
            <mat-error>{{ errorFor('utsKn') }}</mat-error>
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
          <a matButton routerLink="/catalogs/conductor-cables">Cancelar</a>
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
export class ConductorCableFormComponent {
  private readonly api = inject(ConductorCablesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

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
    effectiveFrom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(DATE_PATTERN)],
    }),
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam === null ? null : Number(idParam);
    if (id !== null && Number.isInteger(id) && id > 0) {
      this.prepareEdit(id);
    } else {
      this.form.controls.code.addValidators(Validators.required);
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
      next: () => {
        this.snackBar.open('Cabo condutor salvo', 'Fechar', { duration: 4000 });
        this.router.navigate(['/catalogs/conductor-cables']);
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
    this.form.disable();
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
          });
        }
        this.form.enable();
      },
      error: () =>
        this.serverError.set(
          'Não foi possível carregar os dados atuais do cabo; recarregue a página antes de criar uma nova versão',
        ),
    });
  }

  /** Campo em branco vira null (não informado) — nunca "0" implícito (RNF-09). */
  private toInput(): ConductorCableVersionInput {
    const value = this.form.getRawValue();
    return {
      description: orNull(value.description),
      weightTonPerKm: orNull(value.weightTonPerKm),
      reelLengthM: orNull(value.reelLengthM),
      diameterMm: orNull(value.diameterMm),
      utsKn: orNull(value.utsKn),
      ...(value.effectiveFrom.trim() !== ''
        ? { effectiveFrom: value.effectiveFrom.trim() }
        : {}),
    };
  }
}
