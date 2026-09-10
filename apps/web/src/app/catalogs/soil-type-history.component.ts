import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SoilTypeHistory, SoilTypeVersion } from '@lt-offers/domain';
import { SoilTypesApi } from './soil-types-api.service';

@Component({
  selector: 'app-soil-type-history',
  imports: [
    RouterLink,
    DatePipe,
    MatProgressBarModule,
    MatTableModule,
    MatButtonModule,
  ],
  template: `
    <section>
      <h2>Histórico de versões — {{ history()?.code }}</h2>
      <a matButton routerLink="/catalogs/soil-types">Voltar à listagem</a>

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

            <ng-container matColumnDef="submerged">
              <th mat-header-cell *matHeaderCellDef scope="col">Submerso</th>
              <td mat-cell *matCellDef="let version">
                {{ submergedLabel(version) }}
              </td>
            </ng-container>

            <ng-container matColumnDef="allowableCompressionStressKgfCm2">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Tensão admissível (kgf/cm²)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.allowableCompressionStressKgfCm2 ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="specificWeightKgfM3">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Peso específico (kgf/m³)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.specificWeightKgfM3 ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="internalFrictionAngleDeg">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Ângulo de atrito (°)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.internalFrictionAngleDeg ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="cohesionKgCm2">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Coesão (kg/cm²)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.cohesionKgCm2 ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="nspt">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Faixa de NSPT
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ nsptRange(version) }}
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
export class SoilTypeHistoryComponent {
  private readonly api = inject(SoilTypesApi);
  private readonly route = inject(ActivatedRoute);

  protected readonly columns = [
    'effectiveFrom',
    'description',
    'submerged',
    'allowableCompressionStressKgfCm2',
    'specificWeightKgfM3',
    'internalFrictionAngleDeg',
    'cohesionKgCm2',
    'nspt',
    'createdBy',
    'createdAt',
  ];

  readonly history = signal<SoilTypeHistory | null>(null);
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

  /** false informado é valor ("Não"), distinto de não informado (RNF-09). */
  submergedLabel(version: SoilTypeVersion): string {
    if (version.submerged === true) {
      return 'Sim';
    }
    if (version.submerged === false) {
      return 'Não';
    }
    return '—';
  }

  nsptRange(version: SoilTypeVersion): string {
    if (version.nsptMin === null || version.nsptMax === null) {
      return '—';
    }
    return `${version.nsptMin} ≤ N < ${version.nsptMax}`;
  }
}
