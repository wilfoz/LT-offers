import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { StructureSeriesSummary } from '@lt-offers/domain';
import { StructureSeriesApi } from './structure-series-api.service';

@Component({
  selector: 'app-structure-series-list',
  imports: [
    RouterLink,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <section>
      <h2>Catálogo de séries de estruturas</h2>

      <form role="search" (submit)="search($event)">
        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="search-field"
        >
          <mat-label>Buscar por nome ou projetista</mat-label>
          <input
            matInput
            id="search"
            name="search"
            type="search"
            [value]="term()"
            (input)="term.set(searchField.value)"
            #searchField
          />
        </mat-form-field>
        <button matButton="outlined" type="submit">Buscar</button>
        <a matButton="filled" routerLink="new">Nova série</a>
      </form>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">stacked_bar_chart</mat-icon>
          <p>Nenhuma série de estrutura encontrada.</p>
          <a matButton="filled" routerLink="new">Nova série</a>
        </div>
      } @else {
        <div class="table-scroll">
          <table mat-table [dataSource]="items()" class="dense">
            <caption>
              Versões vigentes na data atual
            </caption>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef scope="col">Nome</th>
              <td mat-cell *matCellDef="let item">{{ item.name }}</td>
            </ng-container>

            <ng-container matColumnDef="designer">
              <th mat-header-cell *matHeaderCellDef scope="col">Projetista</th>
              <td mat-cell *matCellDef="let item">
                {{ item.effectiveVersion?.designer ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="voltageKv">
              <th mat-header-cell *matHeaderCellDef scope="col">Tensão (kV)</th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.voltageKv ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="circuitCount">
              <th mat-header-cell *matHeaderCellDef scope="col">Circuitos</th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.circuitCount ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="cablesPerPhase">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Cabos por fase
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.cablesPerPhase ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="designWindSpeedMs">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Vento de projeto (m/s)
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.designWindSpeedMs ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="insulatorType">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Tipo de isolador
              </th>
              <td mat-cell *matCellDef="let item">
                {{ item.effectiveVersion?.insulatorType ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="silMw">
              <th mat-header-cell *matHeaderCellDef scope="col">SIL (MW)</th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.silMw ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="towerTypeCount">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Tipos de torre
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.towerTypeCount }}
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
                <a matButton [routerLink]="[item.id]">Tipos de torre</a>
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
    form {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
      margin-block: 1rem;
    }
    .search-field {
      flex: 1;
      min-width: 16rem;
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
    .actions-cell {
      white-space: nowrap;
    }
  `,
})
export class StructureSeriesListComponent {
  private readonly api = inject(StructureSeriesApi);

  protected readonly columns = [
    'name',
    'designer',
    'voltageKv',
    'circuitCount',
    'cablesPerPhase',
    'designWindSpeedMs',
    'insulatorType',
    'silMw',
    'towerTypeCount',
    'pending',
    'actions',
  ];

  readonly term = signal('');
  readonly items = signal<StructureSeriesSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.reload();
  }

  search(event: Event): void {
    event.preventDefault();
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.list(this.term() || undefined).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(
          'Não foi possível carregar o catálogo; verifique a conexão e tente novamente',
        );
      },
    });
  }
}
