import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ScheduleSummary,
  ScheduleActivity,
  MilestoneContract,
  ActivityGroup,
} from '@lt-offers/domain';
import { ScheduleApiService } from './schedule-api.service';

export const ACTIVITY_GROUP_LABELS: Record<ActivityGroup, string> = {
  INDIRECTS: 'Indiretos e Gestão',
  CAMPS: 'Canteiros de Obra',
  PRELIMINARIES: 'Serviços Preliminares & Acessos',
  CIVIL_WORKS: 'Obras Civis & Fundações',
  TOWER_ERECTION: 'Montagem Eletromecânica',
  STRINGING: 'Lançamento de Cabos & OPGW',
  COMMISSIONING: 'Comissionamento & Energização',
};

export const ACTIVITY_GROUP_COLORS: Record<ActivityGroup, string> = {
  INDIRECTS: '#64748b',
  CAMPS: '#eab308',
  PRELIMINARIES: '#10b981',
  CIVIL_WORKS: '#f97316',
  TOWER_ERECTION: '#3b82f6',
  STRINGING: '#8b5cf6',
  COMMISSIONING: '#ec4899',
};

@Component({
  selector: 'app-schedule-gantt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="schedule-container">
      <!-- 1. Header & Actions Bar -->
      <div class="header-section">
        <div>
          <div class="subtitle-badge">Fase F4 · Módulo M07</div>
          <h2 class="title">Cronograma Físico e Planejamento Temporal</h2>
          <p class="description">
            Dimensionamento de durações, alocação de equipes de trabalho, aplicação do redutor de produtividade por pluviosidade regional (RN-16), controle de marcos LI/LO e validação de sobreprodução (RN-15).
          </p>
        </div>

        <div class="actions-group">
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="loading()"
            (click)="loadSchedule()"
          >
            <span class="icon">🔄</span>
            Recalcular Cronograma
          </button>
        </div>
      </div>

      <!-- 2. Loading State -->
      @if (loading()) {
        <div class="loading-panel">
          <div class="spinner"></div>
          <span>Processando planejamento físico e temporal da linha...</span>
        </div>
      }

      <!-- 3. Error State -->
      @if (errorMessage()) {
        <div class="error-panel">
          <span class="error-icon">⚠️</span>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      @if (!loading() && schedule()) {
        <!-- 4. KPI Cards Summary -->
        <div class="kpis-grid">
          <div class="kpi-card">
            <div class="kpi-label">Duração Total da Obra</div>
            <div class="kpi-value highlight">{{ schedule()?.totalDurationMonths }} <span class="unit">meses</span></div>
            <div class="kpi-subtext">Início no Mês {{ schedule()?.startMonth }}</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Custo Total de Cronograma</div>
            <div class="kpi-value">{{ formatCurrency(schedule()?.totalScheduleCost) }}</div>
            <div class="kpi-subtext">Mobilização + Mensalidades + Desmob.</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Mão de Obra Direta</div>
            <div class="kpi-value">{{ formatCurrency(schedule()?.totalDirectLaborCost) }}</div>
            <div class="kpi-subtext">Equipes de Campo</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Indiretos de Obra</div>
            <div class="kpi-value">{{ formatCurrency(schedule()?.totalIndirectCost) }}</div>
            <div class="kpi-subtext">Gestão & Apoio</div>
          </div>
        </div>

        <!-- 5. Warnings Banner (if any) -->
        @if (schedule()?.warnings && schedule()!.warnings.length > 0) {
          <div class="warnings-banner">
            <div class="warning-title">
              <span>⚠️</span> Alertas de Consistência Temporal e Limites de Produção ({{ schedule()!.warnings.length }})
            </div>
            <ul class="warnings-list">
              @for (w of schedule()!.warnings; track w) {
                <li>{{ w }}</li>
              }
            </ul>
          </div>
        }

        <!-- 6. Marcos Contratuais (LI / LO) -->
        <div class="milestones-section">
          <h3 class="section-title">Marcos Contratuais de Transmissão (RF-39)</h3>
          <div class="milestones-chips">
            @for (m of schedule()?.milestones; track m.id) {
              <div class="milestone-chip" [class.mandatory]="m.isMandatory">
                <span class="milestone-code">{{ m.code }}</span>
                <div class="milestone-info">
                  <span class="milestone-name">{{ m.name }}</span>
                  <span class="milestone-target">Mês Alvo: <strong>M{{ m.targetMonth }}</strong> {{ m.targetDate ? '(' + m.targetDate + ')' : '' }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- 7. Interactive Gantt Chart -->
        <div class="gantt-section">
          <div class="section-header">
            <h3 class="section-title">Diagrama de Gantt & Linha do Tempo</h3>
            <div class="filters">
              <select [(ngModel)]="selectedGroupFilter" class="select-filter">
                <option value="ALL">Todos os Grupos</option>
                <option value="CIVIL_WORKS">Obras Civis</option>
                <option value="TOWER_ERECTION">Montagem de Torres</option>
                <option value="STRINGING">Lançamento de Cabos</option>
                <option value="PRELIMINARIES">Preliminares & Acessos</option>
                <option value="COMMISSIONING">Comissionamento</option>
                <option value="INDIRECTS">Indiretos</option>
              </select>
            </div>
          </div>

          <div class="gantt-wrapper">
            <div class="gantt-table">
              <!-- Header Months -->
              <div class="gantt-header-row">
                <div class="gantt-col-meta">Atividade / Frente de Serviço</div>
                <div class="gantt-col-qty">Quant.</div>
                <div class="gantt-col-crews">Equipes</div>
                <div class="gantt-col-prod">Prod./Mês</div>
                <div class="gantt-timeline-header">
                  @for (m of monthIndices(); track m) {
                    <div class="month-cell" [class.milestone-col]="isMilestoneMonth(m)">
                      M{{ m }}
                      @if (getMilestoneForMonth(m); as ms) {
                        <span class="ms-marker" [title]="ms.name">{{ ms.code }}</span>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Activity Rows -->
              @for (act of filteredActivities(); track act.id) {
                <div class="gantt-row" [class.row-warning]="act.status !== 'PLANNED'">
                  <div class="gantt-col-meta">
                    <span class="group-bullet" [style.background-color]="getGroupColor(act.group)"></span>
                    <div class="activity-names">
                      <span class="act-name">{{ act.name }}</span>
                      <span class="act-group">{{ getGroupLabel(act.group) }} · {{ act.assignedCrewName || 'Sem equipe' }}</span>
                    </div>
                  </div>
                  <div class="gantt-col-qty">{{ act.totalQuantity }} {{ act.quantityUnit }}</div>
                  <div class="gantt-col-crews">{{ act.crewCount }} eq.</div>
                  <div class="gantt-col-prod">{{ act.monthlyProduction }}/mês</div>

                  <div class="gantt-timeline-track">
                    <div
                      class="gantt-bar"
                      [style.left.%]="calculateBarLeft(act.startMonth)"
                      [style.width.%]="calculateBarWidth(act.durationMonths)"
                      [style.background-color]="getGroupColor(act.group)"
                      [class.bar-overproduction]="act.status === 'WARNING_OVERPRODUCTION'"
                      [class.bar-critical]="act.status === 'CRITICAL'"
                    >
                      <span class="bar-label">{{ act.durationMonths }}m (M{{ act.startMonth }}..M{{ act.endMonth }})</span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- 8. Detailed Activities Table -->
        <div class="table-section">
          <h3 class="section-title">Memória de Atividades e Custos Temporais</h3>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Atividade</th>
                  <th>Grupo</th>
                  <th>Quant. Total</th>
                  <th>Equipes</th>
                  <th>Duração</th>
                  <th>Período</th>
                  <th>Prod. Mensal</th>
                  <th>Mobilização</th>
                  <th>Custo Recorrente</th>
                  <th>Desmobilização</th>
                  <th>Custo Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (act of filteredActivities(); track act.id) {
                  <tr>
                    <td class="font-mono">{{ act.code }}</td>
                    <td class="font-bold">{{ act.name }}</td>
                    <td><span class="group-tag" [style.background-color]="getGroupColor(act.group) + '22'" [style.color]="getGroupColor(act.group)">{{ getGroupLabel(act.group) }}</span></td>
                    <td class="text-right">{{ act.totalQuantity }} {{ act.quantityUnit }}</td>
                    <td class="text-center">{{ act.crewCount }}</td>
                    <td class="text-center">{{ act.durationMonths }} meses</td>
                    <td class="text-center font-mono">M{{ act.startMonth }}..M{{ act.endMonth }}</td>
                    <td class="text-right">{{ act.monthlyProduction }}</td>
                    <td class="text-right">{{ formatCurrency(act.mobilizationCost) }}</td>
                    <td class="text-right">{{ formatCurrency(act.monthlyRecurringCost) }}</td>
                    <td class="text-right">{{ formatCurrency(act.demobilizationCost) }}</td>
                    <td class="text-right font-bold">{{ formatCurrency(act.totalCost) }}</td>
                    <td>
                      @if (act.status === 'PLANNED') {
                        <span class="badge badge-success">OK</span>
                      } @else if (act.status === 'WARNING_OVERPRODUCTION') {
                        <span class="badge badge-warning" [title]="act.statusNotes?.join('; ')">Sobreprodução</span>
                      } @else {
                        <span class="badge badge-danger" [title]="act.statusNotes?.join('; ')">Inconsistente</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .schedule-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: #ffffff;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .subtitle-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0284c7;
      background: #e0f2fe;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      margin-bottom: 0.5rem;
    }

    .title {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }

    .description {
      margin: 0;
      font-size: 0.875rem;
      color: #64748b;
      max-width: 850px;
      line-height: 1.5;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #0284c7;
      color: #ffffff;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0369a1;
    }

    .kpis-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .kpi-card {
      background: #ffffff;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 0.5rem;
    }

    .kpi-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }

    .kpi-value.highlight {
      color: #0284c7;
    }

    .kpi-value .unit {
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
    }

    .kpi-subtext {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .warnings-banner {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 1rem 1.25rem;
      border-radius: 8px;
    }

    .warning-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: #b45309;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .warnings-list {
      margin: 0;
      padding-left: 1.5rem;
      font-size: 0.8125rem;
      color: #92400e;
      line-height: 1.5;
    }

    .milestones-section, .gantt-section, .table-section {
      background: #ffffff;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .section-title {
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .milestones-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .milestone-chip {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
    }

    .milestone-chip.mandatory {
      border-left: 4px solid #0284c7;
    }

    .milestone-code {
      font-size: 0.875rem;
      font-weight: 800;
      background: #0284c7;
      color: #ffffff;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .milestone-info {
      display: flex;
      flex-direction: column;
    }

    .milestone-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #0f172a;
    }

    .milestone-target {
      font-size: 0.75rem;
      color: #64748b;
    }

    .select-filter {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
    }

    .gantt-wrapper {
      overflow-x: auto;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
    }

    .gantt-table {
      min-width: 900px;
    }

    .gantt-header-row, .gantt-row {
      display: grid;
      grid-template-columns: 280px 100px 80px 100px 1fr;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.8125rem;
    }

    .gantt-header-row {
      background: #f8fafc;
      font-weight: 700;
      color: #475569;
    }

    .gantt-col-meta, .gantt-col-qty, .gantt-col-crews, .gantt-col-prod {
      padding: 0.625rem 0.75rem;
    }

    .gantt-col-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .group-bullet {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .activity-names {
      display: flex;
      flex-direction: column;
    }

    .act-name {
      font-weight: 600;
      color: #0f172a;
    }

    .act-group {
      font-size: 0.6875rem;
      color: #64748b;
    }

    .gantt-timeline-header, .gantt-timeline-track {
      display: grid;
      grid-template-columns: repeat(18, 1fr);
      height: 100%;
      position: relative;
      background: #fafafa;
    }

    .gantt-timeline-track {
      height: 38px;
    }

    .month-cell {
      border-left: 1px dashed #e2e8f0;
      text-align: center;
      padding: 0.5rem 0.25rem;
      font-size: 0.6875rem;
      position: relative;
    }

    .month-cell.milestone-col {
      background: #f0fdf4;
      font-weight: 800;
      color: #16a34a;
    }

    .ms-marker {
      display: block;
      font-size: 0.625rem;
      background: #16a34a;
      color: #ffffff;
      border-radius: 3px;
      padding: 1px 2px;
      margin-top: 2px;
    }

    .gantt-bar {
      position: absolute;
      top: 6px;
      height: 26px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      padding: 0 0.5rem;
      color: #ffffff;
      font-size: 0.6875rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }

    .bar-overproduction {
      border: 2px solid #ef4444;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .data-table th, .data-table td {
      padding: 0.625rem 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table th {
      background: #f8fafc;
      font-weight: 700;
      color: #475569;
      text-align: left;
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }

    .group-tag {
      display: inline-block;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.6875rem;
      font-weight: 700;
    }

    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.6875rem;
      font-weight: 700;
    }

    .badge-success { background: #dcfce7; color: #15803d; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-danger { background: #fee2e2; color: #b91c1c; }

    .loading-panel {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      color: #64748b;
    }

    .spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #e2e8f0;
      border-top-color: #0284c7;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class ScheduleGanttComponent implements OnInit {
  @Input({ required: true }) lineId!: number;

  private readonly scheduleApi = inject(ScheduleApiService);

  loading = signal(true);
  errorMessage = signal<string | null>(null);
  schedule = signal<ScheduleSummary | null>(null);
  selectedGroupFilter = 'ALL';

  ngOnInit(): void {
    if (this.lineId) {
      this.loadSchedule();
    }
  }

  loadSchedule(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.scheduleApi.getLineSchedule(this.lineId).subscribe({
      next: (data) => {
        this.schedule.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message || 'Falha ao carregar o cronograma físico da linha.'
        );
        this.loading.set(false);
      },
    });
  }

  monthIndices(): number[] {
    const dur = this.schedule()?.totalDurationMonths || 18;
    return Array.from({ length: Math.max(18, dur) }, (_, i) => i + 1);
  }

  filteredActivities(): ScheduleActivity[] {
    const list = this.schedule()?.activities || [];
    if (this.selectedGroupFilter === 'ALL') {
      return list;
    }
    return list.filter((a) => a.group === this.selectedGroupFilter);
  }

  getGroupLabel(group: ActivityGroup): string {
    return ACTIVITY_GROUP_LABELS[group] || group;
  }

  getGroupColor(group: ActivityGroup): string {
    return ACTIVITY_GROUP_COLORS[group] || '#64748b';
  }

  isMilestoneMonth(m: number): boolean {
    return (this.schedule()?.milestones || []).some((ms) => ms.targetMonth === m);
  }

  getMilestoneForMonth(m: number): MilestoneContract | undefined {
    return (this.schedule()?.milestones || []).find((ms) => ms.targetMonth === m);
  }

  calculateBarLeft(startMonth: number): number {
    const total = Math.max(18, this.schedule()?.totalDurationMonths || 18);
    const m = Math.max(1, startMonth);
    return ((m - 1) / total) * 100;
  }

  calculateBarWidth(durationMonths: number): number {
    const total = Math.max(18, this.schedule()?.totalDurationMonths || 18);
    const d = Math.max(1, durationMonths);
    return (d / total) * 100;
  }

  formatCurrency(val?: string | number): string {
    if (val === undefined || val === null) return 'R$ 0,00';
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
