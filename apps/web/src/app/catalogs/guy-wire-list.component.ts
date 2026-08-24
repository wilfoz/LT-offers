import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { GuyWireSummary } from '@lt-offers/domain';
import { GuyWiresApi } from './guy-wires-api.service';

@Component({
  selector: 'app-guy-wire-list',
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
      <h2>Catálogo de cabos de tirante</h2>

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
        <button matButton="outlined" type="submit">Buscar</button>
        <a matButton="filled" routerLink="new">Novo cabo de tirante</a>
      </form>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">cable</mat-icon>
          <p>Nenhum cabo de tirante encontrado.</p>
          <a matButton="filled" routerLink="new">Novo cabo de tirante</a>
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

            <ng-container matColumnDef="galvanizationClass">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Classe de galvanização
              </th>
              <td mat-cell *matCellDef="let item">
                {{ item.effectiveVersion?.galvanizationClass ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="strengthGrade">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Grau de resistência
              </th>
              <td mat-cell *matCellDef="let item">
                {{ item.effectiveVersion?.strengthGrade ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="wireCount">
              <th mat-header-cell *matHeaderCellDef scope="col">Fios</th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.wireCount ?? '—' }}
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
export class GuyWireListComponent {
  private readonly api = inject(GuyWiresApi);

  protected readonly columns = [
    'code',
    'description',
    'weightTonPerKm',
    'reelLengthM',
    'diameterMm',
    'utsKn',
    'galvanizationClass',
    'strengthGrade',
    'wireCount',
    'pending',
    'actions',
  ];

  readonly term = signal('');
  readonly items = signal<GuyWireSummary[]>([]);
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
