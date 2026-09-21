import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  EconomicResultSummary,
  SaleCoefficients,
  MarginSimulationOutput,
} from '@lt-offers/domain';
import { EconomicResultApiService } from './economic-result-api.service';

@Component({
  selector: 'app-economic-result',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="result-container">
      <!-- Header -->
      <div class="header-section">
        <div>
          <div class="subtitle-badge">Fase F5 · Módulo M10 (RF-51..RF-56)</div>
          <h2 class="title">Resultado Econômico, BDI & Formação de Preço</h2>
          <p class="description">
            Quadro R consolidado, decomposição tributária completa,
            parametrização de coeficientes K e simulador de margem comercial.
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
            (click)="loadResult()"
          >
            <span class="icon">🔄</span>
            Recalcular
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-panel">
          <div class="spinner"></div>
          <span
            >Calculando Quadro R, multiplicadores de BDI e decomposição
            tributária...</span
          >
        </div>
      }

      <!-- Error State -->
      @if (errorMessage()) {
        <div class="error-panel">
          <span>⚠️ {{ errorMessage() }}</span>
        </div>
      }

      @if (!loading() && result(); as r) {
        <!-- KPIs Principais -->
        <div class="kpis-grid">
          <div class="kpi-card">
            <div class="kpi-label">Preço Final de Venda</div>
            <div class="kpi-value highlight">
              {{ formatCurrency(r.totalSalePrice) }}
            </div>
            <div class="kpi-subtext">Base comercial com BDI e impostos</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Lucro Bruto Total</div>
            <div class="kpi-value highlight-green">
              {{ formatCurrency(r.grossProfit) }}
            </div>
            <div class="kpi-subtext">
              Margem bruta: {{ r.grossMarginPercent }}%
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Multiplicador BDI</div>
            <div class="kpi-value">
              {{ r.bdi.bdiMultiplier }}
              <span class="unit">({{ r.bdi.effectiveBdiRate }}%)</span>
            </div>
            <div class="kpi-subtext">
              Indiretos: {{ r.bdi.totalIndirectRate }}%
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Margem Líquida Alvo</div>
            <div class="kpi-value">{{ r.netMarginPercent }}%</div>
            <div class="kpi-subtext">
              IPCA estimado: -{{ formatCurrency(r.ipcaTotalDegradationCost) }}
            </div>
          </div>
        </div>

        <!-- Quadro R: Tabela de Fechamento Econômico -->
        <div class="table-card">
          <div class="table-header">
            <h3 class="table-title">
              Quadro R — Fechamento Econômico e Tributário (RF-51)
            </h3>
            <span class="badge badge-info">{{
              r.lineName || 'Proposta Consolidada'
            }}</span>
          </div>

          <div class="table-responsive">
            <table class="data-table multi-tier-table">
              <thead>
                <!-- Nível 1: Agrupamento Estrutural RT -->
                <tr class="header-level-1">
                  <th class="group-header group-dark">MACRO-DISCIPLINA / PACOTE</th>
                  <th class="group-header group-blue text-right">BASE LÍQUIDA</th>
                  <th colspan="6" class="group-header group-amber text-center">TRIBUTOS DE ENTRADA & DIFAL (RN-04..RN-06)</th>
                  <th colspan="2" class="group-header group-purple text-center">FATURAMENTO (REIDI)</th>
                  <th class="group-header group-green text-right">PREÇO VENDA (BDI)</th>
                </tr>
                <!-- Nível 2: Colunas Analíticas -->
                <tr class="header-level-2">
                  <th>Descrição do Pacote</th>
                  <th class="text-right">Custo Líquido</th>
                  <th class="text-right">PIS/COF</th>
                  <th class="text-right">IPI</th>
                  <th class="text-right">ICMS Orig.</th>
                  <th class="text-right">DIFAL</th>
                  <th class="text-right">FECOEP</th>
                  <th class="text-right font-bold">Custo c/ Impostos</th>
                  <th class="text-right">Fat. Direto</th>
                  <th class="text-right">Custo Próprio</th>
                  <th class="text-right font-bold">Preço de Venda</th>
                </tr>
              </thead>

              <tbody>
                @for (l of r.lines; track l.category + l.description) {
                  <tr>
                    <td class="font-bold">{{ l.description }}</td>
                    <td class="text-right font-mono">
                      {{ formatCurrency(l.netCost) }}
                    </td>
                    <td class="text-right font-mono text-muted">
                      {{ formatCurrency(l.pisCofins) }}
                    </td>
                    <td class="text-right font-mono text-muted">
                      {{ formatCurrency(l.ipi) }}
                    </td>
                    <td class="text-right font-mono text-muted">
                      {{ formatCurrency(l.icmsOrigin) }}
                    </td>
                    <td class="text-right font-mono text-muted">
                      {{ formatCurrency(l.difal) }}
                    </td>
                    <td class="text-right font-mono text-muted">
                      {{ formatCurrency(l.fecoep) }}
                    </td>
                    <td class="text-right font-mono font-bold">
                      {{ formatCurrency(l.costWithTaxes) }}
                    </td>
                    <td class="text-right font-mono text-muted">
                      {{ formatCurrency(l.directBilling) }}
                    </td>
                    <td class="text-right font-mono">
                      {{ formatCurrency(l.ownCost) }}
                    </td>
                    <td class="text-right font-mono font-bold highlight-text">
                      {{ formatCurrency(l.salePrice) }}
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td class="font-bold">TOTAL DO FECHAMENTO:</td>
                  <td class="text-right font-mono font-bold">
                    {{ formatCurrency(r.totalNetCost) }}
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ formatCurrency(r.totalPisCofins) }}
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ formatCurrency(r.totalIpi) }}
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ formatCurrency(r.totalIcmsOrigin) }}
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ formatCurrency(r.totalDifal) }}
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ formatCurrency(r.totalFecoep) }}
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ formatCurrency(r.totalCostWithTaxes) }}
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ formatCurrency(r.totalDirectBilling) }}
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ formatCurrency(r.totalOwnCost) }}
                  </td>
                  <td class="text-right font-mono font-bold highlight-text">
                    {{ formatCurrency(r.totalSalePrice) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Painel de Coeficientes K e Simulador de Margem -->
        <div class="simulation-section">
          <!-- Coeficientes K -->
          <div class="coeff-card">
            <h3 class="section-title">
              Parametrização de Coeficientes K (RF-52)
            </h3>
            <p class="section-desc">
              Ajuste as taxas indiretas e tributárias para recalcular o
              multiplicador de BDI da proposta.
            </p>

            <div class="coeff-grid">
              <div class="coeff-item">
                <label for="centralStructureRate"
                  >Estrutura / Overhead (%)</label
                >
                <input
                  id="centralStructureRate"
                  type="number"
                  step="0.1"
                  [(ngModel)]="coeffs.centralStructureRate"
                  class="form-input"
                  (change)="onCoeffChange()"
                />
              </div>
              <div class="coeff-item">
                <label for="guaranteesRate">Garantias & Cauções (%)</label>
                <input
                  id="guaranteesRate"
                  type="number"
                  step="0.1"
                  [(ngModel)]="coeffs.guaranteesRate"
                  class="form-input"
                  (change)="onCoeffChange()"
                />
              </div>
              <div class="coeff-item">
                <label for="insurancesRate">Seguros de Engenharia (%)</label>
                <input
                  id="insurancesRate"
                  type="number"
                  step="0.1"
                  [(ngModel)]="coeffs.insurancesRate"
                  class="form-input"
                  (change)="onCoeffChange()"
                />
              </div>
              <div class="coeff-item">
                <label for="financialCostRate">Custo Financeiro (%)</label>
                <input
                  id="financialCostRate"
                  type="number"
                  step="0.1"
                  [(ngModel)]="coeffs.financialCostRate"
                  class="form-input"
                  (change)="onCoeffChange()"
                />
              </div>
              <div class="coeff-item">
                <label for="contingencyRate">Contingências (%)</label>
                <input
                  id="contingencyRate"
                  type="number"
                  step="0.1"
                  [(ngModel)]="coeffs.contingencyRate"
                  class="form-input"
                  (change)="onCoeffChange()"
                />
              </div>
              <div class="coeff-item">
                <label for="iddeRate">IDDE (%)</label>
                <input
                  id="iddeRate"
                  type="number"
                  step="0.1"
                  [(ngModel)]="coeffs.iddeRate"
                  class="form-input"
                  (change)="onCoeffChange()"
                />
              </div>
              <div class="coeff-item">
                <label for="countryRiskRate">Risco País/Cliente (%)</label>
                <input
                  id="countryRiskRate"
                  type="number"
                  step="0.1"
                  [(ngModel)]="coeffs.countryRiskRate"
                  class="form-input"
                  (change)="onCoeffChange()"
                />
              </div>
              <div class="coeff-item">
                <label for="productionTaxRate">Imposto Faturamento (%)</label>
                <input
                  id="productionTaxRate"
                  type="number"
                  step="0.1"
                  [(ngModel)]="coeffs.productionTaxRate"
                  class="form-input"
                  (change)="onCoeffChange()"
                />
              </div>
            </div>
          </div>

          <!-- Simulador Bidirecional -->
          <div class="simulator-card">
            <h3 class="section-title">
              Simulador Bidirecional Preço ↔ Margem (RF-53)
            </h3>
            <p class="section-desc">
              Simule metas comerciais e descubra a margem resultante
              instantaneamente.
            </p>

            <div class="sim-controls">
              <div class="sim-mode-toggle">
                <label>
                  <input
                    type="radio"
                    name="simMode"
                    value="MARGIN"
                    [(ngModel)]="simMode"
                  />
                  Fixar Margem Alvo (%)
                </label>
                <label>
                  <input
                    type="radio"
                    name="simMode"
                    value="PRICE"
                    [(ngModel)]="simMode"
                  />
                  Fixar Preço de Venda (R$)
                </label>
              </div>

              @if (simMode === 'MARGIN') {
                <div class="sim-input-row">
                  <label for="simTargetMargin">Margem Líquida Alvo (%):</label>
                  <input
                    id="simTargetMargin"
                    type="number"
                    step="0.5"
                    [(ngModel)]="simTargetMargin"
                    class="form-input"
                  />
                  <button
                    type="button"
                    class="btn btn-primary"
                    (click)="runSimulation()"
                  >
                    Simular Preço
                  </button>
                </div>
              }

              @if (simMode === 'PRICE') {
                <div class="sim-input-row">
                  <label for="simForcedPrice"
                    >Preço de Venda Forçado (R$):</label
                  >
                  <input
                    id="simForcedPrice"
                    type="number"
                    step="50000"
                    [(ngModel)]="simForcedPrice"
                    class="form-input"
                  />
                  <button
                    type="button"
                    class="btn btn-primary"
                    (click)="runSimulation()"
                  >
                    Descobrir Margem
                  </button>
                </div>
              }
            </div>

            <!-- Resultado da Simulação -->
            @if (simulationResult(); as sim) {
              <div class="sim-result-box">
                <div class="sim-result-item">
                  <span>Preço de Venda Simulado:</span>
                  <strong>{{ formatCurrency(sim.simulatedSalePrice) }}</strong>
                </div>
                <div class="sim-result-item">
                  <span>Margem Líquida Resultante:</span>
                  <strong
                    [class.text-danger]="Number(sim.resultingNetMarginRate) < 5"
                    class="highlight-green"
                  >
                    {{ sim.resultingNetMarginRate }}%
                  </strong>
                </div>
                <div class="sim-result-item">
                  <span>Variação sobre Preço Base:</span>
                  <span>{{
                    formatCurrency(sim.differenceFromOriginalPrice)
                  }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .result-container {
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
      .kpi-value .unit {
        font-size: 0.875rem;
        font-weight: 500;
        color: #64748b;
      }
      .kpi-subtext {
        font-size: 0.75rem;
        color: #94a3b8;
        margin-top: 0.25rem;
      }
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
      .table-responsive {
        overflow-x: auto;
      }
      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
      }
      .data-table th {
        background: #f8fafc;
        padding: 0.75rem 1rem;
        text-align: left;
        font-weight: 600;
        color: #475569;
        border-bottom: 1px solid #e2e8f0;
        white-space: nowrap;
      }
      .data-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #f1f5f9;
        color: #1e293b;
      }
      .total-row td {
        background: #f8fafc;
        border-top: 2px solid #cbd5e1;
        font-size: 0.9rem;
      }
      .text-right {
        text-align: right;
      }
      .font-mono {
        font-family: ui-monospace, SFMono-Regular, monospace;
      }
      .font-bold {
        font-weight: 700;
      }
      .text-muted {
        color: #64748b;
      }
      .highlight-text {
        color: #0284c7;
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
      .simulation-section {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: 1.5rem;
      }
      .coeff-card,
      .simulator-card {
        background: #ffffff;
        padding: 1.25rem;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      .section-title {
        font-size: 1rem;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 0.25rem 0;
      }
      .section-desc {
        font-size: 0.8rem;
        color: #64748b;
        margin: 0 0 1rem 0;
      }
      .coeff-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
      }
      .coeff-item label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        color: #475569;
        margin-bottom: 0.25rem;
      }
      .form-input {
        width: 100%;
        padding: 0.4rem 0.6rem;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.85rem;
        box-sizing: border-box;
      }
      .sim-mode-toggle {
        display: flex;
        gap: 1rem;
        font-size: 0.85rem;
        font-weight: 600;
        color: #334155;
        margin-bottom: 1rem;
      }
      .sim-input-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .sim-input-row label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #334155;
        white-space: nowrap;
      }
      .sim-result-box {
        background: #f8fafc;
        padding: 1rem;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        font-size: 0.85rem;
      }
      .sim-result-item {
        display: flex;
        justify-content: space-between;
      }
      .text-danger {
        color: #dc2626;
      }
    `,
  ],
})
export class EconomicResultComponent implements OnInit {
  @Input() offerId!: number;
  @Input() lines: Array<{ id: number; name?: string }> = [];

  private readonly api = inject(EconomicResultApiService);

  viewScope = signal<'CONSOLIDATED' | 'LINE'>('CONSOLIDATED');
  selectedLineId = signal<number>(1);
  result = signal<EconomicResultSummary | null>(null);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  simMode = 'MARGIN';
  simTargetMargin = 8.0;
  simForcedPrice = 25000000;
  simulationResult = signal<MarginSimulationOutput | null>(null);

  coeffs: SaleCoefficients = {
    centralStructureRate: '4.50',
    guaranteesRate: '1.50',
    insurancesRate: '1.00',
    financialCostRate: '1.80',
    contingencyRate: '2.50',
    iddeRate: '0.50',
    countryRiskRate: '1.00',
    productionTaxRate: '5.65',
    targetMarginRate: '8.00',
  };

  ngOnInit(): void {
    if (this.lines && this.lines.length > 0) {
      this.selectedLineId.set(this.lines[0].id);
    }
    this.loadResult();
  }

  setScope(scope: 'CONSOLIDATED' | 'LINE'): void {
    this.viewScope.set(scope);
    this.loadResult();
  }

  setLine(lineId: number): void {
    this.viewScope.set('LINE');
    this.selectedLineId.set(lineId);
    this.loadResult();
  }

  onCoeffChange(): void {
    this.loadResult();
  }

  loadResult(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const req$ =
      this.viewScope() === 'CONSOLIDATED'
        ? this.api.getConsolidatedEconomicResult(this.offerId)
        : this.api.calculateLineWithCoefficients(
            this.selectedLineId(),
            this.coeffs,
          );

    req$.subscribe({
      next: (data) => {
        this.result.set(data);
        if (data.coefficients) {
          this.coeffs = { ...data.coefficients };
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          'Erro ao calcular o resultado econômico da proposta.',
        );
        this.loading.set(false);
      },
    });
  }

  runSimulation(): void {
    const lineId =
      this.viewScope() === 'LINE' ? this.selectedLineId() : undefined;
    const payload =
      this.simMode === 'MARGIN'
        ? { targetMarginRate: this.simTargetMargin.toFixed(2) }
        : { forcedSalePrice: this.simForcedPrice.toFixed(2) };

    this.api.simulateMarginOrPrice(this.offerId, payload, lineId).subscribe({
      next: (simData) => {
        this.simulationResult.set(simData);
      },
    });
  }

  formatCurrency(value?: string | number): string {
    if (value === undefined || value === null) return 'R$ 0,00';
    const num = Number(value);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  Number(val: string): number {
    return Number(val);
  }
}
