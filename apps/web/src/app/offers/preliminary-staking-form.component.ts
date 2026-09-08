import { DecimalPipe } from '@angular/common';
import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  FoundationTypeSummary,
  PreliminaryPercentageItem,
  PreliminaryStakingDistributionPayload,
  SoilTypeSummary,
} from '@lt-offers/domain';
import { FoundationTypesApi } from '../catalogs/foundation-types-api.service';
import { SoilTypesApi } from '../catalogs/soil-types-api.service';
import { StakingApi } from './staking-api.service';

interface EditablePercentageRow {
  id: number;
  code: string;
  name: string;
  percentage: string;
}

@Component({
  selector: 'app-preliminary-staking-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatChipsModule,
    DecimalPipe,
  ],
  template: `
    <div class="preliminary-container">
      <div class="header-card">
        <div class="header-info">
          <mat-icon class="icon-info">tune</mat-icon>
          <div>
            <h4>Distribuição Paramétrica Preliminar</h4>
            <p class="subtitle">
              Configure a estimativa percentual de solos e fundações para rateio
              quando o estaqueamento executivo ainda não estiver disponível (RF-21).
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button
            mat-flat-button
            color="primary"
            type="button"
            (click)="save()"
            [disabled]="!isValid() || saving() || loading()"
          >
            @if (saving()) {
              <mat-icon>hourglass_empty</mat-icon> Salvando...
            } @else {
              <mat-icon>save</mat-icon> Salvar Distribuição
            }
          </button>
        </div>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando dados" />
        <p class="loading-label">Carregando catálogo e estimativa...</p>
      } @else {
        <div class="distributions-grid">
          <!-- Solos -->
          <div class="column-card">
            <div class="column-header">
              <div class="col-title">
                <mat-icon>terrain</mat-icon>
                <span>Tipos de Solo</span>
              </div>
              <div
                class="total-chip"
                [class.success]="isSoilSumValid()"
                [class.warning]="!isSoilSumValid()"
              >
                Total: {{ soilTotal() | number: '1.2-2' }}%
                @if (isSoilSumValid()) {
                  <mat-icon inline>check_circle</mat-icon>
                } @else {
                  <mat-icon inline>warning</mat-icon>
                }
              </div>
            </div>
            <p class="col-desc">
              Distribua 100% entre os tipos de solo geotécnicos da linha.
            </p>

            <div class="rows-list">
              @for (row of soilRows(); track row.id; let idx = $index) {
                <div class="row-item">
                  <div class="item-name">
                    <span class="mono font-bold">{{ row.code }}</span>
                    <span class="item-sub">{{ row.name }}</span>
                  </div>
                  <mat-form-field appearance="outline" class="density-compact input-pct">
                    <mat-label>Percentual</mat-label>
                    <input
                      matInput
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      [(ngModel)]="row.percentage"
                      (ngModelChange)="onValuesChanged()"
                    />
                    <span matTextSuffix>%</span>
                  </mat-form-field>
                </div>
              }
            </div>
          </div>

          <!-- Fundações -->
          <div class="column-card">
            <div class="column-header">
              <div class="col-title">
                <mat-icon>foundation</mat-icon>
                <span>Tipos de Fundação</span>
              </div>
              <div
                class="total-chip"
                [class.success]="isFoundationSumValid()"
                [class.warning]="!isFoundationSumValid()"
              >
                Total: {{ foundationTotal() | number: '1.2-2' }}%
                @if (isFoundationSumValid()) {
                  <mat-icon inline>check_circle</mat-icon>
                } @else {
                  <mat-icon inline>warning</mat-icon>
                }
              </div>
            </div>
            <p class="col-desc">
              Distribua 100% entre as tipologias de fundação previstas.
            </p>

            <div class="rows-list">
              @for (row of foundationRows(); track row.id; let idx = $index) {
                <div class="row-item">
                  <div class="item-name">
                    <span class="mono font-bold">{{ row.code }}</span>
                    <span class="item-sub">{{ row.name }}</span>
                  </div>
                  <mat-form-field appearance="outline" class="density-compact input-pct">
                    <mat-label>Percentual</mat-label>
                    <input
                      matInput
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      [(ngModel)]="row.percentage"
                      (ngModelChange)="onValuesChanged()"
                    />
                    <span matTextSuffix>%</span>
                  </mat-form-field>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .preliminary-container {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding: 0.5rem 0;
      }
      .header-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: var(--mat-sys-surface-container-low, #f8fafc);
        border: 1px solid var(--mat-sys-outline-variant, #e2e8f0);
        border-radius: 8px;
        padding: 1rem 1.25rem;
      }
      .header-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .icon-info {
        color: var(--mat-sys-primary, #0284c7);
        font-size: 26px;
        width: 26px;
        height: 26px;
      }
      h4 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 600;
      }
      .subtitle {
        margin: 0.2rem 0 0;
        font-size: 0.85rem;
        color: var(--mat-sys-on-surface-variant, #64748b);
      }
      .loading-label {
        font-size: 0.85rem;
        color: var(--mat-sys-on-surface-variant, #64748b);
        text-align: center;
      }
      .distributions-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem;
      }
      @media (max-width: 768px) {
        .distributions-grid {
          grid-template-columns: 1fr;
        }
      }
      .column-card {
        background: var(--mat-sys-surface, #ffffff);
        border: 1px solid var(--mat-sys-outline-variant, #e2e8f0);
        border-radius: 8px;
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .column-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .col-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 1rem;
      }
      .col-desc {
        margin: 0;
        font-size: 0.82rem;
        color: var(--mat-sys-on-surface-variant, #64748b);
      }
      .total-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.6rem;
        border-radius: 6px;
        font-weight: 600;
        font-size: 0.82rem;
      }
      .total-chip.success {
        background: #dcfce7;
        color: #15803d;
      }
      .total-chip.warning {
        background: #fef3c7;
        color: #b45309;
      }
      .rows-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .row-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.4rem 0.75rem;
        border-radius: 6px;
        background: var(--mat-sys-surface-container-lowest, #f8fafc);
        border: 1px solid var(--mat-sys-outline-variant, #f1f5f9);
      }
      .item-name {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
      }
      .item-sub {
        font-size: 0.78rem;
        color: var(--mat-sys-on-surface-variant, #64748b);
      }
      .input-pct {
        width: 120px;
        margin-bottom: -1.25rem;
      }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      .font-bold {
        font-weight: 600;
      }
    `,
  ],
})
export class PreliminaryStakingFormComponent implements OnInit {
  private readonly stakingApi = inject(StakingApi);
  private readonly soilTypesApi = inject(SoilTypesApi);
  private readonly foundationTypesApi = inject(FoundationTypesApi);
  private readonly snackBar = inject(MatSnackBar);

  @Input({ required: true }) lineId!: number;
  @Output() saved = new EventEmitter<void>();

  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);

  readonly soilRows = signal<EditablePercentageRow[]>([]);
  readonly foundationRows = signal<EditablePercentageRow[]>([]);

  readonly soilTotal = computed(() => {
    return this.soilRows().reduce(
      (acc, r) => acc + (parseFloat(r.percentage) || 0),
      0,
    );
  });

  readonly foundationTotal = computed(() => {
    return this.foundationRows().reduce(
      (acc, r) => acc + (parseFloat(r.percentage) || 0),
      0,
    );
  });

  readonly isSoilSumValid = computed(() => {
    return Math.abs(this.soilTotal() - 100) <= 0.01;
  });

  readonly isFoundationSumValid = computed(() => {
    return Math.abs(this.foundationTotal() - 100) <= 0.01;
  });

  readonly isValid = computed(() => {
    return this.isSoilSumValid() && this.isFoundationSumValid();
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    this.soilTypesApi.list().subscribe({
      next: (soils: SoilTypeSummary[]) => {
        this.foundationTypesApi.list().subscribe({
          next: (foundations: FoundationTypeSummary[]) => {
            this.stakingApi.getPreliminaryDistribution(this.lineId).subscribe({
              next: (existing) => {
                this.setupRows(soils, foundations, existing);
                this.loading.set(false);
              },
              error: () => {
                this.setupRows(soils, foundations, null);
                this.loading.set(false);
              },
            });
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  private setupRows(
    soils: SoilTypeSummary[],
    foundations: FoundationTypeSummary[],
    existing: {
      soilPercentages: PreliminaryPercentageItem[];
      foundationPercentages: PreliminaryPercentageItem[];
    } | null,
  ): void {
    const existingSoilMap = new Map(
      (existing?.soilPercentages || []).map((s) => [s.id, s.percentage]),
    );
    const existingFoundationMap = new Map(
      (existing?.foundationPercentages || []).map((f) => [f.id, f.percentage]),
    );

    const sRows: EditablePercentageRow[] = soils.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.code,
      percentage: existingSoilMap.get(s.id) || '0.00',
    }));

    const fRows: EditablePercentageRow[] = foundations.map((f) => ({
      id: f.id,
      code: f.code,
      name: f.code,
      percentage: existingFoundationMap.get(f.id) || '0.00',
    }));

    this.soilRows.set(sRows);
    this.foundationRows.set(fRows);
  }

  onValuesChanged(): void {
    // Forçar recomputação acionando os signals
    this.soilRows.update((rows) => [...rows]);
    this.foundationRows.update((rows) => [...rows]);
  }

  save(): void {
    if (!this.isValid()) return;

    this.saving.set(true);

    const payload: PreliminaryStakingDistributionPayload = {
      soilPercentages: this.soilRows()
        .filter((r) => parseFloat(r.percentage) > 0)
        .map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          percentage: parseFloat(r.percentage).toFixed(2),
        })),
      foundationPercentages: this.foundationRows()
        .filter((r) => parseFloat(r.percentage) > 0)
        .map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          percentage: parseFloat(r.percentage).toFixed(2),
        })),
    };

    this.stakingApi
      .savePreliminaryDistribution(this.lineId, payload)
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open(
            'Distribuição paramétrica salva com sucesso!',
            'Fechar',
            { duration: 4000 },
          );
          this.saved.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.snackBar.open(
            err?.error?.message || 'Erro ao salvar distribuição paramétrica.',
            'Fechar',
            { duration: 5000 },
          );
        },
      });
  }
}
