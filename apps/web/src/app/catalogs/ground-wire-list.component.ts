import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { GroundWireSummary, GroundWireType } from '@lt-offers/domain';
import {
  GROUND_WIRE_TYPE_LABELS,
  typeSpecificSummary,
} from './ground-wire-labels';
import { GroundWiresApi } from './ground-wires-api.service';

@Component({
  selector: 'app-ground-wire-list',
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
      <h2>Catálogo de cabos de guarda</h2>

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
          class="type-field"
        >
          <mat-label>Tipo</mat-label>
          <mat-select
            id="type"
            [value]="typeFilter()"
            (selectionChange)="filterByType($event.value)"
          >
            <mat-option value="">Todos</mat-option>
            <mat-option value="STEEL">Aço</mat-option>
            <mat-option value="OPGW">OPGW</mat-option>
          </mat-select>
        </mat-form-field>
        <button matButton="outlined" type="submit">Buscar</button>
        <a matButton="filled" routerLink="new">Novo cabo de guarda</a>
      </form>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">cable</mat-icon>
          <p>Nenhum cabo de guarda encontrado.</p>
          <a matButton="filled" routerLink="new">Novo cabo de guarda</a>
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

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef scope="col">Tipo</th>
              <td mat-cell *matCellDef="let item">
                {{ typeLabel(item.type) }}
              </td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef scope="col">Descrição</th>
              <td mat-cell *matCellDef="let item">
                {{ item.effectiveVersion?.description ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="weightTonPerKm">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Peso (ton/km)
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.weightTonPerKm ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="reelLengthM">
              <th mat-header-cell *matHeaderCellDef scope="col">Bobina (m)</th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.reelLengthM ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="diameterMm">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Diâmetro (mm)
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.diameterMm ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="utsKn">
              <th mat-header-cell *matHeaderCellDef scope="col">UTS (kN)</th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.utsKn ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="specifics">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Atributos do tipo
              </th>
              <td mat-cell *matCellDef="let item">
                {{ specifics(item) }}
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
    .type-field {
      min-width: 10rem;
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
export class GroundWireListComponent {
  private readonly api = inject(GroundWiresApi);

  protected readonly columns = [
    'code',
    'type',
    'description',
    'weightTonPerKm',
    'reelLengthM',
    'diameterMm',
    'utsKn',
    'specifics',
    'pending',
    'actions',
  ];

  readonly term = signal('');
  readonly typeFilter = signal<'' | GroundWireType>('');
  readonly items = signal<GroundWireSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.reload();
  }

  search(event: Event): void {
    event.preventDefault();
    this.reload();
  }

  filterByType(value: string): void {
    this.typeFilter.set(value as '' | GroundWireType);
    this.reload();
  }

  typeLabel(type: GroundWireType): string {
    return GROUND_WIRE_TYPE_LABELS[type];
  }

  specifics(item: GroundWireSummary): string {
    return typeSpecificSummary(item);
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.api
      .list(this.term() || undefined, this.typeFilter() || undefined)
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
