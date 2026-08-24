import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StructureSeriesHistory } from '@lt-offers/domain';
import { StructureSeriesApi } from './structure-series-api.service';

@Component({
  selector: 'app-structure-series-history',
  imports: [
    RouterLink,
    DatePipe,
    MatProgressBarModule,
    MatTableModule,
    MatButtonModule,
  ],
  template: `
    <section>
      <h2>Histórico de versões — {{ history()?.name }}</h2>
      <a matButton routerLink="/catalogs/structure-series">
        Voltar à listagem
      </a>

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

            <ng-container matColumnDef="designer">
              <th mat-header-cell *matHeaderCellDef scope="col">Projetista</th>
              <td mat-cell *matCellDef="let version">
                {{ version.designer ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="voltageKv">
              <th mat-header-cell *matHeaderCellDef scope="col">Tensão (kV)</th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.voltageKv ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="circuitCount">
              <th mat-header-cell *matHeaderCellDef scope="col">Circuitos</th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.circuitCount ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="cablesPerPhase">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Cabos por fase
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.cablesPerPhase ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="designWindSpeedMs">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Vento de projeto (m/s)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.designWindSpeedMs ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="insulatorType">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Tipo de isolador
              </th>
              <td mat-cell *matCellDef="let version">
                {{ version.insulatorType ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="silMw">
              <th mat-header-cell *matHeaderCellDef scope="col">SIL (MW)</th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.silMw ?? '—' }}
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
export class StructureSeriesHistoryComponent {
  private readonly api = inject(StructureSeriesApi);
  private readonly route = inject(ActivatedRoute);

  protected readonly columns = [
    'effectiveFrom',
    'designer',
    'voltageKv',
    'circuitCount',
    'cablesPerPhase',
    'designWindSpeedMs',
    'insulatorType',
    'silMw',
    'createdBy',
    'createdAt',
  ];

  readonly history = signal<StructureSeriesHistory | null>(null);
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
