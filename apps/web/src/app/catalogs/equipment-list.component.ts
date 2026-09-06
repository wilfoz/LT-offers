import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { EquipmentSummary } from '@lt-offers/domain';
import { EquipmentApi } from './equipment-api.service';

@Component({
  selector: 'app-equipment-list',
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
      <h2>Catálogo de equipamentos</h2>

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
          <input
            matInput
            id="category"
            name="category"
            type="text"
            [value]="categoryFilter()"
            (input)="categoryFilter.set(categoryInput.value)"
            #categoryInput
          />
        </mat-form-field>

        <button matButton="outlined" type="submit">Buscar</button>
        <a matButton="filled" routerLink="new">Novo equipamento</a>
      </form>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">build</mat-icon>
          <p>Nenhum equipamento encontrado.</p>
          <a matButton="filled" routerLink="new">Novo equipamento</a>
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
                {{ item.category ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="externalRentalMonthly">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Locação ext. (R$/mês)
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.externalRentalMonthly ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="internalRentalMonthly">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Locação int. (R$/mês)
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.internalRentalMonthly ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="purchasePrice">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Aquisição (R$)
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.purchasePrice ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="depreciationYears">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Amortização (anos)
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.depreciationYears ?? '—' }}
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
      width: 12rem;
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
export class EquipmentListComponent {
  private readonly api = inject(EquipmentApi);

  protected readonly columns = [
    'code',
    'description',
    'category',
    'externalRentalMonthly',
    'internalRentalMonthly',
    'purchasePrice',
    'depreciationYears',
    'pending',
    'actions',
  ];

  readonly term = signal('');
  readonly categoryFilter = signal('');
  readonly items = signal<EquipmentSummary[]>([]);
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
    this.api
      .list(this.term() || undefined, this.categoryFilter() || undefined)
      .subscribe({
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
