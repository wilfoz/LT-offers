import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { WorkCrewSummary } from '@lt-offers/domain';
import { WorkCrewsApi } from './work-crews-api.service';

const PERIOD_LABELS: Record<string, string> = {
  HOUR: 'hora',
  DAY: 'dia',
  WEEK: 'sem.',
  MONTH: 'mês',
};

@Component({
  selector: 'app-work-crew-list',
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
      <h2>Catálogo de equipes de trabalho</h2>

      <form role="search" (submit)="search($event)">
        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="search-field"
        >
          <mat-label>Buscar por código ou nome</mat-label>
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
        <a matButton="filled" routerLink="new">Nova equipe</a>
      </form>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">groups</mat-icon>
          <p>Nenhuma equipe de trabalho encontrada.</p>
          <a matButton="filled" routerLink="new">Nova equipe</a>
        </div>
      } @else {
        <div class="table-scroll">
          <table mat-table [dataSource]="items()" class="dense">
            <caption>
              Versões vigentes na data atual
            </caption>

            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef scope="col">Código</th>
              <td mat-cell *matCellDef="let item" class="mono">
                {{ item.code }}
              </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef scope="col">Nome da equipe</th>
              <td mat-cell *matCellDef="let item">
                {{ item.name }}
              </td>
            </ng-container>

            <ng-container matColumnDef="laborRoleCount">
              <th mat-header-cell *matHeaderCellDef scope="col">Mão de obra</th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.laborRoleCount }} {{ item.laborRoleCount === 1 ? 'função' : 'funções' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="equipmentCount">
              <th mat-header-cell *matHeaderCellDef scope="col">Equipamentos</th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.equipmentCount }} {{ item.equipmentCount === 1 ? 'tipo' : 'tipos' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="productionRate">
              <th mat-header-cell *matHeaderCellDef scope="col">Produção teórica</th>
              <td mat-cell *matCellDef="let item" class="mono">
                {{ formatProduction(item) }}
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
    form {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
      margin-block: 1rem;
    }
    .search-field {
      flex: 1;
      min-width: 14rem;
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
export class WorkCrewListComponent {
  private readonly api = inject(WorkCrewsApi);

  protected readonly columns = [
    'code',
    'name',
    'laborRoleCount',
    'equipmentCount',
    'productionRate',
    'pending',
    'actions',
  ];

  readonly term = signal('');
  readonly items = signal<WorkCrewSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.reload();
  }

  search(event: Event): void {
    event.preventDefault();
    this.reload();
  }

  protected formatProduction(item: WorkCrewSummary): string {
    const v = item.effectiveVersion;
    if (!v || !v.standardProductionRate) {
      return '—';
    }
    const unit = v.productionUnit ? ` ${v.productionUnit}` : '';
    const period = v.productionPeriod
      ? `/${PERIOD_LABELS[v.productionPeriod] ?? v.productionPeriod}`
      : '';
    return `${v.standardProductionRate}${unit}${period}`;
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
