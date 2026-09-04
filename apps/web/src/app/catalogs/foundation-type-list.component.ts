import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import {
  FoundationApplication,
  FoundationTypeSummary,
} from '@lt-offers/domain';
import {
  compositionSummary,
  FOUNDATION_APPLICATION_LABELS,
} from './foundation-labels';
import { FoundationTypesApi } from './foundation-types-api.service';

@Component({
  selector: 'app-foundation-type-list',
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
      <h2>Catálogo de tipos de fundação</h2>

      <form role="search" (submit)="search($event)">
        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="search-field"
        >
          <mat-label>Buscar por sigla ou descrição</mat-label>
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
          class="application-field"
        >
          <mat-label>Aplicação</mat-label>
          <mat-select
            id="application"
            [value]="applicationFilter()"
            (selectionChange)="filterByApplication($event.value)"
          >
            <mat-option value="">Todas</mat-option>
            <mat-option value="SELF_SUPPORTING">Autoportante</mat-option>
            <mat-option value="GUYED">Estaiada</mat-option>
            <mat-option value="CROSS_ROPE">Cross-rope</mat-option>
          </mat-select>
        </mat-form-field>
        <button matButton="outlined" type="submit">Buscar</button>
        <a matButton="filled" routerLink="new">Novo tipo de fundação</a>
      </form>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">foundation</mat-icon>
          <p>Nenhum tipo de fundação encontrado.</p>
          <a matButton="filled" routerLink="new">Novo tipo de fundação</a>
        </div>
      } @else {
        <div class="table-scroll">
          <table mat-table [dataSource]="items()" class="dense">
            <caption>
              Versões vigentes na data atual
            </caption>

            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef scope="col">Sigla</th>
              <td mat-cell *matCellDef="let item" class="mono">
                {{ item.code }}
              </td>
            </ng-container>

            <ng-container matColumnDef="application">
              <th mat-header-cell *matHeaderCellDef scope="col">Aplicação</th>
              <td mat-cell *matCellDef="let item">
                {{ applicationLabel(item.application) }}
              </td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef scope="col">Descrição</th>
              <td mat-cell *matCellDef="let item">
                {{ item.effectiveVersion?.description ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="composition">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Composição por elemento
              </th>
              <td mat-cell *matCellDef="let item">
                {{ composition(item) }}
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
      min-width: 16rem;
    }
    .application-field {
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
export class FoundationTypeListComponent {
  private readonly api = inject(FoundationTypesApi);

  protected readonly columns = [
    'code',
    'application',
    'description',
    'composition',
    'pending',
    'actions',
  ];

  readonly term = signal('');
  readonly applicationFilter = signal<'' | FoundationApplication>('');
  readonly items = signal<FoundationTypeSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.reload();
  }

  search(event: Event): void {
    event.preventDefault();
    this.reload();
  }

  filterByApplication(value: string): void {
    this.applicationFilter.set(value as '' | FoundationApplication);
    this.reload();
  }

  applicationLabel(application: FoundationApplication): string {
    return FOUNDATION_APPLICATION_LABELS[application];
  }

  composition(item: FoundationTypeSummary): string {
    return compositionSummary(item.effectiveVersion);
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.api
      .list(this.term() || undefined, this.applicationFilter() || undefined)
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
