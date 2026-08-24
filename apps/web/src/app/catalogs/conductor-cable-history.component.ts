import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConductorCableHistory } from '@lt-offers/domain';
import { ConductorCablesApi } from './conductor-cables-api.service';

@Component({
  selector: 'app-conductor-cable-history',
  imports: [RouterLink, DatePipe, MatTableModule, MatButtonModule],
  template: `
    <section>
      <h2>Histórico de versões — {{ history()?.code }}</h2>
      <a matButton routerLink="/catalogs/conductor-cables">
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

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef scope="col">Descrição</th>
              <td mat-cell *matCellDef="let version">
                {{ version.description ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="weightTonPerKm">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Peso (ton/km)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.weightTonPerKm ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="reelLengthM">
              <th mat-header-cell *matHeaderCellDef scope="col">Bobina (m)</th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.reelLengthM ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="diameterMm">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Diâmetro (mm)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.diameterMm ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="utsKn">
              <th mat-header-cell *matHeaderCellDef scope="col">UTS (kN)</th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.utsKn ?? '—' }}
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
export class ConductorCableHistoryComponent {
  private readonly api = inject(ConductorCablesApi);
  private readonly route = inject(ActivatedRoute);

  protected readonly columns = [
    'effectiveFrom',
    'description',
    'weightTonPerKm',
    'reelLengthM',
    'diameterMm',
    'utsKn',
    'createdBy',
    'createdAt',
  ];

  readonly history = signal<ConductorCableHistory | null>(null);
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
