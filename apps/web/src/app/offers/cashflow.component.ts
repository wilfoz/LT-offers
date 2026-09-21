import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CashflowSummary } from '@lt-offers/domain';
import { CashflowApiService } from './cashflow-api.service';

@Component({
  selector: 'app-cashflow',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cashflow-container">
      <!-- Header -->
      <div class="header-section">
        <div>
          <div class="subtitle-badge">Fase F5 · Módulo M11 (RF-57..RF-60)</div>
          <h2 class="title">
            Desembolso, Cronograma de Entregas & Fluxo de Caixa
          </h2>
          <p class="description">
            Projeção temporal mês a mês de saídas e faturamento, cronograma de
            suprimentos e identificação da exposição financeira máxima (Matriz DT).
          </p>
        </div>

        <div class="header-actions">
          <div class="scope-toggle">
            <button
              type="button"
              class="toggle-btn"
              [class.active]="viewScope() === 'CONSOLIDATED'"
              (click)="setScope('CONSOLIDATED')"
            >
              Consolidado do Lote
            </button>
            @for (l of lines; track l.id) {
              <button
                type="button"
                class="toggle-btn"
                [class.active]="
                  viewScope() === 'LINE' && selectedLineId() === l.id
                "
                (click)="setLine(l.id)"
              >
                {{ l.name || 'LT ' + l.id }}
              </button>
            }
          </div>

          <button
            type="button"
            class="btn btn-primary"
            [disabled]="loading()"
            (click)="loadCashflow()"
          >
            <span class="icon">🔄</span>
            Recalcular Caixa
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-panel">
          <div class="spinner"></div>
          <span
            >Consolidando curvas temporais de desembolso e faturamento...</span
          >
        </div>
      }

      <!-- Error State -->
      @if (errorMessage()) {
        <div class="error-panel">
          <span>⚠️ {{ errorMessage() }}</span>
        </div>
      }

      @if (!loading() && cashflow(); as cf) {
        <!-- KPIs Principais -->
        <div class="kpis-grid">
          <div class="kpi-card">
            <div class="kpi-label">Desembolso Total (Saídas)</div>
            <div class="kpi-value text-danger">
              {{ formatCurrency(cf.totalOutflow) }}
            </div>
            <div class="kpi-subtext">Materiais, serviços e canteiros</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Faturamento Total (Entradas)</div>
            <div class="kpi-value highlight">
              {{ formatCurrency(cf.totalInflow) }}
            </div>
            <div class="kpi-subtext">Medições e adiantamentos</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Saldo Líquido Acumulado</div>
            <div class="kpi-value highlight-green">
              {{ formatCurrency(cf.finalAccumulatedBalance) }}
            </div>
            <div class="kpi-subtext">Resultado de caixa final</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Exposição Máxima de Caixa</div>
            <div class="kpi-value text-warning">
              -{{ formatCurrency(cf.financialExposure.maxNegativeExposure) }}
            </div>
            <div class="kpi-subtext">
              Ocorre no Mês M{{ cf.financialExposure.peakMonth }} · Giro:
              {{
                formatCurrency(cf.financialExposure.recommendedWorkingCapital)
              }}
            </div>
          </div>
        </div>

        <!-- Visualização Gráfica Temporal (Curvas S e Barras) -->
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">
              Curva Mensal de Desembolso vs Faturamento (RF-57, RF-59)
            </h3>
            <div class="chart-legend">
              <span class="legend-item"
                ><span class="bullet bar-outflow"></span> Desembolso Mensal
                (Saídas)</span
              >
              <span class="legend-item"
                ><span class="bullet bar-inflow"></span> Faturamento Mensal
                (Entradas)</span
              >
              <span class="legend-item"
                ><span class="bullet bar-balance"></span> Saldo de Caixa
                Acumulado</span
              >
            </div>
          </div>

          <div class="visual-bars-container">
            @for (pt of cf.monthlyPoints; track pt.month) {
              <div class="month-col">
                <div class="bars-pair">
                  <div
                    class="bar-item bar-outflow"
                    [style.height.px]="getBarHeight(pt.totalOutflow)"
                    [title]="
                      'Mês ' +
                      pt.month +
                      ' · Desembolso: ' +
                      formatCurrency(pt.totalOutflow)
                    "
                  ></div>
                  <div
                    class="bar-item bar-inflow"
                    [style.height.px]="getBarHeight(pt.totalInflow)"
                    [title]="
                      'Mês ' +
                      pt.month +
                      ' · Faturamento: ' +
                      formatCurrency(pt.totalInflow)
                    "
                  ></div>
                </div>
                <div
                  class="accum-badge"
                  [class.accum-neg]="Number(pt.accumulatedCashflow) < 0"
                >
                  {{ formatShortCurrency(pt.accumulatedCashflow) }}
                </div>
                <div class="month-axis">M{{ pt.month }}</div>
              </div>
            }
          </div>
        </div>

        <!-- Cronograma de Entregas de Suprimentos (RF-58) -->
        @if (
          cf.supplyDeliverySchedule && cf.supplyDeliverySchedule.length > 0
        ) {
          <div class="supplies-card">
            <h3 class="table-title">
              Cronograma de Entregas de Materiais & Ponderação de Commodities
              (RF-58)
            </h3>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Grupo de Material</th>
                    <th class="text-center">Mês de Entrega</th>
                    <th class="text-center">Quantidade / Peso</th>
                    <th class="text-center">% da Carga</th>
                    <th class="text-right">Custo Estimado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (
                    sup of cf.supplyDeliverySchedule;
                    track sup.materialGroup + sup.month
                  ) {
                    <tr>
                      <td class="font-bold">{{ sup.materialGroup }}</td>
                      <td class="text-center font-mono">M{{ sup.month }}</td>
                      <td class="text-center font-mono">
                        {{ sup.tonsOrUnits }}
                      </td>
                      <td class="text-center font-mono font-bold">
                        {{ sup.percentage }}
                      </td>
                      <td class="text-right font-mono">
                        {{ formatCurrency(sup.estimatedCost) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Seletor de Modo de Visualização da Tabela de Caixa -->
        <div class="table-mode-selector">
          <button
            type="button"
            class="mode-btn"
            [class.active]="activeDtView() === 'MATRIX_DT'"
            (click)="activeDtView.set('MATRIX_DT')"
          >
            📊 Matriz Temporal Multi-Mês (Aba DT / M1..M24)
          </button>
          <button
            type="button"
            class="mode-btn"
            [class.active]="activeDtView() === 'CHRONOLOGY'"
            (click)="activeDtView.set('CHRONOLOGY')"
          >
            📋 Detalhamento Cronológico Mês a Mês (Quadro D)
          </button>
        </div>

        <!-- MODO 1: TABELA MATRICIAL MULTI-MÊS (Inspirada na sheet DT) -->
        @if (activeDtView() === 'MATRIX_DT') {
          <div class="table-card dt-matrix-card">
            <div class="table-header">
              <div>
                <h3 class="table-title">
                  Matriz de Distribuição Temporal de Custos e Faturamento (Aba DT)
                </h3>
                <p class="table-subtitle">
                  Visão matricial contínua de fluxo de caixa por disciplina ao longo de {{ cf.totalMonths }} meses.
                </p>
              </div>
              <span class="badge badge-info">Matriz DT (M1..M{{ cf.totalMonths }})</span>
            </div>

            <div class="table-responsive matrix-scroll-container">
              <table class="data-table dt-matrix-table">
                <thead>
                  <tr class="header-level-1">
                    <th class="sticky-col sticky-col-discipline" rowspan="2">DISCIPLINA / RUBRICA FINANCEIRA</th>
                    <th class="sticky-col sticky-col-total text-right" rowspan="2">TOTAL CONSOLIDADO</th>
                    <th [attr.colspan]="cf.monthlyPoints.length" class="group-header group-dark text-center">
                      CRONOGRAMA TEMPORAL MÊS A MÊS (PERÍODO DA OBRA)
                    </th>
                  </tr>
                  <tr class="header-level-2">
                    @for (pt of cf.monthlyPoints; track pt.month) {
                      <th class="text-center font-mono" [class.highlight-peak-header]="pt.month === cf.financialExposure.peakMonth">
                        M{{ pt.month }}
                        @if (pt.month === cf.financialExposure.peakMonth) {
                          <span class="peak-dot" title="Mês de máxima exposição">●</span>
                        }
                      </th>
                    }
                  </tr>
                </thead>
                <tbody>
                  <!-- GRUPO: SAÍDAS DE CAIXA -->
                  <tr class="section-divider-row">
                    <td [attr.colspan]="cf.monthlyPoints.length + 2" class="section-divider-title text-danger">
                      ▼ 1. SAÍDAS DE CAIXA & DESEMBOLSO OPERACIONAL (OUTFLOW)
                    </td>
                  </tr>

                  <!-- Linha: Materiais -->
                  <tr class="matrix-data-row">
                    <td class="sticky-col sticky-col-discipline font-semibold pl-indent">
                      📦 Materiais & Equipamentos Principais (Torres, Cabos, Isoladores)
                    </td>
                    <td class="sticky-col sticky-col-total text-right font-mono font-bold">
                      {{ formatCurrency(getTotalMaterialsOutflow(cf)) }}
                    </td>
                    @for (pt of cf.monthlyPoints; track pt.month) {
                      <td class="text-right font-mono text-muted">
                        {{ formatCurrency(pt.materialsOutflow) }}
                      </td>
                    }
                  </tr>

                  <!-- Linha: Serviços Diretos -->
                  <tr class="matrix-data-row">
                    <td class="sticky-col sticky-col-discipline font-semibold pl-indent">
                      🔨 Serviços Diretos de Construção & Montagem (Civil, Eletromecânica)
                    </td>
                    <td class="sticky-col sticky-col-total text-right font-mono font-bold">
                      {{ formatCurrency(getTotalServicesOutflow(cf)) }}
                    </td>
                    @for (pt of cf.monthlyPoints; track pt.month) {
                      <td class="text-right font-mono text-muted">
                        {{ formatCurrency(pt.servicesOutflow) }}
                      </td>
                    }
                  </tr>

                  <!-- Linha: Indiretos -->
                  <tr class="matrix-data-row">
                    <td class="sticky-col sticky-col-discipline font-semibold pl-indent">
                      ⛺ Custos Indiretos de Obra & Apoio Operacional (Canteiros, Equipe)
                    </td>
                    <td class="sticky-col sticky-col-total text-right font-mono font-bold">
                      {{ formatCurrency(getTotalIndirectsOutflow(cf)) }}
                    </td>
                    @for (pt of cf.monthlyPoints; track pt.month) {
                      <td class="text-right font-mono text-muted">
                        {{ formatCurrency(pt.indirectsOutflow) }}
                      </td>
                    }
                  </tr>

                  <!-- Subtotal: Total Saídas Mensais -->
                  <tr class="subtotal-row subtotal-danger">
                    <td class="sticky-col sticky-col-discipline font-bold">
                      🔴 TOTAL DESEMBOLSO MENSAL (SAÍDAS)
                    </td>
                    <td class="sticky-col sticky-col-total text-right font-mono font-bold text-danger">
                      {{ formatCurrency(cf.totalOutflow) }}
                    </td>
                    @for (pt of cf.monthlyPoints; track pt.month) {
                      <td class="text-right font-mono font-bold text-danger">
                        {{ formatCurrency(pt.totalOutflow) }}
                      </td>
                    }
                  </tr>

                  <!-- Desembolso Acumulado -->
                  <tr class="accumulated-row">
                    <td class="sticky-col sticky-col-discipline text-xs text-muted">
                      ↳ Desembolso Acumulado
                    </td>
                    <td class="sticky-col sticky-col-total text-right font-mono text-xs text-muted">
                      {{ formatCurrency(cf.totalOutflow) }}
                    </td>
                    @for (pt of cf.monthlyPoints; track pt.month) {
                      <td class="text-right font-mono text-xs text-muted">
                        {{ formatCurrency(pt.accumulatedOutflow) }}
                      </td>
                    }
                  </tr>

                  <!-- GRUPO: ENTRADAS DE CAIXA -->
                  <tr class="section-divider-row">
                    <td [attr.colspan]="cf.monthlyPoints.length + 2" class="section-divider-title text-sky">
                      ▼ 2. ENTRADAS DE CAIXA & FATURAMENTO CONTRATUAL (INFLOW)
                    </td>
                  </tr>

                  <!-- Linha: Adiantamento -->
                  <tr class="matrix-data-row">
                    <td class="sticky-col sticky-col-discipline font-semibold pl-indent">
                      💵 Adiantamento Contratual (Mobilização Inicial)
                    </td>
                    <td class="sticky-col sticky-col-total text-right font-mono font-bold">
                      {{ formatCurrency(getTotalAdvanceBilling(cf)) }}
                    </td>
                    @for (pt of cf.monthlyPoints; track pt.month) {
                      <td class="text-right font-mono text-muted">
                        {{ formatCurrency(pt.advanceBilling) }}
                      </td>
                    }
                  </tr>

                  <!-- Linha: Medições -->
                  <tr class="matrix-data-row">
                    <td class="sticky-col sticky-col-discipline font-semibold pl-indent">
                      📋 Medições Mensais de Campo (Produção & Suprimentos)
                    </td>
                    <td class="sticky-col sticky-col-total text-right font-mono font-bold">
                      {{ formatCurrency(getTotalMeasurementBilling(cf)) }}
                    </td>
                    @for (pt of cf.monthlyPoints; track pt.month) {
                      <td class="text-right font-mono text-muted">
                        {{ formatCurrency(pt.measurementBilling) }}
                      </td>
                    }
                  </tr>

                  <!-- Subtotal: Total Entradas Mensais -->
                  <tr class="subtotal-row subtotal-sky">
                    <td class="sticky-col sticky-col-discipline font-bold">
                      🔵 TOTAL FATURAMENTO MENSAL (ENTRADAS)
                    </td>
                    <td class="sticky-col sticky-col-total text-right font-mono font-bold highlight-text">
                      {{ formatCurrency(cf.totalInflow) }}
                    </td>
                    @for (pt of cf.monthlyPoints; track pt.month) {
                      <td class="text-right font-mono font-bold highlight-text">
                        {{ formatCurrency(pt.totalInflow) }}
                      </td>
                    }
                  </tr>

                  <!-- Faturamento Acumulado -->
                  <tr class="accumulated-row">
                    <td class="sticky-col sticky-col-discipline text-xs text-muted">
                      ↳ Faturamento Acumulado
                    </td>
                    <td class="sticky-col sticky-col-total text-right font-mono text-xs text-muted">
                      {{ formatCurrency(cf.totalInflow) }}
                    </td>
                    @for (pt of cf.monthlyPoints; track pt.month) {
                      <td class="text-right font-mono text-xs text-muted">
                        {{ formatCurrency(pt.accumulatedInflow) }}
                      </td>
                    }
                  </tr>

                  <!-- GRUPO: SALDO LÍQUIDO & FLUXO ACUMULADO -->
                  <tr class="section-divider-row">
                    <td [attr.colspan]="cf.monthlyPoints.length + 2" class="section-divider-title text-emerald">
                      ▼ 3. BALANÇO FINANCEIRO & POSIÇÃO LÍQUIDA DE CAIXA (NET FLOW)
                    </td>
                  </tr>

                  <!-- Saldo Líquido do Mês -->
                  <tr class="matrix-data-row net-month-row">
                    <td class="sticky-col sticky-col-discipline font-bold">
                      ⚡ Saldo Líquido do Mês (Entradas - Saídas)
                    </td>
                    <td class="sticky-col sticky-col-total text-right font-mono font-bold"
                        [ngClass]="{
                          'text-danger': Number(cf.finalAccumulatedBalance) < 0,
                          'highlight-green': Number(cf.finalAccumulatedBalance) >= 0
                        }">
                      {{ formatCurrency(cf.finalAccumulatedBalance) }}
                    </td>
                    @for (pt of cf.monthlyPoints; track pt.month) {
                      <td class="text-right font-mono font-bold"
                          [ngClass]="{
                            'text-danger': Number(pt.netMonthlyCashflow) < 0,
                            'highlight-green': Number(pt.netMonthlyCashflow) >= 0
                          }">
                        {{ formatCurrency(pt.netMonthlyCashflow) }}
                      </td>
                    }
                  </tr>

                  <!-- Saldo de Caixa Acumulado -->
                  <tr class="total-row net-accum-row">
                    <td class="sticky-col sticky-col-discipline font-bold">
                      📈 FLUXO DE CAIXA ACUMULADO
                    </td>
                    <td class="sticky-col sticky-col-total text-right font-mono font-bold highlight-green font-lg">
                      {{ formatCurrency(cf.finalAccumulatedBalance) }}
                    </td>
                    @for (pt of cf.monthlyPoints; track pt.month) {
                      <td class="text-right font-mono font-bold"
                          [class.highlight-peak-cell]="pt.month === cf.financialExposure.peakMonth"
                          [ngClass]="{
                            'text-danger': Number(pt.accumulatedCashflow) < 0,
                            'highlight-green': Number(pt.accumulatedCashflow) >= 0
                          }">
                        {{ formatCurrency(pt.accumulatedCashflow) }}
                      </td>
                    }
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- MODO 2: DETALHAMENTO CRONOLÓGICO MÊS A MÊS (Quadro D) -->
        @if (activeDtView() === 'CHRONOLOGY') {
          <div class="table-card">
            <div class="table-header">
              <h3 class="table-title">
                Detalhamento Cronológico de Fluxo de Caixa (Quadro D)
              </h3>
              <span class="badge badge-info"
                >{{ cf.totalMonths }} Meses Projetados</span
              >
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th class="text-center">Mês</th>
                    <th class="text-right">Materiais</th>
                    <th class="text-right">Serviços</th>
                    <th class="text-right">Indiretos</th>
                    <th class="text-right font-bold">Total Saídas</th>
                    <th class="text-right text-muted">Saídas Acum.</th>
                    <th class="text-right">Adiantamento</th>
                    <th class="text-right">Medição</th>
                    <th class="text-right font-bold">Total Entradas</th>
                    <th class="text-right text-muted">Entradas Acum.</th>
                    <th class="text-right font-bold">Saldo Mês</th>
                    <th class="text-right font-bold">Saldo Acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (pt of cf.monthlyPoints; track pt.month) {
                    <tr
                      [class.highlight-peak]="
                        pt.month === cf.financialExposure.peakMonth
                      "
                    >
                      <td class="text-center font-mono font-bold">
                        M{{ pt.month }}
                        @if (pt.month === cf.financialExposure.peakMonth) {
                          <span
                            class="peak-tag"
                            title="Mês de máxima exposição de caixa"
                            >PICO</span
                          >
                        }
                      </td>
                      <td class="text-right font-mono">
                        {{ formatCurrency(pt.materialsOutflow) }}
                      </td>
                      <td class="text-right font-mono">
                        {{ formatCurrency(pt.servicesOutflow) }}
                      </td>
                      <td class="text-right font-mono">
                        {{ formatCurrency(pt.indirectsOutflow) }}
                      </td>
                      <td class="text-right font-mono font-bold text-danger">
                        {{ formatCurrency(pt.totalOutflow) }}
                      </td>
                      <td class="text-right font-mono text-muted">
                        {{ formatCurrency(pt.accumulatedOutflow) }}
                      </td>
                      <td class="text-right font-mono">
                        {{ formatCurrency(pt.advanceBilling) }}
                      </td>
                      <td class="text-right font-mono">
                        {{ formatCurrency(pt.measurementBilling) }}
                      </td>
                      <td class="text-right font-mono font-bold highlight-text">
                        {{ formatCurrency(pt.totalInflow) }}
                      </td>
                      <td class="text-right font-mono text-muted">
                        {{ formatCurrency(pt.accumulatedInflow) }}
                      </td>
                      <td
                        class="text-right font-mono font-bold"
                        [ngClass]="{
                          'text-danger': Number(pt.netMonthlyCashflow) < 0,
                          'highlight-green': Number(pt.netMonthlyCashflow) > 0,
                        }"
                      >
                        {{ formatCurrency(pt.netMonthlyCashflow) }}
                      </td>
                      <td
                        class="text-right font-mono font-bold"
                        [ngClass]="{
                          'text-danger': Number(pt.accumulatedCashflow) < 0,
                          'highlight-green': Number(pt.accumulatedCashflow) >= 0,
                        }"
                      >
                        {{ formatCurrency(pt.accumulatedCashflow) }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .cashflow-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.5rem;
        background: #f8fafc;
        font-family:
          -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .header-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .subtitle-badge {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 700;
        color: #0284c7;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
      }
      .title {
        font-size: 1.5rem;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 0.25rem 0;
      }
      .description {
        font-size: 0.875rem;
        color: #64748b;
        margin: 0;
        max-width: 600px;
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .scope-toggle {
        display: flex;
        background: #e2e8f0;
        padding: 0.25rem;
        border-radius: 6px;
        gap: 0.25rem;
      }
      .toggle-btn {
        padding: 0.35rem 0.75rem;
        border: none;
        background: transparent;
        font-size: 0.8rem;
        font-weight: 600;
        color: #475569;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }
      .toggle-btn.active {
        background: #ffffff;
        color: #0f172a;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        border-radius: 6px;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
      }
      .btn-primary {
        background: #0284c7;
        color: #ffffff;
      }
      .btn-primary:hover:not(:disabled) {
        background: #0369a1;
      }
      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .loading-panel,
      .error-panel {
        padding: 1.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 0.95rem;
      }
      .loading-panel {
        background: #e0f2fe;
        color: #0369a1;
      }
      .error-panel {
        background: #fee2e2;
        color: #991b1b;
      }
      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #0284c7;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .kpis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }
      .kpi-card {
        background: #ffffff;
        padding: 1.25rem;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      .kpi-label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748b;
        margin-bottom: 0.5rem;
      }
      .kpi-value {
        font-size: 1.35rem;
        font-weight: 800;
        color: #0f172a;
      }
      .kpi-value.highlight {
        color: #0284c7;
      }
      .kpi-value.highlight-green {
        color: #16a34a;
      }
      .kpi-subtext {
        font-size: 0.75rem;
        color: #94a3b8;
        margin-top: 0.25rem;
      }
      .chart-card {
        background: #ffffff;
        padding: 1.25rem;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .chart-title {
        font-size: 1rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }
      .chart-legend {
        display: flex;
        gap: 1rem;
        font-size: 0.8rem;
        color: #475569;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }
      .bullet {
        width: 10px;
        height: 10px;
        border-radius: 2px;
      }
      .bar-outflow {
        background: #ef4444;
      }
      .bar-inflow {
        background: #0284c7;
      }
      .bar-balance {
        background: #16a34a;
      }
      .visual-bars-container {
        display: flex;
        gap: 0.75rem;
        align-items: flex-end;
        min-height: 180px;
        padding-bottom: 1rem;
        overflow-x: auto;
        border-bottom: 1px solid #e2e8f0;
      }
      .month-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.35rem;
        min-width: 48px;
      }
      .bars-pair {
        display: flex;
        gap: 3px;
        align-items: flex-end;
        height: 120px;
      }
      .bar-item {
        width: 14px;
        border-radius: 2px 2px 0 0;
        transition: height 0.3s ease;
        min-height: 2px;
      }
      .accum-badge {
        font-size: 0.65rem;
        font-weight: 700;
        color: #16a34a;
        background: #dcfce7;
        padding: 0.1rem 0.3rem;
        border-radius: 4px;
        white-space: nowrap;
      }
      .accum-badge.accum-neg {
        color: #dc2626;
        background: #fee2e2;
      }
      .month-axis {
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
      }

      /* Tab mode selector */
      .table-mode-selector {
        display: flex;
        gap: 0.5rem;
        border-bottom: 2px solid #e2e8f0;
        padding-bottom: 0.5rem;
      }
      .mode-btn {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #475569;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .mode-btn:hover {
        background: #f1f5f9;
      }
      .mode-btn.active {
        background: #0284c7;
        color: #ffffff;
        border-color: #0284c7;
      }

      .supplies-card,
      .table-card {
        background: #ffffff;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid #e2e8f0;
      }
      .table-title {
        font-size: 1rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0;
      }
      .table-subtitle {
        font-size: 0.8rem;
        color: #64748b;
        margin: 0.25rem 0 0 0;
      }
      .table-responsive {
        overflow-x: auto;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.825rem;
      }
      .data-table th {
        background: #f8fafc;
        padding: 0.75rem 0.85rem;
        text-align: left;
        font-weight: 600;
        color: #475569;
        border-bottom: 1px solid #e2e8f0;
        white-space: nowrap;
      }
      .data-table td {
        padding: 0.65rem 0.85rem;
        border-bottom: 1px solid #f1f5f9;
        color: #1e293b;
        white-space: nowrap;
      }

      /* DT Matrix Styles */
      .dt-matrix-table .header-level-1 th {
        border-bottom: 1px solid #cbd5e1;
        font-weight: 700;
        font-size: 0.75rem;
        letter-spacing: 0.04em;
      }
      .dt-matrix-table .group-dark {
        background: #334155;
        color: #ffffff;
      }
      .dt-matrix-table .header-level-2 th {
        background: #f1f5f9;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.5rem 0.65rem;
      }
      .sticky-col {
        position: sticky;
        background: #ffffff;
        z-index: 2;
      }
      .header-level-1 .sticky-col,
      .header-level-2 .sticky-col {
        background: #f8fafc;
        z-index: 3;
      }
      .sticky-col-discipline {
        left: 0;
        min-width: 280px;
        max-width: 320px;
        border-right: 1px solid #e2e8f0;
      }
      .sticky-col-total {
        left: 320px;
        min-width: 130px;
        border-right: 2px solid #cbd5e1;
        background: #f8fafc;
      }
      .pl-indent {
        padding-left: 1.5rem !important;
      }
      .section-divider-row td {
        background: #f1f5f9;
        padding: 0.5rem 0.85rem;
        font-weight: 800;
        font-size: 0.8rem;
        border-top: 1px solid #cbd5e1;
        border-bottom: 1px solid #cbd5e1;
      }
      .section-divider-title.text-danger {
        color: #991b1b;
      }
      .section-divider-title.text-sky {
        color: #0369a1;
      }
      .section-divider-title.text-emerald {
        color: #065f46;
      }
      .subtotal-row td {
        font-weight: 700;
        background: #f8fafc;
        border-top: 1px solid #cbd5e1;
        border-bottom: 1px solid #cbd5e1;
      }
      .subtotal-danger td {
        background: #fef2f2;
      }
      .subtotal-sky td {
        background: #f0f9ff;
      }
      .accumulated-row td {
        background: #fafafa;
        border-bottom: 1px dashed #e2e8f0;
      }
      .net-month-row td {
        background: #fcfcfc;
      }
      .net-accum-row td {
        background: #ecfdf5 !important;
        border-top: 2px solid #059669 !important;
        border-bottom: 2px solid #059669 !important;
      }
      .highlight-peak-header {
        background: #fef3c7 !important;
        color: #92400e !important;
      }
      .peak-dot {
        color: #d97706;
        font-size: 0.65rem;
        margin-left: 2px;
      }
      .highlight-peak-cell {
        background: #fef3c7 !important;
        font-weight: 800 !important;
      }

      .highlight-peak td {
        background: #fffbeb !important;
      }
      .peak-tag {
        display: inline-block;
        font-size: 0.65rem;
        font-weight: 700;
        background: #f59e0b;
        color: #ffffff;
        padding: 0.1rem 0.35rem;
        border-radius: 4px;
        margin-left: 0.25rem;
      }
      .text-right {
        text-align: right;
      }
      .text-center {
        text-align: center;
      }
      .font-mono {
        font-family: ui-monospace, SFMono-Regular, monospace;
      }
      .font-bold {
        font-weight: 700;
      }
      .font-semibold {
        font-weight: 600;
      }
      .font-lg {
        font-size: 0.95rem;
      }
      .text-danger {
        color: #dc2626;
      }
      .text-warning {
        color: #d97706;
      }
      .text-muted {
        color: #94a3b8;
      }
      .highlight-text {
        color: #0284c7;
      }
      .highlight-green {
        color: #16a34a;
      }
      .badge {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      .badge-info {
        background: #e0f2fe;
        color: #0369a1;
      }
    `,
  ],
})
export class CashflowComponent implements OnInit {
  @Input() offerId!: number;
  @Input() lines: Array<{ id: number; name?: string }> = [];

  private readonly api = inject(CashflowApiService);

  viewScope = signal<'CONSOLIDATED' | 'LINE'>('CONSOLIDATED');
  selectedLineId = signal<number>(1);
  cashflow = signal<CashflowSummary | null>(null);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  activeDtView = signal<'MATRIX_DT' | 'CHRONOLOGY'>('MATRIX_DT');

  ngOnInit(): void {
    if (this.lines && this.lines.length > 0) {
      this.selectedLineId.set(this.lines[0].id);
    }
    this.loadCashflow();
  }

  setScope(scope: 'CONSOLIDATED' | 'LINE'): void {
    this.viewScope.set(scope);
    this.loadCashflow();
  }

  setLine(lineId: number): void {
    this.viewScope.set('LINE');
    this.selectedLineId.set(lineId);
    this.loadCashflow();
  }

  loadCashflow(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const req$ =
      this.viewScope() === 'CONSOLIDATED'
        ? this.api.getConsolidatedCashflow(this.offerId)
        : this.api.getLineCashflow(this.selectedLineId());

    req$.subscribe({
      next: (data) => {
        this.cashflow.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          'Erro ao carregar as curvas de desembolso e fluxo de caixa.',
        );
        this.loading.set(false);
      },
    });
  }

  getTotalMaterialsOutflow(cf: CashflowSummary): number {
    return (cf.monthlyPoints || []).reduce(
      (acc, pt) => acc + Number(pt.materialsOutflow || 0),
      0,
    );
  }

  getTotalServicesOutflow(cf: CashflowSummary): number {
    return (cf.monthlyPoints || []).reduce(
      (acc, pt) => acc + Number(pt.servicesOutflow || 0),
      0,
    );
  }

  getTotalIndirectsOutflow(cf: CashflowSummary): number {
    return (cf.monthlyPoints || []).reduce(
      (acc, pt) => acc + Number(pt.indirectsOutflow || 0),
      0,
    );
  }

  getTotalAdvanceBilling(cf: CashflowSummary): number {
    return (cf.monthlyPoints || []).reduce(
      (acc, pt) => acc + Number(pt.advanceBilling || 0),
      0,
    );
  }

  getTotalMeasurementBilling(cf: CashflowSummary): number {
    return (cf.monthlyPoints || []).reduce(
      (acc, pt) => acc + Number(pt.measurementBilling || 0),
      0,
    );
  }

  getBarHeight(valStr?: string): number {
    if (!valStr) return 2;
    const val = Number(valStr);
    const maxVal = 5000000; // Normalizador de escala visual
    const height = Math.min(110, Math.max(4, Math.round((val / maxVal) * 100)));
    return height;
  }

  formatCurrency(value?: string | number): string {
    if (value === undefined || value === null) return 'R$ 0,00';
    const num = Number(value);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatShortCurrency(value?: string | number): string {
    if (value === undefined || value === null) return 'R$ 0';
    const num = Number(value);
    const absNum = Math.abs(num);
    const prefix = num < 0 ? '-' : '+';
    if (absNum >= 1000000) {
      return `${prefix}${(absNum / 1000000).toFixed(1)}M`;
    }
    if (absNum >= 1000) {
      return `${prefix}${(absNum / 1000).toFixed(0)}k`;
    }
    return `${prefix}${absNum.toFixed(0)}`;
  }

  Number(val: string): number {
    return Number(val);
  }
}
