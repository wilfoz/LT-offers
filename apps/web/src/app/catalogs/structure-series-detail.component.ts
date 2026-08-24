import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  StructureSeriesSummary,
  TowerFunction,
  TowerTypeSummary,
  TowerTypeVersion,
} from '@lt-offers/domain';
import { StructureSeriesApi } from './structure-series-api.service';
import { TOWER_FUNCTION_LABELS } from './tower-function-labels';
import { TowerTypesApi } from './tower-types-api.service';

@Component({
  selector: 'app-structure-series-detail',
  imports: [
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <section>
      <h2>Série de estrutura — {{ series()?.name ?? title() }}</h2>
      <nav>
        <a matButton routerLink="/catalogs/structure-series">
          Voltar à listagem
        </a>
        @if (seriesId(); as id) {
          <a
            matButton
            [routerLink]="['/catalogs/structure-series', id, 'edit']"
          >
            Editar série
          </a>
          <a
            matButton
            [routerLink]="['/catalogs/structure-series', id, 'history']"
          >
            Histórico da série
          </a>
        }
      </nav>

      @if (seriesError()) {
        <p class="error" role="alert">{{ seriesError() }}</p>
      } @else if (series(); as s) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <dl>
              <div>
                <dt>Projetista</dt>
                <dd>{{ s.effectiveVersion?.designer ?? '—' }}</dd>
              </div>
              <div>
                <dt>Tensão (kV)</dt>
                <dd class="mono">{{ s.effectiveVersion?.voltageKv ?? '—' }}</dd>
              </div>
              <div>
                <dt>Circuitos</dt>
                <dd class="mono">
                  {{ s.effectiveVersion?.circuitCount ?? '—' }}
                </dd>
              </div>
              <div>
                <dt>Cabos por fase</dt>
                <dd class="mono">
                  {{ s.effectiveVersion?.cablesPerPhase ?? '—' }}
                </dd>
              </div>
              <div>
                <dt>Vento de projeto (m/s)</dt>
                <dd class="mono">
                  {{ s.effectiveVersion?.designWindSpeedMs ?? '—' }}
                </dd>
              </div>
              <div>
                <dt>Tipo de isolador</dt>
                <dd>{{ s.effectiveVersion?.insulatorType ?? '—' }}</dd>
              </div>
              <div>
                <dt>SIL (MW)</dt>
                <dd class="mono">{{ s.effectiveVersion?.silMw ?? '—' }}</dd>
              </div>
            </dl>
            @if (s.pendingFields.length > 0) {
              <p>
                <span class="badge">
                  Pendente: {{ s.pendingFields.join(', ') }}
                </span>
              </p>
            }
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando…</p>
      }

      <h3>Tipos de torre</h3>
      @if (seriesId(); as id) {
        <a
          matButton="filled"
          [routerLink]="[
            '/catalogs/structure-series',
            id,
            'tower-types',
            'new',
          ]"
        >
          Novo tipo de torre
        </a>
      }

      @if (typesLoading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando…</p>
      } @else if (typesError()) {
        <p class="error" role="alert">{{ typesError() }}</p>
      } @else if (types().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">cell_tower</mat-icon>
          <p>Nenhum tipo de torre cadastrado nesta série.</p>
        </div>
      } @else {
        <div class="table-scroll">
          <table mat-table [dataSource]="types()" class="dense">
            <caption>
              Versões vigentes na data atual
            </caption>

            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef scope="col">Sigla</th>
              <td mat-cell *matCellDef="let item" class="mono">
                {{ item.code }}
              </td>
            </ng-container>

            <ng-container matColumnDef="function">
              <th mat-header-cell *matHeaderCellDef scope="col">Função</th>
              <td mat-cell *matCellDef="let item">
                {{ functionLabel(item.function) }}
              </td>
            </ng-container>

            <ng-container matColumnDef="guyCount">
              <th mat-header-cell *matHeaderCellDef scope="col">Estais</th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.guyCount ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="weights">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Tabela peso × altura
              </th>
              <td mat-cell *matCellDef="let item">
                {{ weightsSummary(item.effectiveVersion) }}
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
              <td mat-cell *matCellDef="let item" class="actions-cell">
                <a
                  matButton
                  [routerLink]="[
                    '/catalogs/structure-series',
                    seriesId(),
                    'tower-types',
                    item.id,
                    'edit',
                  ]"
                >
                  Editar
                </a>
                <a
                  matButton
                  [routerLink]="[
                    '/catalogs/structure-series',
                    seriesId(),
                    'tower-types',
                    item.id,
                    'history',
                  ]"
                >
                  Histórico
                </a>
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
    nav {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-block: 0.5rem 1rem;
    }
    mat-card {
      margin-block: 1rem;
    }
    dl {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
      gap: 0.75rem;
      margin: 0;
    }
    dt {
      font: var(--mat-sys-label-medium);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--mat-sys-on-surface-variant);
    }
    dd {
      margin: 0;
    }
    h3 {
      margin-top: 2rem;
    }
    table {
      width: 100%;
      margin-top: 0.5rem;
    }
    caption {
      caption-side: top;
      text-align: left;
      padding-block: 0.5rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    .actions-cell {
      white-space: nowrap;
    }
  `,
})
export class StructureSeriesDetailComponent {
  private readonly seriesApi = inject(StructureSeriesApi);
  private readonly towerTypesApi = inject(TowerTypesApi);
  private readonly route = inject(ActivatedRoute);

  // Célula do mat-table não é tipada (*matCellDef="let item"); o método dá
  // o tipo à indexação do mapa de rótulos.
  protected functionLabel(value: TowerFunction): string {
    return TOWER_FUNCTION_LABELS[value];
  }

  protected readonly columns = [
    'code',
    'function',
    'guyCount',
    'weights',
    'pending',
    'actions',
  ];

  readonly seriesId = signal<number | null>(null);
  readonly title = signal('');
  readonly series = signal<StructureSeriesSummary | null>(null);
  readonly seriesError = signal('');
  readonly types = signal<TowerTypeSummary[]>([]);
  readonly typesLoading = signal(true);
  readonly typesError = signal('');

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.seriesError.set('Identificador inválido');
      this.typesLoading.set(false);
      return;
    }
    this.seriesId.set(id);
    this.title.set(`série #${id}`);

    this.seriesApi.get(id).subscribe({
      next: (s) => this.series.set(s),
      error: (error) =>
        this.seriesError.set(
          error?.error?.message ??
            'Não foi possível carregar os dados da série; tente novamente',
        ),
    });

    this.towerTypesApi.list(id).subscribe({
      next: (types) => {
        this.types.set(types);
        this.typesLoading.set(false);
      },
      error: () => {
        this.typesLoading.set(false);
        this.typesError.set(
          'Não foi possível carregar os tipos de torre; tente novamente',
        );
      },
    });
  }

  /** Resumo da tabela vigente: quantidade de pontos e faixa de alturas. */
  weightsSummary(version: TowerTypeVersion | null | undefined): string {
    if (!version || version.weights.length === 0) {
      return '—';
    }
    const heights = version.weights.map((w) => w.heightM);
    if (heights.length === 1) {
      return `1 altura (${heights[0]} m)`;
    }
    return `${heights.length} alturas (${heights[0]}–${heights[heights.length - 1]} m)`;
  }
}
