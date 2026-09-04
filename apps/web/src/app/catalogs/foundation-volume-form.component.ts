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
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  DATE_PATTERN,
  FOUNDATION_VOLUME_QUANTITY_FIELDS,
  FoundationTypeSummary,
  FoundationVolumeCombination,
  FoundationVolumeQuantityField,
  FoundationVolumeVersionInput,
  SoilTypeSummary,
  StructureSeriesSummary,
  TowerTypeSummary,
} from '@lt-offers/domain';
import { decimalScaleValidator, orNull } from './form-utils';
import {
  FOUNDATION_VOLUME_QUANTITY_GROUPS,
  FOUNDATION_VOLUME_QUANTITY_LABELS,
} from './foundation-volume-labels';
import { FoundationVolumesApi } from './foundation-volumes-api.service';
import { FoundationTypesApi } from './foundation-types-api.service';
import { SoilTypesApi } from './soil-types-api.service';
import { StructureSeriesApi } from './structure-series-api.service';
import { TowerTypesApi } from './tower-types-api.service';

type QuantityControls = {
  [K in FoundationVolumeQuantityField]: FormControl<string>;
};

@Component({
  selector: 'app-foundation-volume-form',
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
            ? 'Nova versão da entrada da matriz de volumes'
            : 'Nova entrada na matriz de volumes'
        }}
      </h2>
      <p>
        Campos numéricos usam ponto como separador decimal (máximo 3 casas
        decimais). Campo em branco significa "não informado" — diferente de
        zero.
      </p>

      <form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
        @if (!editId()) {
          <div class="col-12 combo-selection">
            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-6"
            >
              <mat-label>Série de estruturas *</mat-label>
              <mat-select
                id="seriesId"
                [formControl]="seriesControl"
                (selectionChange)="onSeriesChange($event.value)"
              >
                <mat-option value="">Selecione…</mat-option>
                @for (s of seriesList(); track s.id) {
                  <mat-option [value]="s.id.toString()">
                    {{ s.name }}
                  </mat-option>
                }
              </mat-select>
              @if (seriesControl.touched && !seriesControl.value) {
                <mat-error>Selecione uma série</mat-error>
              }
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-6"
            >
              <mat-label>Tipo de torre *</mat-label>
              <mat-select id="towerTypeId" formControlName="towerTypeId">
                <mat-option value="">Selecione…</mat-option>
                @for (t of towersList(); track t.id) {
                  <mat-option [value]="t.id.toString()">
                    {{ t.code }}
                  </mat-option>
                }
              </mat-select>
              @if (errorFor('towerTypeId')) {
                <mat-error>{{ errorFor('towerTypeId') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-6"
            >
              <mat-label>Tipo de solo *</mat-label>
              <mat-select id="soilTypeId" formControlName="soilTypeId">
                <mat-option value="">Selecione…</mat-option>
                @for (soil of soilsList(); track soil.id) {
                  <mat-option [value]="soil.id.toString()">
                    {{ soil.code }}
                  </mat-option>
                }
              </mat-select>
              @if (errorFor('soilTypeId')) {
                <mat-error>{{ errorFor('soilTypeId') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field
              appearance="outline"
              floatLabel="always"
              subscriptSizing="dynamic"
              class="col-6"
            >
              <mat-label>Tipo de fundação *</mat-label>
              <mat-select
                id="foundationTypeId"
                formControlName="foundationTypeId"
              >
                <mat-option value="">Selecione…</mat-option>
                @for (f of foundationsList(); track f.id) {
                  <mat-option [value]="f.id.toString()">
                    {{ f.code }}
                  </mat-option>
                }
              </mat-select>
              @if (errorFor('foundationTypeId')) {
                <mat-error>{{ errorFor('foundationTypeId') }}</mat-error>
              }
            </mat-form-field>
          </div>
        } @else {
          <div class="col-12 combination-summary">
            <p>
              Série:
              <strong class="mono">
                {{ currentCombination()?.seriesName }}
              </strong>
              · Torre:
              <strong class="mono">
                {{ currentCombination()?.towerCode }}
              </strong>
              · Solo:
              <strong class="mono">
                {{ currentCombination()?.soilCode }}
              </strong>
              · Fundação:
              <strong class="mono">
                {{ currentCombination()?.foundationCode }}
              </strong>
            </p>
          </div>
        }

        @for (group of quantityGroups; track group.legend) {
          <fieldset class="col-12 form-family">
            <legend>{{ group.legend }}</legend>
            <div class="form-grid">
              @for (field of group.fields; track field) {
                <mat-form-field
                  appearance="outline"
                  floatLabel="always"
                  subscriptSizing="dynamic"
                  class="col-6"
                >
                  <mat-label>{{ quantityLabels[field] }}</mat-label>
                  <input
                    matInput
                    [id]="field"
                    [formControlName]="field"
                    inputmode="decimal"
                  />
                  <mat-hint>Em branco = não informado</mat-hint>
                  @if (errorFor(field)) {
                    <mat-error>{{ errorFor(field) }}</mat-error>
                  }
                </mat-form-field>
              }
            </div>
          </fieldset>
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
          <a matButton routerLink="/catalogs/foundation-volumes">Cancelar</a>
        </div>
      </form>
    </section>
  `,
  styles: `
    form {
      max-width: 54rem;
    }
    .combo-selection {
      display: flex;
      flex-wrap: wrap;
      gap: 0 1rem;
    }
    .combination-summary {
      background: var(--mat-sys-surface-container-low);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }
    .form-family {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      padding: 1rem;
      margin-block: 0.5rem;
    }
    .form-family legend {
      font-weight: 600;
      padding: 0 0.5rem;
      color: var(--mat-sys-primary);
    }
    .error {
      color: var(--mat-sys-error);
      margin: 0.15rem 0 0;
    }
    .actions {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-top: 1rem;
    }
  `,
})
export class FoundationVolumeFormComponent {
  private readonly api = inject(FoundationVolumesApi);
  private readonly seriesApi = inject(StructureSeriesApi);
  private readonly towerTypesApi = inject(TowerTypesApi);
  private readonly soilsApi = inject(SoilTypesApi);
  private readonly foundationsApi = inject(FoundationTypesApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly editId = signal<number | null>(null);
  readonly currentCombination = signal<FoundationVolumeCombination | null>(
    null,
  );
  readonly serverError = signal('');
  readonly saving = signal(false);

  readonly seriesList = signal<StructureSeriesSummary[]>([]);
  readonly towersList = signal<TowerTypeSummary[]>([]);
  readonly soilsList = signal<SoilTypeSummary[]>([]);
  readonly foundationsList = signal<FoundationTypeSummary[]>([]);

  readonly quantityGroups = FOUNDATION_VOLUME_QUANTITY_GROUPS;
  readonly quantityLabels = FOUNDATION_VOLUME_QUANTITY_LABELS;

  readonly seriesControl = new FormControl('', { nonNullable: true });

  readonly form: FormGroup<
    {
      towerTypeId: FormControl<string>;
      soilTypeId: FormControl<string>;
      foundationTypeId: FormControl<string>;
      effectiveFrom: FormControl<string>;
    } & QuantityControls
  >;

  constructor() {
    const quantityControls = {} as QuantityControls;
    for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
      quantityControls[field] = new FormControl('', {
        nonNullable: true,
        validators: [decimalScaleValidator(3)],
      });
    }

    this.form = new FormGroup({
      towerTypeId: new FormControl('', { nonNullable: true }),
      soilTypeId: new FormControl('', { nonNullable: true }),
      foundationTypeId: new FormControl('', { nonNullable: true }),
      effectiveFrom: new FormControl('', {
        nonNullable: true,
        validators: [Validators.pattern(DATE_PATTERN)],
      }),
      ...quantityControls,
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === null) {
      this.prepareCreate();
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

  onSeriesChange(seriesId: string): void {
    this.form.controls.towerTypeId.setValue('');
    if (!seriesId) {
      this.towersList.set([]);
      return;
    }
    this.towerTypesApi.list(Number(seriesId)).subscribe({
      next: (towers) => this.towersList.set(towers),
      error: () => this.towersList.set([]),
    });
  }

  errorFor(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.touched || control.valid) {
      return '';
    }
    if (control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (field === 'effectiveFrom') {
      return 'Informe uma data no formato AAAA-MM-DD';
    }
    if (control.hasError('decimalScale')) {
      return 'Use no máximo 3 casas decimais';
    }
    return 'Informe um número decimal positivo com ponto (ex.: 12.34)';
  }

  save(): void {
    if (this.form.disabled) {
      return;
    }
    this.form.markAllAsTouched();
    if (!this.editId()) {
      this.seriesControl.markAsTouched();
    }
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
          towerTypeId: Number(this.form.controls.towerTypeId.value),
          soilTypeId: Number(this.form.controls.soilTypeId.value),
          foundationTypeId: Number(this.form.controls.foundationTypeId.value),
        });

    operation.subscribe({
      next: () => {
        this.snackBar.open('Entrada na matriz salva', 'Fechar', {
          duration: 4000,
        });
        this.router.navigate(['/catalogs/foundation-volumes']);
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

  private prepareCreate(): void {
    this.form.controls.towerTypeId.addValidators(Validators.required);
    this.form.controls.soilTypeId.addValidators(Validators.required);
    this.form.controls.foundationTypeId.addValidators(Validators.required);

    this.form.disable({ emitEvent: false });
    forkJoin({
      series: this.seriesApi.list(),
      soils: this.soilsApi.list(),
      foundations: this.foundationsApi.list(),
    }).subscribe({
      next: (res) => {
        this.seriesList.set(res.series);
        this.soilsList.set(res.soils);
        this.foundationsList.set(res.foundations);
        this.form.enable({ emitEvent: false });
      },
      error: () =>
        this.serverError.set(
          'Não foi possível carregar os catálogos de referência; verifique a conexão e tente novamente',
        ),
    });
  }

  private prepareEdit(id: number): void {
    this.editId.set(id);
    this.form.controls.effectiveFrom.addValidators(Validators.required);
    this.form.disable({ emitEvent: false });
    this.api.history(id).subscribe({
      next: (history) => {
        this.currentCombination.set(history.combination);
        const latest = history.versions[0];
        if (latest) {
          const patch: Record<string, string> = {};
          for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
            patch[field] = latest[field] ?? '';
          }
          this.form.patchValue(patch);
        }
        this.form.enable({ emitEvent: false });
      },
      error: () =>
        this.serverError.set(
          'Não foi possível carregar os dados atuais da entrada da matriz; recarregue a página antes de criar uma nova versão',
        ),
    });
  }

  private toInput(): FoundationVolumeVersionInput {
    const raw = this.form.getRawValue();
    const result: FoundationVolumeVersionInput = {};

    for (const field of FOUNDATION_VOLUME_QUANTITY_FIELDS) {
      result[field] = orNull(raw[field]);
    }

    if (raw.effectiveFrom.trim() !== '') {
      result.effectiveFrom = raw.effectiveFrom.trim();
    }

    return result;
  }
}
