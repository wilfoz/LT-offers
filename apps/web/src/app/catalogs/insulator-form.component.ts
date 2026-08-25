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
import { DATE_PATTERN, InsulatorVersionInput } from '@lt-offers/domain';
import { decimalScaleValidator, orNull } from './form-utils';
import { InsulatorsApi } from './insulators-api.service';

// Validação de escala espelhando a API (zero permitido — o spec só rejeita
// negativo/não numérico): decimalScaleValidator compartilhado em form-utils.ts.
// Escala de cada campo decimal = precisão da coluna no schema (fonte única
// para o validator e para a mensagem de erro)
const DECIMAL_SCALES = {
  ruptureStrengthKn: 2,
  diameterMm: 3,
  spacingMm: 3,
  creepageDistanceMm: 3,
} as const;

type DecimalField = keyof typeof DECIMAL_SCALES;

@Component({
  selector: 'app-insulator-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <section>
      <h2>{{ editId() ? 'Nova versão do isolador' : 'Novo isolador' }}</h2>
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
          <mat-label>Tipo</mat-label>
          <input matInput id="type" formControlName="type" maxlength="100" />
          <mat-hint>Texto livre (ex.: vidro, porcelana, polimérico)</mat-hint>
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Fabricante</mat-label>
          <input
            matInput
            id="manufacturer"
            formControlName="manufacturer"
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
          <mat-label>Perfil</mat-label>
          <input
            matInput
            id="profile"
            formControlName="profile"
            maxlength="100"
          />
          <mat-hint>Texto livre (ex.: standard, antipoluição)</mat-hint>
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Carga de ruptura (kN)</mat-label>
          <input
            matInput
            id="ruptureStrengthKn"
            formControlName="ruptureStrengthKn"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('ruptureStrengthKn')) {
            <mat-error>{{ errorFor('ruptureStrengthKn') }}</mat-error>
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
          <mat-label>Passo (mm)</mat-label>
          <input
            matInput
            id="spacingMm"
            formControlName="spacingMm"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('spacingMm')) {
            <mat-error>{{ errorFor('spacingMm') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Linha de fuga (mm)</mat-label>
          <input
            matInput
            id="creepageDistanceMm"
            formControlName="creepageDistanceMm"
            inputmode="decimal"
          />
          <mat-hint>Em branco = não informado</mat-hint>
          @if (errorFor('creepageDistanceMm')) {
            <mat-error>{{ errorFor('creepageDistanceMm') }}</mat-error>
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
          <a matButton routerLink="/catalogs/insulators">Cancelar</a>
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
export class InsulatorFormComponent {
  private readonly api = inject(InsulatorsApi);
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
    type: new FormControl('', { nonNullable: true }),
    manufacturer: new FormControl('', { nonNullable: true }),
    profile: new FormControl('', { nonNullable: true }),
    ruptureStrengthKn: new FormControl('', {
      nonNullable: true,
      validators: [decimalScaleValidator(DECIMAL_SCALES.ruptureStrengthKn)],
    }),
    diameterMm: new FormControl('', {
      nonNullable: true,
      validators: [decimalScaleValidator(DECIMAL_SCALES.diameterMm)],
    }),
    spacingMm: new FormControl('', {
      nonNullable: true,
      validators: [decimalScaleValidator(DECIMAL_SCALES.spacingMm)],
    }),
    creepageDistanceMm: new FormControl('', {
      nonNullable: true,
      validators: [decimalScaleValidator(DECIMAL_SCALES.creepageDistanceMm)],
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
    if (control.hasError('decimalScale')) {
      return `Use no máximo ${DECIMAL_SCALES[field as DecimalField]} casas decimais`;
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
        this.snackBar.open('Isolador salvo', 'Fechar', { duration: 4000 });
        this.router.navigate(['/catalogs/insulators']);
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
            type: latest.type ?? '',
            manufacturer: latest.manufacturer ?? '',
            profile: latest.profile ?? '',
            ruptureStrengthKn: latest.ruptureStrengthKn ?? '',
            diameterMm: latest.diameterMm ?? '',
            spacingMm: latest.spacingMm ?? '',
            creepageDistanceMm: latest.creepageDistanceMm ?? '',
          });
        }
        this.form.enable({ emitEvent: false });
      },
      error: () =>
        this.serverError.set(
          'Não foi possível carregar os dados atuais do isolador; recarregue a página antes de criar uma nova versão',
        ),
    });
  }

  /** Campo em branco vira null (não informado) — nunca "0" implícito (RNF-09). */
  private toInput(): InsulatorVersionInput {
    const value = this.form.getRawValue();
    return {
      description: orNull(value.description),
      type: orNull(value.type),
      manufacturer: orNull(value.manufacturer),
      profile: orNull(value.profile),
      ruptureStrengthKn: orNull(value.ruptureStrengthKn),
      diameterMm: orNull(value.diameterMm),
      spacingMm: orNull(value.spacingMm),
      creepageDistanceMm: orNull(value.creepageDistanceMm),
      ...(value.effectiveFrom.trim() !== ''
        ? { effectiveFrom: value.effectiveFrom.trim() }
        : {}),
    };
  }
}
