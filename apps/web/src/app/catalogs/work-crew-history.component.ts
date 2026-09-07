import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WorkCrewHistory } from '@lt-offers/domain';
import { WorkCrewsApi } from './work-crews-api.service';

const PERIOD_SHORT_LABELS: Record<string, string> = {
  HOUR: 'hora',
  DAY: 'dia',
  WEEK: 'sem.',
  MONTH: 'mês',
};

@Component({
  selector: 'app-work-crew-history',
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
          <small>({{ h.name }})</small>
        }
      </h2>
      <a matButton routerLink="/catalogs/work-crews">
        Voltar à lista
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
                Produção teórica:
                <strong class="mono">
                  {{
                    version.standardProductionRate
                      ? version.standardProductionRate +
                        (version.productionUnit ? ' ' + version.productionUnit : '') +
                        (version.productionPeriod
                          ? '/' + (periodShortLabels[version.productionPeriod] ?? version.productionPeriod)
                          : '')
                      : '—'
                  }}
                </strong>
                · Autor: {{ version.createdBy }} · Criada em
                {{ version.createdAt | date: 'dd/MM/yyyy HH:mm' }}
              </p>

              <h3>Mão de Obra</h3>
              @if (version.laborRoles.length === 0) {
                <p>
                  <span class="badge">Nenhum cargo na composição</span>
                </p>
              } @else {
                <table mat-table [dataSource]="version.laborRoles" class="dense">
                  <ng-container matColumnDef="code">
                    <th mat-header-cell *matHeaderCellDef scope="col">Código</th>
                    <td mat-cell *matCellDef="let role" class="mono">
                      {{ role.laborRoleCode ?? '—' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef scope="col">Cargo</th>
                    <td mat-cell *matCellDef="let role">
                      {{ role.laborRoleName ?? '—' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="quantity">
                    <th mat-header-cell *matHeaderCellDef scope="col">Qtd</th>
                    <td mat-cell *matCellDef="let role" class="mono num">
                      {{ role.quantity }}
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="laborColumns"></tr>
                  <tr mat-row *matRowDef="let role; columns: laborColumns"></tr>
                </table>
              }

              <h3>Equipamentos</h3>
              @if (version.equipments.length === 0) {
                <p>
                  <span class="badge">Nenhum equipamento na composição</span>
                </p>
              } @else {
                <table mat-table [dataSource]="version.equipments" class="dense">
                  <ng-container matColumnDef="code">
                    <th mat-header-cell *matHeaderCellDef scope="col">Código</th>
                    <td mat-cell *matCellDef="let eq" class="mono">
                      {{ eq.equipmentCode ?? '—' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="description">
                    <th mat-header-cell *matHeaderCellDef scope="col">Equipamento</th>
                    <td mat-cell *matCellDef="let eq">
                      {{ eq.equipmentDescription ?? '—' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="quantity">
                    <th mat-header-cell *matHeaderCellDef scope="col">Qtd</th>
                    <td mat-cell *matCellDef="let eq" class="mono num">
                      {{ eq.quantity }}
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="equipmentColumns"></tr>
                  <tr mat-row *matRowDef="let eq; columns: equipmentColumns"></tr>
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
      max-width: 44rem;
    }
    .caption-text {
      margin-top: 1rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    h3 {
      margin-top: 1rem;
      font: var(--mat-sys-label-large);
      color: var(--mat-sys-on-surface);
    }
    table {
      width: 100%;
      margin-bottom: 0.5rem;
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
export class WorkCrewHistoryComponent {
  private readonly api = inject(WorkCrewsApi);
  private readonly route = inject(ActivatedRoute);

  readonly periodShortLabels = PERIOD_SHORT_LABELS;

  protected readonly laborColumns = ['code', 'name', 'quantity'];
  protected readonly equipmentColumns = ['code', 'description', 'quantity'];

  readonly history = signal<WorkCrewHistory | null>(null);
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
