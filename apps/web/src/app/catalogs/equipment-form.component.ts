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
import { DATE_PATTERN, EquipmentVersionInput } from '@lt-offers/domain';
import { decimalScaleValidator, intOrNull, orNull } from './form-utils';
import { EquipmentApi } from './equipment-api.service';

const DECIMAL_SCALES = {
  externalRentalMonthly: 2,
  internalRentalMonthly: 2,
  purchasePrice: 2,
} as const;

type DecimalField = keyof typeof DECIMAL_SCALES;

@Component({
  selector: 'app-equipment-form',
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
        {{ editId() ? 'Nova versão do equipamento' : 'Novo equipamento' }}
      </h2>
      <p>
        Campos monetários usam ponto como separador decimal. Campo em branco
        significa "não informado" — diferente de zero.
      </p>

      @if (serverError()) {
        <p class="error" role="alert">{{ serverError() }}</p>
      }

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
          class="col-6"
        >
          <mat-label>Descrição *</mat-label>
          <input
            matInput
            id="description"
            formControlName="description"
            maxlength="200"
          />
          @if (errorFor('description')) {
            <mat-error>{{ errorFor('description') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Categoria</mat-label>
          <input
            matInput
            id="category"
            formControlName="category"
            maxlength="50"
          />
          <mat-hint>Ex.: Guincho, Trator, Caminhão</mat-hint>
          @if (errorFor('category')) {
            <mat-error>{{ errorFor('category') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Locação externa (R$/mês)</mat-label>
          <input
            matInput
            id="externalRentalMonthly"
            formControlName="externalRentalMonthly"
            type="text"
            inputmode="decimal"
          />
          <mat-hint>Ex.: 15000.00 (em branco = não informado)</mat-hint>
          @if (errorFor('externalRentalMonthly')) {
            <mat-error>{{ errorFor('externalRentalMonthly') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Locação interna (R$/mês)</mat-label>
          <input
            matInput
            id="internalRentalMonthly"
            formControlName="internalRentalMonthly"
            type="text"
            inputmode="decimal"
          />
          <mat-hint>Ex.: 11000.00 (em branco = não informado)</mat-hint>
          @if (errorFor('internalRentalMonthly')) {
            <mat-error>{{ errorFor('internalRentalMonthly') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Preço de aquisição (R$)</mat-label>
          <input
            matInput
            id="purchasePrice"
            formControlName="purchasePrice"
            type="text"
            inputmode="decimal"
          />
          <mat-hint>Ex.: 450000.00 (em branco = não informado)</mat-hint>
          @if (errorFor('purchasePrice')) {
            <mat-error>{{ errorFor('purchasePrice') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Amortização (anos)</mat-label>
          <input
            matInput
            id="depreciationYears"
            formControlName="depreciationYears"
            type="text"
            inputmode="numeric"
          />
          <mat-hint>Número inteiro maior que zero (ex.: 5)</mat-hint>
          @if (errorFor('depreciationYears')) {
            <mat-error>{{ errorFor('depreciationYears') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Início de vigência {{ editId() ? '*' : '' }}</mat-label>
          <input
            matInput
            id="effectiveFrom"
            formControlName="effectiveFrom"
            type="text"
            placeholder="AAAA-MM-DD"
          />
          <mat-hint>
            {{
              editId()
                ? 'Obrigatório para nova versão (AAAA-MM-DD)'
                : 'Opcional — em branco = hoje'
            }}
          </mat-hint>
          @if (errorFor('effectiveFrom')) {
            <mat-error>{{ errorFor('effectiveFrom') }}</mat-error>
          }
        </mat-form-field>

        <div class="actions col-12">
          <a matButton routerLink="..">Cancelar</a>
          <button matButton="filled" type="submit" [disabled]="saving()">
            Salvar
          </button>
        </div>
      </form>
    </section>
  `,
  styles: `
    .form-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 1rem;
    }
    .col-6 {
      grid-column: span 6;
    }
    .col-12 {
      grid-column: span 12;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .error {
      color: var(--mat-sys-error);
    }
    @media (max-width: 768px) {
      .col-6 {
        grid-column: span 12;
      }
    }
  `,
})
export class EquipmentFormComponent {
  private readonly api = inject(EquipmentApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly editId = signal<number | null>(null);
  readonly currentCode = signal('');
  readonly saving = signal(false);
  readonly serverError = signal('');

  readonly form = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    category: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(50)],
    }),
    externalRentalMonthly: new FormControl<string | null>(null, [
      decimalScaleValidator(DECIMAL_SCALES.externalRentalMonthly),
    ]),
    internalRentalMonthly: new FormControl<string | null>(null, [
      decimalScaleValidator(DECIMAL_SCALES.internalRentalMonthly),
    ]),
    purchasePrice: new FormControl<string | null>(null, [
      decimalScaleValidator(DECIMAL_SCALES.purchasePrice),
    ]),
    depreciationYears: new FormControl<string | null>(null, [
      Validators.pattern(/^[1-9]\d*$/),
    ]),
    effectiveFrom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(DATE_PATTERN)],
    }),
  });

  constructor() {
    const rawId = this.route.snapshot.paramMap.get('id');
    if (rawId) {
      const id = Number(rawId);
      if (Number.isInteger(id) && id > 0) {
        this.editId.set(id);
        this.form.controls.effectiveFrom.addValidators(Validators.required);
        this.form.controls.code.disable();
        this.loadCurrent(id);
      } else {
        this.serverError.set('Identificador inválido');
        this.form.disable({ emitEvent: false });
      }
    }
  }

  private loadCurrent(id: number): void {
    this.form.disable({ emitEvent: false });
    this.api.get(id).subscribe({
      next: (summary) => {
        this.currentCode.set(summary.code);
        this.form.controls.description.setValue(summary.description);
        this.form.controls.category.setValue(summary.category ?? '');
        const v = summary.effectiveVersion;
        if (v) {
          this.form.patchValue({
            externalRentalMonthly: v.externalRentalMonthly,
            internalRentalMonthly: v.internalRentalMonthly,
            purchasePrice: v.purchasePrice,
            depreciationYears:
              v.depreciationYears === null ? null : String(v.depreciationYears),
          });
        }
        this.form.enable({ emitEvent: false });
        this.form.controls.code.disable({ emitEvent: false });
      },
      error: () => {
        this.serverError.set(
          'Não foi possível carregar os dados atuais do equipamento; recarregue a página antes de criar uma nova versão',
        );
      },
    });
  }

  save(): void {
    if (this.form.disabled) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    const versionData: EquipmentVersionInput = {
      externalRentalMonthly: orNull(val.externalRentalMonthly ?? ''),
      internalRentalMonthly: orNull(val.internalRentalMonthly ?? ''),
      purchasePrice: orNull(val.purchasePrice ?? ''),
      depreciationYears: intOrNull(val.depreciationYears ?? ''),
      effectiveFrom: orNull(val.effectiveFrom) ?? undefined,
    };

    this.saving.set(true);
    const id = this.editId();

    if (id) {
      this.api
        .createVersion(id, {
          ...versionData,
          effectiveFrom: val.effectiveFrom,
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Nova versão criada com sucesso', 'OK', {
              duration: 3000,
            });
            this.router.navigate(['/catalogs/equipment']);
          },
          error: (err) => {
            this.saving.set(false);
            const msg = err.error?.message || 'Falha ao salvar nova versão';
            this.serverError.set(msg);
            this.snackBar.open(msg, 'Fechar', { duration: 5000 });
          },
        });
    } else {
      this.api
        .create({
          code: val.code.trim(),
          description: val.description.trim(),
          category: orNull(val.category) ?? undefined,
          ...versionData,
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Equipamento criado com sucesso', 'OK', {
              duration: 3000,
            });
            this.router.navigate(['/catalogs/equipment']);
          },
          error: (err) => {
            this.saving.set(false);
            const msg = err.error?.message || 'Falha ao criar equipamento';
            this.serverError.set(msg);
            this.snackBar.open(msg, 'Fechar', { duration: 5000 });
          },
        });
    }
  }

  errorFor(field: string): string | null {
    const c = this.form.get(field);
    if (!c || !c.touched || !c.errors) return null;

    if (c.errors['required']) {
      if (field === 'code') return 'O código é obrigatório';
      if (field === 'description') return 'A descrição é obrigatória';
      if (field === 'effectiveFrom')
        return 'A data de início de vigência é obrigatória';
      return 'Campo obrigatório';
    }
    if (c.errors['pattern']) {
      if (field === 'depreciationYears') {
        return 'Informe um número inteiro maior que zero';
      }
      return 'Formato inválido (esperado AAAA-MM-DD)';
    }
    if (c.errors['invalidDecimal']) {
      return 'Informe um valor numérico maior ou igual a zero';
    }
    if (c.errors['decimalScale']) {
      const max = DECIMAL_SCALES[field as DecimalField] ?? 2;
      return `Use no máximo ${max} casas decimais`;
    }
    return 'Campo inválido';
  }
}
