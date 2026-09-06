import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { FixedCostCategory, FixedCostSummary } from '@lt-offers/domain';
import {
  FIXED_COST_CATEGORIES,
  fixedCostCategoryLabel,
} from './fixed-cost-labels';
import { FixedCostsApi } from './fixed-costs-api.service';

@Component({
  selector: 'app-fixed-cost-list',
  imports: [
    RouterLink,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <section>
      <h2>Catálogo de custos fixos</h2>

      <form role="search" (submit)="search($event)">
        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="search-field"
        >
          <mat-label>Buscar por código ou descrição</mat-label>
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

        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="category-field"
        >
          <mat-label>Categoria</mat-label>
          <mat-select
            id="category-filter"
            [value]="categoryFilter()"
            (selectionChange)="categoryFilter.set($event.value)"
          >
            <mat-option value="">Todas</mat-option>
            @for (cat of categories; track cat.value) {
              <mat-option [value]="cat.value">{{ cat.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <button matButton="outlined" type="submit">Buscar</button>
        <a matButton="filled" routerLink="new">Novo custo fixo</a>
      </form>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">account_balance_wallet</mat-icon>
          <p>Nenhum custo fixo encontrado.</p>
          <a matButton="filled" routerLink="new">Novo custo fixo</a>
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

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef scope="col">Descrição</th>
              <td mat-cell *matCellDef="let item">
                {{ item.description }}
              </td>
            </ng-container>

            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef scope="col">Categoria</th>
              <td mat-cell *matCellDef="let item">
                {{ categoryLabel(item.category) }}
              </td>
            </ng-container>

            <ng-container matColumnDef="unit">
              <th mat-header-cell *matHeaderCellDef scope="col">Unidade</th>
              <td mat-cell *matCellDef="let item">
                {{ item.unit }}
              </td>
            </ng-container>

            <ng-container matColumnDef="unitCost">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Custo unitário (R$)
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.unitCost ?? '—' }}
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
    .category-field {
      width: 16rem;
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
export class FixedCostListComponent {
  private readonly api = inject(FixedCostsApi);

  protected readonly categories = FIXED_COST_CATEGORIES;
  protected readonly columns = [
    'code',
    'description',
    'category',
    'unit',
    'unitCost',
    'pending',
    'actions',
  ];

  readonly term = signal('');
  readonly categoryFilter = signal<FixedCostCategory | ''>('');
  readonly items = signal<FixedCostSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.reload();
  }

  search(event: Event): void {
    event.preventDefault();
    this.reload();
  }

  categoryLabel(category: FixedCostCategory): string {
    return fixedCostCategoryLabel(category);
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set('');
    const category = this.categoryFilter() || undefined;
    this.api.list(this.term() || undefined, category).subscribe({
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
