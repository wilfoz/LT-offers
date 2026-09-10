import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import {
  FoundationTypeSummary,
  FoundationVolumeSummary,
  SoilTypeSummary,
  StructureSeriesSummary,
  TowerTypeSummary,
} from '@lt-offers/domain';
import { quantitiesSummary } from './foundation-volume-labels';
import { FoundationVolumesApi } from './foundation-volumes-api.service';
import { FoundationTypesApi } from './foundation-types-api.service';
import { SoilTypesApi } from './soil-types-api.service';
import { StructureSeriesApi } from './structure-series-api.service';
import { TowerTypesApi } from './tower-types-api.service';

@Component({
  selector: 'app-foundation-volume-list',
  imports: [
    RouterLink,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <section>
      <h2>Matriz de volumes de fundação</h2>

      <form role="search" class="filter-form" (submit)="search($event)">
        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="filter-field"
        >
          <mat-label>Série de estruturas</mat-label>
          <mat-select
            id="seriesFilter"
            [ngModel]="selectedSeriesId()"
            (ngModelChange)="onSeriesFilterChange($event)"
            name="seriesFilter"
          >
            <mat-option value="">Todas</mat-option>
            @for (s of seriesList(); track s.id) {
              <mat-option [value]="s.id.toString()">
                {{ s.name }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="filter-field"
        >
          <mat-label>Tipo de torre</mat-label>
          <mat-select
            id="towerFilter"
            [ngModel]="selectedTowerTypeId()"
            (ngModelChange)="selectedTowerTypeId.set($event)"
            name="towerFilter"
          >
            <mat-option value="">Todos</mat-option>
            @for (t of towersList(); track t.id) {
              <mat-option [value]="t.id.toString()">
                {{ t.code }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="filter-field"
        >
          <mat-label>Tipo de solo</mat-label>
          <mat-select
            id="soilFilter"
            [ngModel]="selectedSoilTypeId()"
            (ngModelChange)="selectedSoilTypeId.set($event)"
            name="soilFilter"
          >
            <mat-option value="">Todos</mat-option>
            @for (soil of soilsList(); track soil.id) {
              <mat-option [value]="soil.id.toString()">
                {{ soil.code }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="filter-field"
        >
          <mat-label>Tipo de fundação</mat-label>
          <mat-select
            id="foundationFilter"
            [ngModel]="selectedFoundationTypeId()"
            (ngModelChange)="selectedFoundationTypeId.set($event)"
            name="foundationFilter"
          >
            <mat-option value="">Todos</mat-option>
            @for (f of foundationsList(); track f.id) {
              <mat-option [value]="f.id.toString()">
                {{ f.code }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <button matButton="outlined" type="submit">Filtrar</button>
        <button matButton type="button" (click)="clearFilters()">Limpar</button>
        <a matButton="filled" routerLink="new">Nova entrada</a>
      </form>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">table_chart</mat-icon>
          <p>Nenhuma entrada encontrada na matriz de volumes.</p>
          <a matButton="filled" routerLink="new">Nova entrada</a>
        </div>
      } @else {
        <div class="table-scroll">
          <table mat-table [dataSource]="items()" class="dense">
            <caption>
              Combinações vigentes na data atual
            </caption>

            <ng-container matColumnDef="series">
              <th mat-header-cell *matHeaderCellDef scope="col">Série</th>
              <td mat-cell *matCellDef="let item">
                {{ item.combination.seriesName }}
              </td>
            </ng-container>

            <ng-container matColumnDef="tower">
              <th mat-header-cell *matHeaderCellDef scope="col">Torre</th>
              <td mat-cell *matCellDef="let item" class="mono">
                {{ item.combination.towerCode }}
              </td>
            </ng-container>

            <ng-container matColumnDef="soil">
              <th mat-header-cell *matHeaderCellDef scope="col">Solo</th>
              <td mat-cell *matCellDef="let item" class="mono">
                {{ item.combination.soilCode }}
              </td>
            </ng-container>

            <ng-container matColumnDef="foundation">
              <th mat-header-cell *matHeaderCellDef scope="col">Fundação</th>
              <td mat-cell *matCellDef="let item" class="mono">
                {{ item.combination.foundationCode }}
              </td>
            </ng-container>

            <ng-container matColumnDef="quantities">
              <th mat-header-cell *matHeaderCellDef scope="col">Quantidades</th>
              <td mat-cell *matCellDef="let item">
                {{ formatQuantities(item) }}
              </td>
            </ng-container>

            <ng-container matColumnDef="pending">
              <th mat-header-cell *matHeaderCellDef scope="col">Pendências</th>
              <td mat-cell *matCellDef="let item">
                @if (!item.effectiveVersion) {
                  <span class="badge badge-error">Sem versão vigente</span>
                } @else if (item.pendingFields.length > 0) {
                  <span class="badge">
                    Pendente: {{ item.pendingFields.join(', ') }}
                  </span>
                } @else {
                  <span>Completo</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef scope="col">Ações</th>
              <td mat-cell *matCellDef="let item">
                <a matButton [routerLink]="[item.id, 'edit']">Editar</a>
                <a matButton [routerLink]="[item.id, 'history']">Histórico</a>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let item; columns: columns"></tr>
          </table>
        </div>
      }
    </section>
  `,
  styles: `
    .error {
      color: var(--mat-sys-error);
    }
    .filter-form {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
      margin-block: 1rem;
    }
    .filter-field {
      flex: 1;
      min-width: 12rem;
    }
    table {
      width: 100%;
    }
    caption {
      caption-side: top;
      text-align: left;
      padding-block: 0.5rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
  `,
})
export class FoundationVolumeListComponent {
  private readonly api = inject(FoundationVolumesApi);
  private readonly seriesApi = inject(StructureSeriesApi);
  private readonly towerTypesApi = inject(TowerTypesApi);
  private readonly soilsApi = inject(SoilTypesApi);
  private readonly foundationsApi = inject(FoundationTypesApi);

  protected readonly columns = [
    'series',
    'tower',
    'soil',
    'foundation',
    'quantities',
    'pending',
    'actions',
  ];

  readonly seriesList = signal<StructureSeriesSummary[]>([]);
  readonly towersList = signal<TowerTypeSummary[]>([]);
  readonly soilsList = signal<SoilTypeSummary[]>([]);
  readonly foundationsList = signal<FoundationTypeSummary[]>([]);

  readonly selectedSeriesId = signal('');
  readonly selectedTowerTypeId = signal('');
  readonly selectedSoilTypeId = signal('');
  readonly selectedFoundationTypeId = signal('');

  readonly items = signal<FoundationVolumeSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.loadCatalogReferences();
    this.reload();
  }

  search(event: Event): void {
    event.preventDefault();
    this.reload();
  }

  clearFilters(): void {
    this.selectedSeriesId.set('');
    this.selectedTowerTypeId.set('');
    this.selectedSoilTypeId.set('');
    this.selectedFoundationTypeId.set('');
    this.towersList.set([]);
    this.reload();
  }

  onSeriesFilterChange(seriesId: string): void {
    this.selectedSeriesId.set(seriesId);
    this.selectedTowerTypeId.set('');
    if (!seriesId) {
      this.towersList.set([]);
      return;
    }
    this.towerTypesApi.list(Number(seriesId)).subscribe({
      next: (towers) => this.towersList.set(towers),
      error: () => this.towersList.set([]),
    });
  }

  formatQuantities(item: FoundationVolumeSummary): string {
    return quantitiesSummary(item.effectiveVersion);
  }

  private loadCatalogReferences(): void {
    this.seriesApi.list().subscribe({
      next: (series) => this.seriesList.set(series),
      error: () => {
        // silencioso no filtro
      },
    });
    this.soilsApi.list().subscribe({
      next: (soils) => this.soilsList.set(soils),
      error: () => {
        // silencioso no filtro
      },
    });
    this.foundationsApi.list().subscribe({
      next: (foundations) => this.foundationsList.set(foundations),
      error: () => {
        // silencioso no filtro
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set('');

    const towerTypeId = this.selectedTowerTypeId()
      ? Number(this.selectedTowerTypeId())
      : undefined;
    const soilTypeId = this.selectedSoilTypeId()
      ? Number(this.selectedSoilTypeId())
      : undefined;
    const foundationTypeId = this.selectedFoundationTypeId()
      ? Number(this.selectedFoundationTypeId())
      : undefined;

    this.api
      .list({
        towerTypeId,
        soilTypeId,
        foundationTypeId,
      })
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set(
            'Não foi possível carregar a matriz de volumes; verifique a conexão e tente novamente',
          );
        },
      });
  }
}
