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
  EquipmentSummary,
  LaborRoleSummary,
  NewWorkCrewInput,
  NewWorkCrewVersionInput,
  ProductionPeriod,
  WorkCrewEquipmentItem,
  WorkCrewLaborRoleItem,
  WorkCrewVersionInput,
} from '@lt-offers/domain';
import { EquipmentApi } from './equipment-api.service';
import { decimalScaleValidator, orNull } from './form-utils';
import { LaborRolesApi } from './labor-roles-api.service';
import { WorkCrewsApi } from './work-crews-api.service';

type LaborRoleRowGroup = FormGroup<{
  laborRoleId: FormControl<number | ''>;
  quantity: FormControl<string>;
}>;

type EquipmentRowGroup = FormGroup<{
  equipmentId: FormControl<number | ''>;
  quantity: FormControl<string>;
}>;

const uniqueLaborRolesValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const rows = (control as FormArray<LaborRoleRowGroup>).controls;
  const ids = rows
    .map((row) => row.controls.laborRoleId.value)
    .filter((id): id is number => typeof id === 'number' && id > 0);
  return new Set(ids).size === ids.length
    ? null
    : { duplicateLaborRoles: true };
};

const uniqueEquipmentsValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const rows = (control as FormArray<EquipmentRowGroup>).controls;
  const ids = rows
    .map((row) => row.controls.equipmentId.value)
    .filter((id): id is number => typeof id === 'number' && id > 0);
  return new Set(ids).size === ids.length
    ? null
    : { duplicateEquipments: true };
};

export const PRODUCTION_PERIOD_LABELS: Record<ProductionPeriod, string> = {
  HOUR: 'Por hora',
  DAY: 'Por dia',
  WEEK: 'Por semana',
  MONTH: 'Por mês',
};

@Component({
  selector: 'app-work-crew-form',
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
        {{
          editId()
            ? 'Nova versão da equipe de trabalho'
            : 'Nova equipe de trabalho'
        }}
      </h2>
      <p>
        Campos numéricos usam ponto como separador decimal. Campo em branco
        significa "não informado".
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
            <mat-label>Nome da equipe *</mat-label>
            <input matInput id="name" formControlName="name" maxlength="100" />
            @if (errorFor('name')) {
              <mat-error>{{ errorFor('name') }}</mat-error>
            }
          </mat-form-field>
        } @else {
          <p class="col-12">
            Código: <strong class="mono">{{ currentCode() }}</strong> · Nome:
            <strong>{{ currentName() }}</strong>
          </p>
        }

        <fieldset class="col-12">
          <legend>Parâmetros de Produção Teórica Máxima</legend>
          <div class="production-grid">
            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
            >
              <mat-label>Taxa de produção padrão</mat-label>
              <input
                matInput
                id="standardProductionRate"
                formControlName="standardProductionRate"
                inputmode="decimal"
              />
              <mat-hint>Ex.: 15.0000</mat-hint>
              @if (errorFor('standardProductionRate')) {
                <mat-error>{{ errorFor('standardProductionRate') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
            >
              <mat-label>Unidade de produção</mat-label>
              <input
                matInput
                id="productionUnit"
                formControlName="productionUnit"
                maxlength="50"
              />
              <mat-hint>Ex.: m3, torre, km, un</mat-hint>
              @if (errorFor('productionUnit')) {
                <mat-error>{{ errorFor('productionUnit') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
            >
              <mat-label>Período de produção</mat-label>
              <mat-select
                id="productionPeriod"
                formControlName="productionPeriod"
              >
                <mat-option value="">Não informado</mat-option>
                @for (period of periodOptions; track period) {
                  <mat-option [value]="period">
                    {{ periodLabels[period] }}
                  </mat-option>
                }
              </mat-select>
              @if (errorFor('productionPeriod')) {
                <mat-error>{{ errorFor('productionPeriod') }}</mat-error>
              }
            </mat-form-field>
          </div>
        </fieldset>

        <fieldset class="col-12" formArrayName="laborRoles">
          <legend>Composição de Mão de Obra</legend>
          @if (laborRoles.controls.length === 0) {
            <p>Nenhum cargo adicionado à composição.</p>
          }
          @for (row of laborRoles.controls; track row; let i = $index) {
            <div class="resource-row" [formGroupName]="i">
              <mat-form-field
                appearance="outline"
                floatLabel="always"
                subscriptSizing="dynamic"
                class="resource-select"
              >
                <mat-label>Cargo de mão de obra *</mat-label>
                <mat-select
                  [id]="'laborRoleId-' + i"
                  formControlName="laborRoleId"
                >
                  <mat-option value="">Selecione um cargo…</mat-option>
                  @for (role of availableLaborRoles(); track role.id) {
                    <mat-option [value]="role.id">
                      {{ role.code }} — {{ role.name }}
                    </mat-option>
                  }
                </mat-select>
                @if (laborRoleRowError(i, 'laborRoleId')) {
                  <mat-error>{{
                    laborRoleRowError(i, 'laborRoleId')
                  }}</mat-error>
                }
              </mat-form-field>

              <mat-form-field
                appearance="outline"
                floatLabel="always"
                subscriptSizing="dynamic"
                class="resource-qty"
              >
                <mat-label>Quantidade *</mat-label>
                <input
                  matInput
                  [id]="'laborRoleQty-' + i"
                  formControlName="quantity"
                  inputmode="decimal"
                />
                @if (laborRoleRowError(i, 'quantity')) {
                  <mat-error>{{ laborRoleRowError(i, 'quantity') }}</mat-error>
                }
              </mat-form-field>

              <button
                matButton="outlined"
                type="button"
                (click)="removeLaborRole(i)"
              >
                Remover
              </button>
            </div>
          }
          <button matButton="outlined" type="button" (click)="addLaborRole()">
            Adicionar mão de obra
          </button>
          @if (duplicateLaborRolesError()) {
            <p class="error" role="alert">
              Há cargos duplicados na composição de mão de obra
            </p>
          }
        </fieldset>

        <fieldset class="col-12" formArrayName="equipments">
          <legend>Composição de Equipamentos</legend>
          @if (equipments.controls.length === 0) {
            <p>Nenhum equipamento adicionado à composição.</p>
          }
          @for (row of equipments.controls; track row; let i = $index) {
            <div class="resource-row" [formGroupName]="i">
              <mat-form-field
                appearance="outline"
                floatLabel="always"
                subscriptSizing="dynamic"
                class="resource-select"
              >
                <mat-label>Equipamento *</mat-label>
                <mat-select
                  [id]="'equipmentId-' + i"
                  formControlName="equipmentId"
                >
                  <mat-option value="">Selecione um equipamento…</mat-option>
                  @for (eq of availableEquipments(); track eq.id) {
                    <mat-option [value]="eq.id">
                      {{ eq.code }} — {{ eq.description }}
                    </mat-option>
                  }
                </mat-select>
                @if (equipmentRowError(i, 'equipmentId')) {
                  <mat-error>{{
                    equipmentRowError(i, 'equipmentId')
                  }}</mat-error>
                }
              </mat-form-field>

              <mat-form-field
                appearance="outline"
                floatLabel="always"
                subscriptSizing="dynamic"
                class="resource-qty"
              >
                <mat-label>Quantidade *</mat-label>
                <input
                  matInput
                  [id]="'equipmentQty-' + i"
                  formControlName="quantity"
                  inputmode="decimal"
                />
                @if (equipmentRowError(i, 'quantity')) {
                  <mat-error>{{ equipmentRowError(i, 'quantity') }}</mat-error>
                }
              </mat-form-field>

              <button
                matButton="outlined"
                type="button"
                (click)="removeEquipment(i)"
              >
                Remover
              </button>
            </div>
          }
          <button matButton="outlined" type="button" (click)="addEquipment()">
            Adicionar equipamento
          </button>
          @if (duplicateEquipmentsError()) {
            <p class="error" role="alert">
              Há equipamentos duplicados na composição de equipamentos
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
          <a matButton routerLink="/catalogs/work-crews"> Cancelar </a>
        </div>
      </form>
    </section>
  `,
  styles: `
    form {
      max-width: 52rem;
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
    .production-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 1rem;
      width: 100%;
    }
    .resource-row {
      display: grid;
      grid-template-columns: 2fr 1fr auto;
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
      .production-grid {
        grid-template-columns: 1fr;
      }
      .resource-row {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class WorkCrewFormComponent {
  private readonly api = inject(WorkCrewsApi);
  private readonly laborRolesApi = inject(LaborRolesApi);
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly periodOptions: ProductionPeriod[] = ['HOUR', 'DAY', 'WEEK', 'MONTH'];
  readonly periodLabels = PRODUCTION_PERIOD_LABELS;

  readonly availableLaborRoles = signal<LaborRoleSummary[]>([]);
  readonly availableEquipments = signal<EquipmentSummary[]>([]);

  readonly editId = signal<number | null>(null);
  readonly currentCode = signal('');
  readonly currentName = signal('');
  readonly serverError = signal('');
  readonly saving = signal(false);

  readonly laborRoles = new FormArray<LaborRoleRowGroup>([], {
    validators: [uniqueLaborRolesValidator],
  });

  readonly equipments = new FormArray<EquipmentRowGroup>([], {
    validators: [uniqueEquipmentsValidator],
  });

  readonly form = new FormGroup({
    code: new FormControl('', { nonNullable: true }),
    name: new FormControl('', { nonNullable: true }),
    standardProductionRate: new FormControl('', {
      nonNullable: true,
      validators: [decimalScaleValidator(4)],
    }),
    productionUnit: new FormControl('', { nonNullable: true }),
    productionPeriod: new FormControl<ProductionPeriod | ''>('', {
      nonNullable: true,
    }),
    laborRoles: this.laborRoles,
    equipments: this.equipments,
    effectiveFrom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(DATE_PATTERN)],
    }),
  });

  constructor() {
    this.loadCatalogOptions();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === null) {
      this.form.controls.code.addValidators(Validators.required);
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

  private loadCatalogOptions(): void {
    this.laborRolesApi.list().subscribe({
      next: (roles) => this.availableLaborRoles.set(roles),
    });
    this.equipmentApi.list().subscribe({
      next: (eqs) => this.availableEquipments.set(eqs),
    });
  }

  addLaborRole(item?: WorkCrewLaborRoleItem): void {
    this.laborRoles.push(
      new FormGroup({
        laborRoleId: new FormControl<number | ''>(
          item ? item.laborRoleId : '',
          {
            nonNullable: true,
            validators: [Validators.required],
          },
        ),
        quantity: new FormControl(item?.quantity ?? '', {
          nonNullable: true,
          validators: [
            Validators.required,
            decimalScaleValidator(2, { nonZero: true }),
          ],
        }),
      }),
    );
  }

  removeLaborRole(index: number): void {
    this.laborRoles.removeAt(index);
  }

  addEquipment(item?: WorkCrewEquipmentItem): void {
    this.equipments.push(
      new FormGroup({
        equipmentId: new FormControl<number | ''>(
          item ? item.equipmentId : '',
          {
            nonNullable: true,
            validators: [Validators.required],
          },
        ),
        quantity: new FormControl(item?.quantity ?? '', {
          nonNullable: true,
          validators: [
            Validators.required,
            decimalScaleValidator(2, { nonZero: true }),
          ],
        }),
      }),
    );
  }

  removeEquipment(index: number): void {
    this.equipments.removeAt(index);
  }

  errorFor(
    field:
      | 'code'
      | 'name'
      | 'standardProductionRate'
      | 'productionUnit'
      | 'productionPeriod'
      | 'effectiveFrom',
  ): string {
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
    if (field === 'standardProductionRate') {
      return 'Use no máximo 4 casas decimais com ponto (ex.: 15.5)';
    }
    return 'Valor inválido';
  }

  laborRoleRowError(index: number, field: 'laborRoleId' | 'quantity'): string {
    const control = this.laborRoles.at(index)?.controls[field];
    if (!control || !control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control.hasError('decimalScale')) {
      return 'Use no máximo 2 casas decimais';
    }
    return 'Informe uma quantidade decimal maior que zero';
  }

  equipmentRowError(index: number, field: 'equipmentId' | 'quantity'): string {
    const control = this.equipments.at(index)?.controls[field];
    if (!control || !control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (control.hasError('decimalScale')) {
      return 'Use no máximo 2 casas decimais';
    }
    return 'Informe uma quantidade decimal maior que zero';
  }

  duplicateLaborRolesError(): boolean {
    return (
      this.laborRoles.touched && this.laborRoles.hasError('duplicateLaborRoles')
    );
  }

  duplicateEquipmentsError(): boolean {
    return (
      this.equipments.touched && this.equipments.hasError('duplicateEquipments')
    );
  }

  save(): void {
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
        } as NewWorkCrewVersionInput)
      : this.api.create({
          ...input,
          code: this.form.controls.code.value.trim(),
          name: this.form.controls.name.value.trim(),
        } as NewWorkCrewInput);

    operation.subscribe({
      next: () => {
        this.snackBar.open('Equipe de trabalho salva', 'Fechar', {
          duration: 4000,
        });
        this.router.navigate(['/catalogs/work-crews']);
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
        this.currentName.set(history.name);
        const latest = history.versions[0];
        if (latest) {
          this.form.patchValue({
            standardProductionRate: latest.standardProductionRate ?? '',
            productionUnit: latest.productionUnit ?? '',
            productionPeriod: latest.productionPeriod ?? '',
          });
          this.laborRoles.clear();
          for (const item of latest.laborRoles) {
            this.addLaborRole(item);
          }
          this.equipments.clear();
          for (const item of latest.equipments) {
            this.addEquipment(item);
          }
        }
        this.form.enable({ emitEvent: false });
      },
      error: () =>
        this.serverError.set(
          'Não foi possível carregar os dados atuais da equipe; recarregue a página antes de criar uma nova versão',
        ),
    });
  }

  private toInput(): WorkCrewVersionInput {
    const value = this.form.getRawValue();
    return {
      standardProductionRate: orNull(value.standardProductionRate),
      productionUnit: orNull(value.productionUnit),
      productionPeriod: (value.productionPeriod as ProductionPeriod) || null,
      laborRoles: this.laborRoles.controls.map((row) => ({
        laborRoleId: Number(row.controls.laborRoleId.value),
        quantity: row.controls.quantity.value.trim(),
      })),
      equipments: this.equipments.controls.map((row) => ({
        equipmentId: Number(row.controls.equipmentId.value),
        quantity: row.controls.quantity.value.trim(),
      })),
      ...(value.effectiveFrom.trim() !== ''
        ? { effectiveFrom: value.effectiveFrom.trim() }
        : {}),
    };
  }
}
