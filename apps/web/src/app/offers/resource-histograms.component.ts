import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ResourceHistogramSummary,
} from '@lt-offers/domain';
import { HistogramApiService } from './histogram-api.service';

@Component({
  selector: 'app-resource-histograms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="histogram-container">
      <!-- Header -->
      <div class="header-section">
        <div>
          <div class="subtitle-badge">Fase F4 · Módulo M08</div>
          <h2 class="title">Histograma de Recursos e Curvas de Alocação</h2>
          <p class="description">
            Projeção mensal de efetivo de mão de obra por função (diretos de campo vs indiretos de canteiro), identificação de picos de mobilização (RF-43) e balanço de equipamentos próprios vs déficit a locar (RN-17, RF-44).
          </p>
        </div>

        <div class="header-actions">
          <div class="view-toggle">
            <button
              type="button"
              class="toggle-btn"
              [class.active]="activeTab() === 'MANPOWER'"
              (click)="activeTab.set('MANPOWER')"
            >
              👷 Mão de Obra (Pessoal)
            </button>
            <button
              type="button"
              class="toggle-btn"
              [class.active]="activeTab() === 'EQUIPMENT'"
              (click)="activeTab.set('EQUIPMENT')"
            >
              🚜 Equipamentos & Frota
            </button>
          </div>

          <button
            type="button"
            class="btn btn-primary"
            [disabled]="loading()"
            (click)="loadHistogram()"
          >
            <span class="icon">🔄</span>
            Recalcular Histograma
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-panel">
          <div class="spinner"></div>
          <span>Consolidando curvas de histograma de recursos...</span>
        </div>
      }

      <!-- Error State -->
      @if (errorMessage()) {
        <div class="error-panel">
          <span>⚠️ {{ errorMessage() }}</span>
        </div>
      }

      @if (!loading() && histogram(); as data) {
        <!-- KPIs Mão de Obra -->
        @if (activeTab() === 'MANPOWER') {
          <div class="kpis-grid">
            <div class="kpi-card">
              <div class="kpi-label">Pico de Efetivo Total</div>
              <div class="kpi-value highlight">{{ data.peakManpower.total }} <span class="unit">colaboradores</span></div>
              <div class="kpi-subtext">Ocorre no Mês M{{ data.peakManpower.month }}</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">Esforço Total</div>
              <div class="kpi-value">{{ data.totalManMonths }} <span class="unit">homem-mês</span></div>
              <div class="kpi-subtext">Direto: {{ data.totalDirectManMonths }} · Indireto: {{ data.totalIndirectManMonths }}</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">Atividades Causadoras do Pico</div>
              <div class="kpi-value-list">
                @for (act of data.peakManpower.drivingActivities; track act) {
                  <span class="driving-tag">{{ act }}</span>
                }
              </div>
            </div>
          </div>
        }

        <!-- KPIs Equipamentos -->
        @if (activeTab() === 'EQUIPMENT') {
          <div class="kpis-grid">
            <div class="kpi-card">
              <div class="kpi-label">Pico de Máquinas Simultâneas</div>
              <div class="kpi-value highlight">{{ data.peakEquipment.total }} <span class="unit">equipamentos</span></div>
              <div class="kpi-subtext">Próprios: {{ data.peakEquipment.own }} · Locados: {{ data.peakEquipment.rented }}</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">Custo Estimado de Locação</div>
              <div class="kpi-value">{{ formatCurrency(data.totalEquipmentRentalCost) }}</div>
              <div class="kpi-subtext">Déficit comercial atendido por terceiros</div>
            </div>

            <div class="kpi-card">
              <div class="kpi-label">Balanço de Frota Própria</div>
              <div class="kpi-value highlight-green">{{ totalOwnEquipments() }} <span class="unit">unidades próprias</span></div>
              <div class="kpi-subtext">Alocadas prioritariamente (RN-17)</div>
            </div>
          </div>
        }

        <!-- Gráfico Visual de Histograma -->
        <div class="chart-section">
          <div class="section-header">
            <h3 class="section-title">
              {{ activeTab() === 'MANPOWER' ? 'Curva Mensal de Mão de Obra (Efetivo Direto vs Indireto)' : 'Curva Mensal de Equipamentos (Frota Própria vs Locação)' }}
            </h3>
          </div>

          <div class="visual-bars-container">
            @for (point of data.monthlyTimeline; track point.month) {
              <div class="month-bar-col">
                <div class="bar-stack">
                  @if (activeTab() === 'MANPOWER') {
                    <div
                      class="bar-segment bar-indirect"
                      [style.height.px]="point.indirectManpower * 3"
                      [title]="'Mês ' + point.month + ' · Indireto: ' + point.indirectManpower"
                    ></div>
                    <div
                      class="bar-segment bar-direct"
                      [style.height.px]="point.directManpower * 3"
                      [title]="'Mês ' + point.month + ' · Direto: ' + point.directManpower"
                    ></div>
                  } @else {
                    <div
                      class="bar-segment bar-rented"
                      [style.height.px]="point.rentedEquipment * 12"
                      [title]="'Mês ' + point.month + ' · Locado: ' + point.rentedEquipment"
                    ></div>
                    <div
                      class="bar-segment bar-own"
                      [style.height.px]="point.ownEquipment * 12"
                      [title]="'Mês ' + point.month + ' · Próprio: ' + point.ownEquipment"
                    ></div>
                  }
                </div>
                <div class="month-total-label">
                  {{ activeTab() === 'MANPOWER' ? point.totalManpower : point.totalEquipment }}
                </div>
                <div class="month-axis-label">M{{ point.month }}</div>
              </div>
            }
          </div>

          <div class="legend-row">
            @if (activeTab() === 'MANPOWER') {
              <div class="legend-item"><span class="bullet bar-direct"></span> Mão de Obra Direta (Campo)</div>
              <div class="legend-item"><span class="bullet bar-indirect"></span> Mão de Obra Indireta (Canteiro/Gestão)</div>
            } @else {
              <div class="legend-item"><span class="bullet bar-own"></span> Frota Própria Disponível</div>
              <div class="legend-item"><span class="bullet bar-rented"></span> Déficit de Locação Comercial</div>
            }
          </div>
        </div>

        <!-- Tabela Analítica -->
        <div class="table-section">
          <h3 class="section-title">
            {{ activeTab() === 'MANPOWER' ? 'Detalhamento por Função / Cargo' : 'Detalhamento por Tipo de Equipamento' }}
          </h3>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>{{ activeTab() === 'MANPOWER' ? 'Cargo / Função' : 'Equipamento / Máquina' }}</th>
                  <th>Tipo</th>
                  <th>Pico</th>
                  <th>Mês Pico</th>
                  @for (m of monthIndices(); track m) {
                    <th class="text-center">M{{ m }}</th>
                  }
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                @if (activeTab() === 'MANPOWER') {
                  @for (item of data.manpowerItems; track item.laborRoleId) {
                    <tr>
                      <td class="font-mono">{{ item.laborRoleCode }}</td>
                      <td class="font-bold">{{ item.laborRoleName }}</td>
                      <td><span class="badge" [class.badge-primary]="item.isDirect" [class.badge-neutral]="!item.isDirect">{{ item.isDirect ? 'Direto' : 'Indireto' }}</span></td>
                      <td class="text-center font-bold">{{ item.peakHeadcount }}</td>
                      <td class="text-center font-mono">M{{ item.peakMonth }}</td>
                      @for (pt of item.monthlyHeadcount; track pt.month) {
                        <td class="text-center" [class.cell-zero]="pt.count === 0">{{ pt.count || '-' }}</td>
                      }
                      <td class="text-right font-bold">{{ item.totalManMonths }} MM</td>
                    </tr>
                  }
                } @else {
                  @for (eq of data.equipmentItems; track eq.equipmentId) {
                    <tr>
                      <td class="font-mono">{{ eq.equipmentCode }}</td>
                      <td class="font-bold">{{ eq.equipmentDescription }}</td>
                      <td>Próprios: <strong>{{ eq.ownUnitsAvailable }}</strong></td>
                      <td class="text-center font-bold">{{ eq.peakDemand }}</td>
                      <td class="text-center font-mono">M{{ eq.peakMonth }}</td>
                      @for (pt of eq.monthlyDemand; track pt.month) {
                        <td class="text-center" [class.cell-deficit]="pt.deficitToRent > 0">
                          {{ pt.totalRequired || '-' }}
                          @if (pt.deficitToRent > 0) {
                            <span class="sub-deficit" title="Déficit para locação">(+{{ pt.deficitToRent }})</span>
                          }
                        </td>
                      }
                      <td class="text-right font-bold">{{ formatCurrency(eq.totalRentalCost) }}</td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .histogram-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: #ffffff;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .subtitle-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #7c3aed;
      background: #f5f3ff;
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

    .header-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.75rem;
    }

    .view-toggle {
      display: flex;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 4px;
      gap: 4px;
    }

    .toggle-btn {
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      font-weight: 600;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      color: #475569;
      transition: all 0.2s;
    }

    .toggle-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .btn-primary {
      background: #0284c7;
      color: #ffffff;
      padding: 0.625rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 8px;
      border: none;
      cursor: pointer;
    }

    .kpis-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }

    .kpi-card {
      background: #ffffff;
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .kpi-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 0.5rem;
    }

    .kpi-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }

    .kpi-value.highlight { color: #7c3aed; }
    .kpi-value.highlight-green { color: #16a34a; }
    .kpi-value .unit { font-size: 0.875rem; font-weight: 500; color: #64748b; }
    .kpi-subtext { font-size: 0.75rem; color: #94a3b8; }

    .kpi-value-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .driving-tag {
      font-size: 0.6875rem;
      background: #f5f3ff;
      color: #6d28d9;
      border: 1px solid #ddd6fe;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
    }

    .chart-section, .table-section {
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

    .visual-bars-container {
      display: flex;
      align-items: flex-end;
      gap: 0.75rem;
      height: 220px;
      padding: 1rem 0;
      border-bottom: 2px solid #e2e8f0;
      overflow-x: auto;
    }

    .month-bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      min-width: 40px;
    }

    .bar-stack {
      display: flex;
      flex-direction: column-reverse;
      width: 24px;
      border-radius: 4px 4px 0 0;
      overflow: hidden;
    }

    .bar-segment {
      width: 100%;
      transition: height 0.3s ease;
    }

    .bar-direct { background: #3b82f6; }
    .bar-indirect { background: #93c5fd; }
    .bar-own { background: #10b981; }
    .bar-rented { background: #f59e0b; }

    .month-total-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: #0f172a;
      margin-top: 0.5rem;
    }

    .month-axis-label {
      font-size: 0.6875rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .legend-row {
      display: flex;
      gap: 1.5rem;
      margin-top: 1rem;
      font-size: 0.8125rem;
      color: #475569;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .bullet {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
    .data-table th, .data-table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #e2e8f0; }
    .data-table th { background: #f8fafc; font-weight: 700; color: #475569; text-align: left; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .cell-zero { color: #cbd5e1; }
    .cell-deficit { color: #b45309; font-weight: 700; }
    .sub-deficit { font-size: 0.6875rem; color: #d97706; display: block; }
    .badge { padding: 0.2rem 0.4rem; border-radius: 4px; font-size: 0.6875rem; font-weight: 700; }
    .badge-primary { background: #dbeafe; color: #1e40af; }
    .badge-neutral { background: #f1f5f9; color: #475569; }
  `],
})
export class ResourceHistogramsComponent implements OnInit {
  @Input({ required: true }) lineId!: number;

  private readonly histogramApi = inject(HistogramApiService);

  loading = signal(true);
  errorMessage = signal<string | null>(null);
  histogram = signal<ResourceHistogramSummary | null>(null);
  activeTab = signal<'MANPOWER' | 'EQUIPMENT'>('MANPOWER');

  totalOwnEquipments = computed(() => {
    const list = this.histogram()?.equipmentItems || [];
    return list.reduce((acc, curr) => acc + (curr.ownUnitsAvailable || 0), 0);
  });

  ngOnInit(): void {
    if (this.lineId) {
      this.loadHistogram();
    }
  }

  loadHistogram(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.histogramApi.getLineHistogram(this.lineId).subscribe({
      next: (data) => {
        this.histogram.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message || 'Falha ao carregar o histograma de recursos.'
        );
        this.loading.set(false);
      },
    });
  }

  monthIndices(): number[] {
    const dur = this.histogram()?.totalMonths || 18;
    return Array.from({ length: dur }, (_, i) => i + 1);
  }

  formatCurrency(val?: string | number): string {
    if (val === undefined || val === null) return 'R$ 0,00';
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
