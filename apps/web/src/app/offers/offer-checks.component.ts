import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  OfferHealthSummary,
  CheckFinding,
  CheckSeverity,
  CheckModule,
  CheckNavigationTarget,
} from '@lt-offers/domain';
import { ChecksApiService } from './checks-api.service';

@Component({
  selector: 'app-offer-checks',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="checks-container">
      <!-- Header -->
      <div class="header-section">
        <div>
          <div class="subtitle-badge">
            Fase F6.1 · Módulo M12 (RF-62, RF-63, RNF-09)
          </div>
          <h2 class="title">
            Painel de Verificações de Consistência & Integridade
          </h2>
          <p class="description">
            Diagnóstico global cruzado em tempo real sobre quantitativos,
            cotações, cronograma, histogramas, serviços e desembolso.
          </p>
        </div>

        <button
          type="button"
          class="btn btn-refresh"
          [disabled]="loading()"
          (click)="loadChecks()"
        >
          ↻ Atualizar Diagnóstico
        </button>
      </div>

      @if (healthSummary(); as summary) {
        <!-- Global Health Banner -->
        <div
          class="health-banner"
          [class.healthy]="summary.status === 'HEALTHY'"
          [class.warnings]="summary.status === 'WARNINGS_ONLY'"
          [class.critical]="summary.status === 'CRITICAL_ERRORS'"
        >
          <div class="status-icon">
            @if (summary.status === 'HEALTHY') {
              ✓
            } @else if (summary.status === 'WARNINGS_ONLY') {
              ⚠
            } @else {
              ✕
            }
          </div>
          <div class="status-content">
            <h3 class="status-title">
              @if (summary.status === 'HEALTHY') {
                Proposta 100% Consistente e Íntegra
              } @else if (summary.status === 'WARNINGS_ONLY') {
                Avisos Operacionais Identificados (Fechamento Permitido com
                Justificativa)
              } @else {
                Inconsistências Críticas Impeditivas (Fechamento Bloqueado)
              }
            </h3>
            <p class="status-desc">
              @if (summary.status === 'HEALTHY') {
                Todas as baterias de validação cruzada foram aprovadas sem
                qualquer discrepância. A revisão está pronta para fechamento.
              } @else if (summary.status === 'WARNINGS_ONLY') {
                Existem {{ summary.warningCount }} alerta(s) de produção ou
                déficit operacional. O orçamentista pode fechar a revisão
                fornecendo justificativa formal.
              } @else {
                Existem {{ summary.criticalCount }} erro(s) crítico(s) que
                corrompem a integridade dos cálculos. Corrija os itens listados
                para habilitar o fechamento da revisão.
              }
            </p>
          </div>
        </div>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card critical">
            <span class="kpi-label">Pendências Críticas (Bloqueantes)</span>
            <span class="kpi-value critical-text">{{
              summary.criticalCount
            }}</span>
            <span class="kpi-subtext">Impedem emissão e fechamento</span>
          </div>

          <div class="kpi-card warning">
            <span class="kpi-label">Alertas Operacionais (Justificáveis)</span>
            <span class="kpi-value warning-text">{{
              summary.warningCount
            }}</span>
            <span class="kpi-subtext"
              >Requerem nota formal de turno/locação</span
            >
          </div>

          <div class="kpi-card info">
            <span class="kpi-label">Recomendações e Notas</span>
            <span class="kpi-value info-text">{{ summary.infoCount }}</span>
            <span class="kpi-subtext">Boas práticas e otimizações</span>
          </div>
        </div>

        <!-- Filter & Findings List -->
        <div class="findings-card">
          <div class="card-header">
            <div class="card-title-row">
              <h3>
                Lista de Diagnósticos e Apontamentos ({{
                  filteredFindings().length
                }})
              </h3>

              <div class="filter-pills">
                <button
                  type="button"
                  class="pill-btn"
                  [class.active]="selectedSeverity() === 'ALL'"
                  (click)="setSeverityFilter('ALL')"
                >
                  Todos ({{ summary.findings.length }})
                </button>
                <button
                  type="button"
                  class="pill-btn critical"
                  [class.active]="selectedSeverity() === 'CRITICAL'"
                  (click)="setSeverityFilter('CRITICAL')"
                >
                  Críticos ({{ summary.criticalCount }})
                </button>
                <button
                  type="button"
                  class="pill-btn warning"
                  [class.active]="selectedSeverity() === 'WARNING'"
                  (click)="setSeverityFilter('WARNING')"
                >
                  Alertas ({{ summary.warningCount }})
                </button>
              </div>
            </div>
          </div>

          <div class="findings-list">
            @for (f of filteredFindings(); track f.id) {
              <div
                class="finding-item"
                [class.critical-border]="f.severity === 'CRITICAL'"
                [class.warning-border]="f.severity === 'WARNING'"
              >
                <div class="finding-header">
                  <div class="badges-group">
                    <span
                      class="severity-badge"
                      [class.critical]="f.severity === 'CRITICAL'"
                      [class.warning]="f.severity === 'WARNING'"
                      [class.info]="f.severity === 'INFO'"
                    >
                      {{
                        f.severity === 'CRITICAL'
                          ? 'CRÍTICO'
                          : f.severity === 'WARNING'
                            ? 'ALERTA'
                            : 'INFO'
                      }}
                    </span>
                    <span class="rule-badge">{{ f.ruleId }}</span>
                    <span class="module-badge">{{
                      getModuleLabel(f.module)
                    }}</span>
                    @if (f.lineName) {
                      <span class="line-badge">{{ f.lineName }}</span>
                    }
                  </div>

                  @if (f.navigationTarget) {
                    <button
                      type="button"
                      class="btn-nav"
                      (click)="onNavigate(f.navigationTarget!)"
                    >
                      Ir para Pendência →
                    </button>
                  }
                </div>

                <div class="finding-body">
                  <h4 class="finding-title">{{ f.title }}</h4>
                  <p class="finding-message">{{ f.message }}</p>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                ✓ Nenhuma pendência encontrada nesta categoria! A proposta está
                em perfeita conformidade.
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .checks-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1rem 0;
      }
      .header-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 1rem;
      }
      .subtitle-badge {
        font-size: 0.75rem;
        font-weight: 700;
        color: #3b82f6;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
      }
      .title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }
      .description {
        color: #64748b;
        margin: 0.25rem 0 0;
        font-size: 0.9rem;
      }
      .btn-refresh {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        padding: 0.45rem 0.9rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: #334155;
        border-radius: 6px;
        cursor: pointer;
      }
      .btn-refresh:hover {
        background: #e2e8f0;
      }
      .health-banner {
        display: flex;
        gap: 1rem;
        padding: 1.25rem;
        border-radius: 8px;
        border: 1px solid transparent;
      }
      .health-banner.healthy {
        background: #f0fdf4;
        border-color: #86efac;
        color: #166534;
      }
      .health-banner.warnings {
        background: #fffbeb;
        border-color: #fde68a;
        color: #92400e;
      }
      .health-banner.critical {
        background: #fef2f2;
        border-color: #fca5a5;
        color: #991b1b;
      }
      .status-icon {
        font-size: 2rem;
        font-weight: 800;
        line-height: 1;
      }
      .status-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .status-title {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
      }
      .status-desc {
        margin: 0;
        font-size: 0.85rem;
        opacity: 0.9;
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
      }
      .kpi-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .kpi-card.critical {
        border-color: #fca5a5;
        background: #fff5f5;
      }
      .kpi-card.warning {
        border-color: #fde68a;
        background: #fffdf5;
      }
      .kpi-card.info {
        border-color: #bfdbfe;
        background: #f8faff;
      }
      .kpi-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        font-weight: 700;
        color: #64748b;
      }
      .kpi-value {
        font-size: 1.5rem;
        font-weight: 800;
      }
      .critical-text {
        color: #dc2626;
      }
      .warning-text {
        color: #d97706;
      }
      .info-text {
        color: #2563eb;
      }
      .kpi-subtext {
        font-size: 0.75rem;
        color: #94a3b8;
      }
      .findings-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
      }
      .card-header {
        padding: 0.8rem 1rem;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
      }
      .card-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .card-title-row h3 {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
        color: #1e293b;
      }
      .filter-pills {
        display: flex;
        gap: 0.4rem;
      }
      .pill-btn {
        border: 1px solid #cbd5e1;
        background: #ffffff;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        cursor: pointer;
        color: #64748b;
      }
      .pill-btn.active {
        background: #0f172a;
        color: #ffffff;
        border-color: #0f172a;
      }
      .pill-btn.critical.active {
        background: #dc2626;
        border-color: #dc2626;
        color: #ffffff;
      }
      .pill-btn.warning.active {
        background: #d97706;
        border-color: #d97706;
        color: #ffffff;
      }
      .findings-list {
        display: flex;
        flex-direction: column;
        divide-y: 1px solid #e2e8f0;
      }
      .finding-item {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        border-left: 4px solid transparent;
        border-bottom: 1px solid #f1f5f9;
      }
      .finding-item.critical-border {
        border-left-color: #dc2626;
      }
      .finding-item.warning-border {
        border-left-color: #d97706;
      }
      .finding-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .badges-group {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .severity-badge {
        font-size: 0.7rem;
        font-weight: 800;
        padding: 0.15rem 0.45rem;
        border-radius: 4px;
      }
      .severity-badge.critical {
        background: #fee2e2;
        color: #991b1b;
      }
      .severity-badge.warning {
        background: #fef3c7;
        color: #92400e;
      }
      .severity-badge.info {
        background: #dbeafe;
        color: #1e40af;
      }
      .rule-badge {
        font-size: 0.7rem;
        font-weight: 700;
        background: #f1f5f9;
        color: #475569;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        border: 1px solid #cbd5e1;
      }
      .module-badge {
        font-size: 0.7rem;
        font-weight: 600;
        background: #e2e8f0;
        color: #334155;
        padding: 0.15rem 0.45rem;
        border-radius: 4px;
      }
      .line-badge {
        font-size: 0.7rem;
        font-weight: 600;
        background: #f8fafc;
        color: #64748b;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        border: 1px solid #e2e8f0;
      }
      .btn-nav {
        background: #eff6ff;
        border: 1px solid #93c5fd;
        color: #1d4ed8;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.3rem 0.6rem;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .btn-nav:hover {
        background: #2563eb;
        color: #ffffff;
      }
      .finding-title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
        color: #0f172a;
      }
      .finding-message {
        margin: 0.2rem 0 0;
        font-size: 0.85rem;
        color: #475569;
        line-height: 1.4;
      }
      .empty-state {
        padding: 3rem 1rem;
        text-align: center;
        color: #16a34a;
        font-weight: 600;
        font-size: 0.95rem;
      }
    `,
  ],
})
export class OfferChecksComponent implements OnInit {
  @Input({ required: true }) offerId!: number;
  @Output() navigateTo = new EventEmitter<CheckNavigationTarget>();

  private checksApi = inject(ChecksApiService);

  loading = signal(false);
  healthSummary = signal<OfferHealthSummary | null>(null);
  selectedSeverity = signal<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');

  ngOnInit(): void {
    this.loadChecks();
  }

  loadChecks(): void {
    this.loading.set(true);
    this.checksApi.getHealthChecks(this.offerId).subscribe({
      next: (res) => {
        this.healthSummary.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  setSeverityFilter(sev: 'ALL' | 'CRITICAL' | 'WARNING'): void {
    this.selectedSeverity.set(sev);
  }

  filteredFindings(): CheckFinding[] {
    const summary = this.healthSummary();
    if (!summary) return [];

    const sev = this.selectedSeverity();
    if (sev === 'ALL') return summary.findings;
    return summary.findings.filter((f) => f.severity === sev);
  }

  getModuleLabel(mod: CheckModule): string {
    const labels: Record<CheckModule, string> = {
      STAKING: 'Estaqueamento (M04)',
      MATERIALS_TAX: 'Suprimentos & Tributos (M06)',
      SCHEDULE_RESOURCES: 'Cronograma (M07)',
      HISTOGRAM_CAMPS: 'Histogramas & Canteiros (M08)',
      SERVICES_CONTRACT: 'Serviços Contratuais (M09)',
      CASHFLOW_DISBURSEMENT: 'Desembolso & Caixa (M11)',
    };
    return labels[mod] || mod;
  }

  onNavigate(target: CheckNavigationTarget): void {
    this.navigateTo.emit(target);
  }
}
