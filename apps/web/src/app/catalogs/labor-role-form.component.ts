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
import { DATE_PATTERN, LaborRoleVersionInput } from '@lt-offers/domain';
import { decimalScaleValidator, orNull } from './form-utils';
import { LaborRolesApi } from './labor-roles-api.service';

const DECIMAL_SCALES = {
  baseSalary: 2,
  hazardPayPercent: 4,
  overtimePercent: 4,
  dsrOvertimePercent: 4,
  socialChargesPercent: 4,
  foodAllowanceMonthly: 2,
  housingMonthly: 2,
  homeLeaveTravelMonthly: 2,
  healthInsuranceMonthly: 2,
  lifeInsuranceMonthly: 2,
} as const;

type DecimalField = keyof typeof DECIMAL_SCALES;

@Component({
  selector: 'app-labor-role-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <section>
      <h2>{{ editId() ? 'Nova versão do cargo' : 'Novo cargo' }}</h2>
      <p>
        Campos numéricos usam ponto como separador decimal. Campo em branco
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
          <mat-label>Nome do cargo *</mat-label>
          <input matInput id="name" formControlName="name" maxlength="100" />
          @if (errorFor('name')) {
            <mat-error>{{ errorFor('name') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Salário base (R$)</mat-label>
          <input
            matInput
            id="baseSalary"
            formControlName="baseSalary"
            type="text"
            inputmode="decimal"
          />
          <mat-hint>Ex.: 5500.00 (em branco = não informado)</mat-hint>
          @if (errorFor('baseSalary')) {
            <mat-error>{{ errorFor('baseSalary') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Periculosidade (%)</mat-label>
          <input
            matInput
            id="hazardPayPercent"
            formControlName="hazardPayPercent"
            type="text"
            inputmode="decimal"
          />
          <mat-hint>Ex.: 30.00 (em branco = não informado)</mat-hint>
          @if (errorFor('hazardPayPercent')) {
            <mat-error>{{ errorFor('hazardPayPercent') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Hora extra (%)</mat-label>
          <input
            matInput
            id="overtimePercent"
            formControlName="overtimePercent"
            type="text"
            inputmode="decimal"
          />
          <mat-hint>Ex.: 50.00</mat-hint>
          @if (errorFor('overtimePercent')) {
            <mat-error>{{ errorFor('overtimePercent') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>DSR sobre hora extra (%)</mat-label>
          <input
            matInput
            id="dsrOvertimePercent"
            formControlName="dsrOvertimePercent"
            type="text"
            inputmode="decimal"
          />
          <mat-hint>Ex.: 20.00</mat-hint>
          @if (errorFor('dsrOvertimePercent')) {
            <mat-error>{{ errorFor('dsrOvertimePercent') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Encargos sociais (%)</mat-label>
          <input
            matInput
            id="socialChargesPercent"
            formControlName="socialChargesPercent"
            type="text"
            inputmode="decimal"
          />
          <mat-hint>Ex.: 68.50</mat-hint>
          @if (errorFor('socialChargesPercent')) {
            <mat-error>{{ errorFor('socialChargesPercent') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Alimentação (R$/mês)</mat-label>
          <input
            matInput
            id="foodAllowanceMonthly"
            formControlName="foodAllowanceMonthly"
            type="text"
            inputmode="decimal"
          />
          <mat-hint>Ex.: 800.00</mat-hint>
          @if (errorFor('foodAllowanceMonthly')) {
            <mat-error>{{ errorFor('foodAllowanceMonthly') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Alojamento (R$/mês)</mat-label>
          <input
            matInput
            id="housingMonthly"
            formControlName="housingMonthly"
            type="text"
            inputmode="decimal"
          />
          <mat-hint>Ex.: 1200.00</mat-hint>
          @if (errorFor('housingMonthly')) {
            <mat-error>{{ errorFor('housingMonthly') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Folgas / Viagem (R$/mês)</mat-label>
          <input
            matInput
            id="homeLeaveTravelMonthly"
            formControlName="homeLeaveTravelMonthly"
            type="text"
            inputmode="decimal"
          />
          <mat-hint>Ex.: 500.00</mat-hint>
          @if (errorFor('homeLeaveTravelMonthly')) {
            <mat-error>{{ errorFor('homeLeaveTravelMonthly') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Plano de saúde (R$/mês)</mat-label>
          <input
            matInput
            id="healthInsuranceMonthly"
            formControlName="healthInsuranceMonthly"
            type="text"
            inputmode="decimal"
          />
          <mat-hint>Ex.: 350.00</mat-hint>
          @if (errorFor('healthInsuranceMonthly')) {
            <mat-error>{{ errorFor('healthInsuranceMonthly') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="col-6"
        >
          <mat-label>Seguro de vida (R$/mês)</mat-label>
          <input
            matInput
            id="lifeInsuranceMonthly"
            formControlName="lifeInsuranceMonthly"
            type="text"
            inputmode="decimal"
          />
          <mat-hint>Ex.: 50.00</mat-hint>
          @if (errorFor('lifeInsuranceMonthly')) {
            <mat-error>{{ errorFor('lifeInsuranceMonthly') }}</mat-error>
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
    @media (max-width: 768px) {
      .col-6 {
        grid-column: span 12;
      }
    }
  `,
})
export class LaborRoleFormComponent {
  private readonly api = inject(LaborRolesApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly editId = signal<number | null>(null);
  readonly currentCode = signal('');
  readonly saving = signal(false);

  readonly form = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    baseSalary: new FormControl<string | null>(null, [
      decimalScaleValidator(DECIMAL_SCALES.baseSalary),
    ]),
    hazardPayPercent: new FormControl<string | null>(null, [
      decimalScaleValidator(DECIMAL_SCALES.hazardPayPercent),
    ]),
    overtimePercent: new FormControl<string | null>(null, [
      decimalScaleValidator(DECIMAL_SCALES.overtimePercent),
    ]),
    dsrOvertimePercent: new FormControl<string | null>(null, [
      decimalScaleValidator(DECIMAL_SCALES.dsrOvertimePercent),
    ]),
    socialChargesPercent: new FormControl<string | null>(null, [
      decimalScaleValidator(DECIMAL_SCALES.socialChargesPercent),
    ]),
    foodAllowanceMonthly: new FormControl<string | null>(null, [
      decimalScaleValidator(DECIMAL_SCALES.foodAllowanceMonthly),
    ]),
    housingMonthly: new FormControl<string | null>(null, [
      decimalScaleValidator(DECIMAL_SCALES.housingMonthly),
    ]),
    homeLeaveTravelMonthly: new FormControl<string | null>(null, [
      decimalScaleValidator(DECIMAL_SCALES.homeLeaveTravelMonthly),
    ]),
    healthInsuranceMonthly: new FormControl<string | null>(null, [
      decimalScaleValidator(DECIMAL_SCALES.healthInsuranceMonthly),
    ]),
    lifeInsuranceMonthly: new FormControl<string | null>(null, [
      decimalScaleValidator(DECIMAL_SCALES.lifeInsuranceMonthly),
    ]),
    effectiveFrom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(DATE_PATTERN)],
    }),
  });

  readonly serverError = signal('');

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
        this.form.controls.name.setValue(summary.name);
        const v = summary.effectiveVersion;
        if (v) {
          this.form.patchValue({
            baseSalary: v.baseSalary,
            hazardPayPercent: v.hazardPayPercent,
            overtimePercent: v.overtimePercent,
            dsrOvertimePercent: v.dsrOvertimePercent,
            socialChargesPercent: v.socialChargesPercent,
            foodAllowanceMonthly: v.foodAllowanceMonthly,
            housingMonthly: v.housingMonthly,
            homeLeaveTravelMonthly: v.homeLeaveTravelMonthly,
            healthInsuranceMonthly: v.healthInsuranceMonthly,
            lifeInsuranceMonthly: v.lifeInsuranceMonthly,
          });
        }
        this.form.enable({ emitEvent: false });
        this.form.controls.code.disable({ emitEvent: false });
      },
      error: () => {
        this.serverError.set(
          'Não foi possível carregar os dados atuais do cargo; recarregue a página antes de criar uma nova versão',
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
    const versionData: LaborRoleVersionInput = {
      baseSalary: orNull(val.baseSalary),
      hazardPayPercent: orNull(val.hazardPayPercent),
      overtimePercent: orNull(val.overtimePercent),
      dsrOvertimePercent: orNull(val.dsrOvertimePercent),
      socialChargesPercent: orNull(val.socialChargesPercent),
      foodAllowanceMonthly: orNull(val.foodAllowanceMonthly),
      housingMonthly: orNull(val.housingMonthly),
      homeLeaveTravelMonthly: orNull(val.homeLeaveTravelMonthly),
      healthInsuranceMonthly: orNull(val.healthInsuranceMonthly),
      lifeInsuranceMonthly: orNull(val.lifeInsuranceMonthly),
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
            this.router.navigate(['/catalogs/labor-roles']);
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
          name: val.name.trim(),
          ...versionData,
        })
        .subscribe({
          next: () => {
            this.snackBar.open('Cargo criado com sucesso', 'OK', {
              duration: 3000,
            });
            this.router.navigate(['/catalogs/labor-roles']);
          },
          error: (err) => {
            this.saving.set(false);
            const msg = err.error?.message || 'Falha ao criar cargo';
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
      if (field === 'name') return 'O nome do cargo é obrigatório';
      if (field === 'effectiveFrom')
        return 'A data de início de vigência é obrigatória';
      return 'Campo obrigatório';
    }
    if (c.errors['pattern']) return 'Formato inválido (esperado AAAA-MM-DD)';
    if (c.errors['invalidDecimal']) return 'Informe um valor numérico maior ou igual a zero';
    if (c.errors['decimalScale']) {
      const max = DECIMAL_SCALES[field as DecimalField] ?? 2;
      return `Use no máximo ${max} casas decimais`;
    }
    return 'Campo inválido';
  }
}
