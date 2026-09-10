import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LaborRoleHistory } from '@lt-offers/domain';
import { LaborRolesApi } from './labor-roles-api.service';

@Component({
  selector: 'app-labor-role-history',
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
        Histórico de versões — {{ history()?.code }} ({{ history()?.name }})
      </h2>
      <a matButton routerLink="/catalogs/labor-roles">Voltar à listagem</a>

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

            <ng-container matColumnDef="baseSalary">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Salário base (R$)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.baseSalary ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="hazardPayPercent">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Periculosidade (%)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.hazardPayPercent ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="overtimePercent">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Hora extra (%)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.overtimePercent ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="dsrOvertimePercent">
              <th mat-header-cell *matHeaderCellDef scope="col">DSR HE (%)</th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.dsrOvertimePercent ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="socialChargesPercent">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Encargos (%)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.socialChargesPercent ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="foodAllowanceMonthly">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Alimentação (R$)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.foodAllowanceMonthly ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="housingMonthly">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Alojamento (R$)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.housingMonthly ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="homeLeaveTravelMonthly">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Folgas/Viagem (R$)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.homeLeaveTravelMonthly ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="healthInsuranceMonthly">
              <th mat-header-cell *matHeaderCellDef scope="col">Saúde (R$)</th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.healthInsuranceMonthly ?? '—' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="lifeInsuranceMonthly">
              <th mat-header-cell *matHeaderCellDef scope="col">
                Seguro de vida (R$)
              </th>
              <td mat-cell *matCellDef="let version" class="mono num">
                {{ version.lifeInsuranceMonthly ?? '—' }}
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
export class LaborRoleHistoryComponent {
  private readonly api = inject(LaborRolesApi);
  private readonly route = inject(ActivatedRoute);

  protected readonly columns = [
    'effectiveFrom',
    'baseSalary',
    'hazardPayPercent',
    'overtimePercent',
    'dsrOvertimePercent',
    'socialChargesPercent',
    'foodAllowanceMonthly',
    'housingMonthly',
    'homeLeaveTravelMonthly',
    'healthInsuranceMonthly',
    'lifeInsuranceMonthly',
    'createdBy',
    'createdAt',
  ];

  readonly history = signal<LaborRoleHistory | null>(null);
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
