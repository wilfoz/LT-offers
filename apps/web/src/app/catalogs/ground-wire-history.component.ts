import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GroundWireHistory } from '@lt-offers/domain';
import { GROUND_WIRE_TYPE_LABELS } from './ground-wire-labels';
import { GroundWiresApi } from './ground-wires-api.service';

@Component({
  selector: 'app-ground-wire-history',
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
        Histórico de versões — {{ history()?.code }}
        @if (history(); as h) {
          <small>(tipo {{ typeLabel(h) }})</small>
        }
      </h2>
      <a matButton routerLink="/catalogs/ground-wires">Voltar à listagem</a>

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

            <ng-container matColumnDef="galvanizationClass">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Classe de galvanização
              </th>
              <td mat-cell *matCellDef="let version">
                {{ version.galvanizationClass ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="strengthGrade">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Grau de resistência
              </th>
              <td mat-cell *matCellDef="let version">
                {{ version.strengthGrade ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="wireCount">
              <th mat-header-cell *matHeaderCellDef scope="col">Fios</th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.wireCount ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="manufacturer">
              <th mat-header-cell *matHeaderCellDef scope="col">Fabricante</th>
              <td mat-cell *matCellDef="let version">
                {{ version.manufacturer ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="i2tKa2s">
              <th mat-header-cell *matHeaderCellDef scope="col">I²t (kA²·s)</th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.i2tKa2s ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="fiberCount">
              <th mat-header-cell *matHeaderCellDef scope="col">Fibras</th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.fiberCount ?? '—' }}
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

            <tr mat-header-row *matHeaderRowDef="columns()"></tr>
            <tr mat-row *matRowDef="let version; columns: columns()"></tr>
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
export class GroundWireHistoryComponent {
  private readonly api = inject(GroundWiresApi);
  private readonly route = inject(ActivatedRoute);

  readonly history = signal<GroundWireHistory | null>(null);
  readonly error = signal('');

  /** Colunas exibidas: as comuns mais as específicas do tipo do item. */
  protected readonly columns = computed(() => {
    const specific =
      this.history()?.type === 'STEEL'
        ? ['galvanizationClass', 'strengthGrade', 'wireCount']
        : ['manufacturer', 'i2tKa2s', 'fiberCount'];
    return [
      'effectiveFrom',
      'description',
      'weightTonPerKm',
      'reelLengthM',
      'diameterMm',
      'utsKn',
      ...specific,
      'createdBy',
      'createdAt',
    ];
  });

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

  typeLabel(history: GroundWireHistory): string {
    return GROUND_WIRE_TYPE_LABELS[history.type];
  }
}
