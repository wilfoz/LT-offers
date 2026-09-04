import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { SoilTypeSummary, SoilTypeVersion } from '@lt-offers/domain';
import { SoilTypesApi } from './soil-types-api.service';

@Component({
  selector: 'app-soil-type-list',
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
      <h2>Catálogo de tipos de solo</h2>

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
        <a matButton="filled" routerLink="new">Novo tipo de solo</a>
      </form>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">landscape</mat-icon>
          <p>Nenhum tipo de solo encontrado.</p>
          <a matButton="filled" routerLink="new">Novo tipo de solo</a>
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

            <ng-container matColumnDef="submerged">
              <th mat-header-cell *matHeaderCellDef scope="col">Submerso</th>
              <td mat-cell *matCellDef="let item">
                {{ submergedLabel(item) }}
              </td>
            </ng-container>

            <ng-container matColumnDef="allowableCompressionStressKgfCm2">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Tensão admissível (kgf/cm²)
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{
                  item.effectiveVersion?.allowableCompressionStressKgfCm2 ?? '—'
                }}
              </td>
            </ng-container>

            <ng-container matColumnDef="specificWeightKgfM3">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Peso específico (kgf/m³)
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.specificWeightKgfM3 ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="internalFrictionAngleDeg">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Ângulo de atrito (°)
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.internalFrictionAngleDeg ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="cohesionKgCm2">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Coesão (kg/cm²)
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ item.effectiveVersion?.cohesionKgCm2 ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="nspt">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Faixa de NSPT
              </th>
              <td mat-cell *matCellDef="let item" class="mono num">
                {{ nsptRange(item.effectiveVersion) }}
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
export class SoilTypeListComponent {
  private readonly api = inject(SoilTypesApi);

  protected readonly columns = [
    'code',
    'description',
    'submerged',
    'allowableCompressionStressKgfCm2',
    'specificWeightKgfM3',
    'internalFrictionAngleDeg',
    'cohesionKgCm2',
    'nspt',
    'pending',
    'actions',
  ];

  readonly term = signal('');
  readonly items = signal<SoilTypeSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.reload();
  }

  search(event: Event): void {
    event.preventDefault();
    this.reload();
  }

  /** false informado é valor ("Não"), distinto de não informado (RNF-09). */
  submergedLabel(item: SoilTypeSummary): string {
    const submerged = item.effectiveVersion?.submerged;
    if (submerged === true) {
      return 'Sim';
    }
    if (submerged === false) {
      return 'Não';
    }
    return '—';
  }

  /** Faixa exibida como na planilha: mínimo inclusivo, máximo exclusivo. */
  nsptRange(version: SoilTypeVersion | null | undefined): string {
    if (
      version?.nsptMin === null ||
      version?.nsptMin === undefined ||
      version.nsptMax === null
    ) {
      return '—';
    }
    return `${version.nsptMin} ≤ N < ${version.nsptMax}`;
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
