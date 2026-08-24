import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TowerTypeHistory } from '@lt-offers/domain';
import { TOWER_FUNCTION_LABELS } from './tower-function-labels';
import { TowerTypesApi } from './tower-types-api.service';

@Component({
  selector: 'app-tower-type-history',
  imports: [
    RouterLink,
    DatePipe,
    MatCardModule,
    MatProgressBarModule,
    MatTableModule,
    MatButtonModule,
  ],
  template: `
    <section>
      <h2>
        Histórico de versões — <span class="mono">{{ history()?.code }}</span>
        @if (history(); as h) {
          <small>({{ functionLabels[h.function] }})</small>
        }
      </h2>
      <a
        matButton
        [routerLink]="
          seriesId() !== null
            ? ['/catalogs/structure-series', seriesId()]
            : ['/catalogs/structure-series']
        "
      >
        Voltar à série
      </a>

      @if (history(); as h) {
        <p class="caption-text">
          Da vigência mais recente para a mais antiga; versões são imutáveis
        </p>
        @for (version of h.versions; track version.id) {
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>
                Vigente desde
                {{ version.effectiveFrom | date: 'dd/MM/yyyy' : 'UTC' }}
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>
                Estais:
                <strong class="mono">{{ version.guyCount ?? '—' }}</strong> ·
                Autor: {{ version.createdBy }} · Criada em
                {{ version.createdAt | date: 'dd/MM/yyyy HH:mm' }}
              </p>
              @if (version.weights.length === 0) {
                <p>
                  <span class="badge">Sem pontos na tabela peso × altura</span>
                </p>
              } @else {
                <table mat-table [dataSource]="version.weights" class="dense">
                  <ng-container matColumnDef="heightM">
                    <th mat-header-cell *matHeaderCellDef scope="col">
                      Altura (m)
                    </th>
                    <td mat-cell *matCellDef="let point" class="mono num">
                      {{ point.heightM }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="weightKg">
                    <th mat-header-cell *matHeaderCellDef scope="col">
                      Peso (kg)
                    </th>
                    <td mat-cell *matCellDef="let point" class="mono num">
                      {{ point.weightKg }}
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="weightColumns"></tr>
                  <tr
                    mat-row
                    *matRowDef="let point; columns: weightColumns"
                  ></tr>
                </table>
              }
            </mat-card-content>
          </mat-card>
        }
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando…</p>
      }
    </section>
  `,
  styles: `
    mat-card {
      margin-top: 1rem;
      max-width: 40rem;
    }
    .caption-text {
      margin-top: 1rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    table {
      min-width: 18rem;
    }
    .error {
      color: var(--mat-sys-error);
    }
    h2 small {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class TowerTypeHistoryComponent {
  private readonly api = inject(TowerTypesApi);
  private readonly route = inject(ActivatedRoute);

  readonly functionLabels = TOWER_FUNCTION_LABELS;

  protected readonly weightColumns = ['heightM', 'weightKg'];

  readonly seriesId = signal<number | null>(null);
  readonly history = signal<TowerTypeHistory | null>(null);
  readonly error = signal('');

  constructor() {
    const paramMap = this.route.snapshot.paramMap;
    const seriesId = Number(paramMap.get('seriesId'));
    const id = Number(paramMap.get('id'));
    // Guardas independentes: com seriesId válido e id do tipo malformado, o
    // link "Voltar à série" continua apontando para a série certa.
    if (Number.isInteger(seriesId) && seriesId > 0) {
      this.seriesId.set(seriesId);
    }
    if (
      !Number.isInteger(seriesId) ||
      seriesId <= 0 ||
      !Number.isInteger(id) ||
      id <= 0
    ) {
      this.error.set('Identificador inválido');
      return;
    }
    this.api.history(seriesId, id).subscribe({
      next: (h) => this.history.set(h),
      error: () =>
        this.error.set(
          'Não foi possível carregar o histórico; tente novamente',
        ),
    });
  }
}
