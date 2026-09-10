import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { OfferSummary } from '@lt-offers/domain';
import { OffersApi } from '../offers/offers-api.service';

export interface PendingAction {
  id: string;
  towerId: string;
  project: string;
  issue: string;
  status: 'critical' | 'pending' | 'analysis';
  statusLabel: string;
  routeLink: string[];
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly offersApi = inject(OffersApi);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly offers = signal<OfferSummary[]>([]);

  // KPIs
  readonly totalTowers = signal(154);
  readonly pendingValidation = signal(12);
  readonly releasedTowers = signal(138);
  readonly criticalAlerts = signal(4);

  // Pending issues list
  readonly pendingActions = signal<PendingAction[]>([
    {
      id: '1',
      towerId: 'TR-042',
      project: 'LT 500kV Norte',
      issue: 'Afloramento fora do limite (>15cm)',
      status: 'critical',
      statusLabel: 'Crítico',
      routeLink: ['/offers'],
    },
    {
      id: '2',
      towerId: 'TE-118',
      project: 'LT 230kV Sul',
      issue: 'Aguardando Validação de Ensaio SPT',
      status: 'pending',
      statusLabel: 'Pendente',
      routeLink: ['/offers'],
    },
    {
      id: '3',
      towerId: 'TM-089',
      project: 'LT 500kV Norte',
      issue: 'Conflito de cotas no projeto base',
      status: 'critical',
      statusLabel: 'Crítico',
      routeLink: ['/offers'],
    },
    {
      id: '4',
      towerId: 'S-012',
      project: 'Expansão Oeste',
      issue: 'Revisão de documentação auxiliar',
      status: 'analysis',
      statusLabel: 'Análise',
      routeLink: ['/offers'],
    },
  ]);

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.offersApi.list().subscribe({
      next: (data) => {
        this.offers.set(data);
        if (data.length > 0) {
          const pendingCount = data.filter((o) => o.hasPendingIssues).length;
          this.pendingValidation.set(pendingCount > 0 ? pendingCount : 12);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  syncData(): void {
    this.snackBar.open('Sincronizando dados com o servidor central...', '', {
      duration: 2000,
    });
    setTimeout(() => {
      this.loadData();
      this.snackBar.open('Dados sincronizados com sucesso!', 'OK', {
        duration: 3000,
      });
    }, 1200);
  }

  exportReports(): void {
    this.snackBar.open('Exportando relatório consolidado do painel...', 'OK', {
      duration: 3000,
    });
  }
}
