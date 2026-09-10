import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EquipmentHistory } from '@lt-offers/domain';
import { EquipmentApi } from './equipment-api.service';

@Component({
  selector: 'app-equipment-history',
  imports: [
    RouterLink,
    DatePipe,
    MatProgressBarModule,
    MatTableModule,
    MatButtonModule,
  ],
  template: `
    <section>
      <h2>
        Histórico de versões — {{ history()?.code }} ({{
          history()?.description
        }})
      </h2>
      <a matButton routerLink="/catalogs/equipment">Voltar à listagem</a>

      @if (history(); as h) {
        <div class="table-scroll">
          <table mat-table [dataSource]="h.versions" class="dense">
            <caption>
              Da vigência mais recente para a mais antiga; versões são imutáveis
            </caption>

            <ng-container matColumnDef="effectiveFrom">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Início de vigência
              </th>
              <td mat-cell *matCellDef="let version" class="mono">
                {{ version.effectiveFrom | date: 'dd/MM/yyyy' : 'UTC' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="externalRentalMonthly">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Locação ext. (R$/mês)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.externalRentalMonthly ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="internalRentalMonthly">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Locação int. (R$/mês)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.internalRentalMonthly ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="purchasePrice">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Aquisição (R$)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.purchasePrice ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="depreciationYears">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Amortização (anos)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.depreciationYears ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="createdBy">
              <th mat-header-cell *matHeaderCellDef scope="col">Autor</th>
              <td mat-cell *matCellDef="let version">
                {{ version.createdBy }}
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef scope="col">Criada em</th>
              <td mat-cell *matCellDef="let version" class="mono">
                {{ version.createdAt | date: 'dd/MM/yyyy HH:mm' }}
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let version; columns: columns"></tr>
          </table>
        </div>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando…</p>
      }
    </section>
  `,
  styles: `
    table {
      width: 100%;
      margin-top: 1rem;
    }
    caption {
      caption-side: top;
      text-align: left;
      padding-block: 0.5rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    .error {
      color: var(--mat-sys-error);
    }
  `,
})
export class EquipmentHistoryComponent {
  private readonly api = inject(EquipmentApi);
  private readonly route = inject(ActivatedRoute);

  protected readonly columns = [
    'effectiveFrom',
    'externalRentalMonthly',
    'internalRentalMonthly',
    'purchasePrice',
    'depreciationYears',
    'createdBy',
    'createdAt',
  ];

  readonly history = signal<EquipmentHistory | null>(null);
  readonly error = signal('');

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('Identificador inválido');
      return;
    }
    this.api.history(id).subscribe({
      next: (h) => this.history.set(h),
      error: () =>
        this.error.set(
          'Não foi possível carregar o histórico; tente novamente',
        ),
    });
  }
}
