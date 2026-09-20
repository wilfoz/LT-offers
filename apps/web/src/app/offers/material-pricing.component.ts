import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LineMaterialPricingSummary,
  ItemTaxBreakdown,
  TaxRegime,
  TAX_REGIME_LABELS,
} from '@lt-offers/domain';
import {
  PricingApiService,
  PricingSimulationPayload,
} from './pricing-api.service';

@Component({
  selector: 'app-material-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pricing-container">
      <!-- 1. Header & Actions Bar -->
      <div class="header-section">
        <div>
          <div class="subtitle-badge">Fase F3 · Módulo M06</div>
          <h2 class="title">Preços, Commodities & Tributos Brasileiros</h2>
          <p class="description">
            Formação dinâmica de preços com curva LME/Midwest, conversão
            cambial, apuração fiscal (ICMS, DIFAL base dupla, FECOEP, IPI,
            PIS/COFINS) e benefícios REIDI.
          </p>
        </div>

        <div class="actions-group">
          <button
            type="button"
            class="btn btn-secondary"
            (click)="toggleSimulator()"
          >
            <span class="icon">⚙️</span>
            {{
              showSimulator() ? 'Ocultar Simulador' : 'Simulador de Cenários'
            }}
          </button>
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="loading()"
            (click)="loadPricing()"
          >
            <span class="icon">🔄</span>
            Atualizar Preços
          </button>
        </div>
      </div>

      <!-- 2. Alertas de Inconsistência / Falta de Preço (RF-29) -->
      @if (summary()?.missingPriceItemCodes?.length) {
        <div class="alert-banner alert-warning">
          <div class="alert-icon">⚠️</div>
          <div class="alert-content">
            <h4 class="alert-title">
              Itens com Quantitativo Físico sem Cotação Atribuída (RF-29)
            </h4>
            <p class="alert-message">
              Os seguintes códigos possuem quantidade calculada maior que zero
              mas não possuem preço unitário:
              <strong>{{ summary()?.missingPriceItemCodes?.join(', ') }}</strong
              >. O fechamento da revisão da proposta requer resolução dessas
              pendências.
            </p>
          </div>
        </div>
      }

      <!-- 3. Painel Simulador de Sensibilidade & Regimes Fiscais (RF-30, RN-04, RN-08) -->
      @if (showSimulator()) {
        <div class="simulator-panel">
          <div class="simulator-header">
            <h3 class="simulator-title">
              <span class="icon">🎛️</span>
              Simulador Paramétrico de Commodities & Tributação
            </h3>
            <span class="badge-tag">Sensibilidade em Tempo Real</span>
          </div>

          <div class="simulator-grid">
            <div class="form-group">
              <label class="form-label" for="simTaxRegime"
                >Regime Tributário (RN-04)</label
              >
              <select
                id="simTaxRegime"
                class="form-select"
                [(ngModel)]="simulationTaxRegime"
                (change)="applySimulation()"
              >
                <option value="STANDARD">Padrão (Sem Desoneração)</option>
                <option value="REIDI">REIDI (Suspensão PIS/COFINS)</option>
                <option value="DIRECT_BILLING">
                  Faturamento Direto ao Cliente
                </option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="simLmeUsd"
                >Alumínio LME Spot (USD/t)</label
              >
              <input
                id="simLmeUsd"
                type="number"
                class="form-input"
                [(ngModel)]="simulationLmeUsd"
                (change)="applySimulation()"
                step="50"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="simMidwestUsd"
                >Prêmio Midwest/RTDU (USD/t)</label
              >
              <input
                id="simMidwestUsd"
                type="number"
                class="form-input"
                [(ngModel)]="simulationMidwestUsd"
                (change)="applySimulation()"
                step="10"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="simFxRate"
                >Taxa de Câmbio (USD/BRL)</label
              >
              <input
                id="simFxRate"
                type="number"
                class="form-input"
                [(ngModel)]="simulationFxRate"
                (change)="applySimulation()"
                step="0.05"
              />
            </div>
          </div>

          <div class="simulator-footer">
            <button
              type="button"
              class="btn btn-outline-sm"
              (click)="resetSimulation()"
            >
              Restaurar Padrões da Oferta
            </button>
          </div>
        </div>
      }

      <!-- 4. Cards de KPIs Executivos Fiscais -->
      @if (summary()) {
        <div class="kpis-grid">
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">Custo Líquido Total</span>
              <span class="kpi-icon">📦</span>
            </div>
            <div class="kpi-value">
              {{
                summary()?.totalNetAmount | currency: 'BRL' : 'symbol' : '1.2-2'
              }}
            </div>
            <div class="kpi-foot">Base sem impostos por fora</div>
          </div>

          <div class="kpi-card kpi-highlight-tax">
            <div class="kpi-header">
              <span class="kpi-label">Total Impostos</span>
              <span class="kpi-icon">🏛️</span>
            </div>
            <div class="kpi-value text-amber">
              {{
                summary()?.totalTaxesAmount
                  | currency: 'BRL' : 'symbol' : '1.2-2'
              }}
            </div>
            <div class="kpi-foot">
              IPI:
              {{
                summary()?.totalIpiAmount | currency: 'BRL' : 'symbol' : '1.0-0'
              }}
              · DIFAL:
              {{
                summary()?.totalDifalAmount
                  | currency: 'BRL' : 'symbol' : '1.0-0'
              }}
            </div>
          </div>

          <div class="kpi-card kpi-highlight-total">
            <div class="kpi-header">
              <span class="kpi-label">Custo com Tributos</span>
              <span class="kpi-icon">💰</span>
            </div>
            <div class="kpi-value text-emerald">
              {{
                summary()?.totalGrossAmount
                  | currency: 'BRL' : 'symbol' : '1.2-2'
              }}
            </div>
            <div class="kpi-foot">
              Regime:
              <strong>{{ getTaxRegimeLabel(summary()?.taxRegime) }}</strong>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">Economia REIDI</span>
              <span class="kpi-icon">🛡️</span>
            </div>
            <div class="kpi-value text-sky">
              {{
                summary()?.totalReidiSavings
                  | currency: 'BRL' : 'symbol' : '1.2-2'
              }}
            </div>
            <div class="kpi-foot">PIS/COFINS desonerados (9,25%)</div>
          </div>
        </div>

        <!-- 5. Tabela Analítica de Materiais com Tributos Discriminados -->
        <div class="table-card">
          <div class="table-header">
            <h3 class="table-title">
              Composição Analítica de Materiais e Tributos (RF-34)
            </h3>
            <span class="table-badge"
              >{{ summary()?.items?.length || 0 }} itens calculados</span
            >
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Material</th>
                  <th class="text-right">Qtd Total</th>
                  <th class="text-right">Preço Liq. (R$)</th>
                  <th class="text-right">Total Liq. (R$)</th>
                  <th class="text-right">IPI (R$)</th>
                  <th class="text-right">ICMS Origem (R$)</th>
                  <th class="text-right">DIFAL Dest. (R$)</th>
                  <th class="text-right">FECOEP (R$)</th>
                  <th class="text-right">PIS/COFINS (R$)</th>
                  <th class="text-right">Total Bruto (R$)</th>
                  <th class="text-center">Memória</th>
                </tr>
              </thead>
              <tbody>
                @for (item of summary()?.items; track item.itemCode) {
                  <tr>
                    <td>
                      <span class="code-badge">{{ item.itemCode }}</span>
                    </td>
                    <td>
                      <div class="font-medium">{{ item.itemName }}</div>
                      <div class="text-xs text-slate-500">
                        UF Origem: {{ item.originState }}
                      </div>
                    </td>
                    <td class="text-right font-mono">
                      {{ item.quantity | number: '1.2-2' }}
                    </td>
                    <td class="text-right font-mono">
                      {{ item.netUnitPrice | currency: 'BRL' : '' : '1.2-2' }}
                    </td>
                    <td class="text-right font-mono font-medium">
                      {{ item.netTotalAmount | currency: 'BRL' : '' : '1.2-2' }}
                    </td>
                    <td class="text-right font-mono text-slate-600">
                      {{ item.ipiAmount | currency: 'BRL' : '' : '1.2-2' }}
                      @if (item.ipiRatePercent > 0) {
                        <span class="text-xs text-slate-400"
                          >({{ item.ipiRatePercent }}%)</span
                        >
                      }
                    </td>
                    <td class="text-right font-mono text-slate-600">
                      {{
                        item.totalIcmsOriginAmount
                          | currency: 'BRL' : '' : '1.2-2'
                      }}
                    </td>
                    <td class="text-right font-mono text-amber-700 font-medium">
                      {{
                        item.totalDifalAmount | currency: 'BRL' : '' : '1.2-2'
                      }}
                    </td>
                    <td class="text-right font-mono text-slate-600">
                      {{
                        item.totalFecoepAmount | currency: 'BRL' : '' : '1.2-2'
                      }}
                    </td>
                    <td class="text-right font-mono text-slate-600">
                      {{
                        item.pisAmount + item.cofinsAmount
                          | currency: 'BRL' : '' : '1.2-2'
                      }}
                    </td>
                    <td class="text-right font-mono font-bold text-emerald-800">
                      {{
                        item.grossTotalAmount
                          | currency: 'BRL' : 'symbol' : '1.2-2'
                      }}
                    </td>
                    <td class="text-center">
                      <button
                        type="button"
                        class="btn-icon"
                        title="Ver Memória Analítica de Cálculo"
                        (click)="openItemDetail(item)"
                      >
                        🔍
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- 6. Modal de Memória de Cálculo Analítica Item a Item (RF-34) -->
      @if (selectedItem()) {
        <div
          class="modal-backdrop"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          (click)="closeItemDetail()"
          (keydown.escape)="closeItemDetail()"
        >
          <div
            class="modal-dialog"
            role="document"
            tabindex="0"
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
          >
            <div class="modal-header">
              <div>
                <h3 class="modal-title">
                  Memória de Cálculo Tributário (RF-34)
                </h3>
                <p class="modal-subtitle">
                  {{ selectedItem()?.itemName }} ({{
                    selectedItem()?.itemCode
                  }})
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                (click)="closeItemDetail()"
              >
                ✕
              </button>
            </div>

            <div class="modal-body">
              <div class="modal-summary-grid">
                <div class="modal-summary-card">
                  <span class="label">Quantidade Física:</span>
                  <span class="val font-mono">{{
                    selectedItem()?.quantity | number: '1.2-2'
                  }}</span>
                </div>
                <div class="modal-summary-card">
                  <span class="label">Preço Unitário Líquido:</span>
                  <span class="val font-mono">{{
                    selectedItem()?.netUnitPrice
                      | currency: 'BRL' : 'symbol' : '1.2-2'
                  }}</span>
                </div>
                <div class="modal-summary-card">
                  <span class="label">Base Líquida Total:</span>
                  <span class="val font-mono font-bold">{{
                    selectedItem()?.netTotalAmount
                      | currency: 'BRL' : 'symbol' : '1.2-2'
                  }}</span>
                </div>
                <div class="modal-summary-card">
                  <span class="label">Preço Unitário Final c/ Impostos:</span>
                  <span class="val font-mono font-bold text-emerald-700">{{
                    selectedItem()?.grossUnitPrice
                      | currency: 'BRL' : 'symbol' : '1.2-2'
                  }}</span>
                </div>
              </div>

              <h4 class="section-heading">
                Detalhamento por Unidade Federativa de Destino (RN-05)
              </h4>
              <div class="destinations-list">
                @for (
                  dest of selectedItem()?.destinationBreakdowns;
                  track dest.destinationState
                ) {
                  <div class="dest-card">
                    <div class="dest-card-header">
                      <span class="dest-state"
                        >Destino: {{ dest.destinationState }}</span
                      >
                      <span class="dest-share"
                        >Rateio: {{ dest.sharePercent }}%</span
                      >
                      <span class="dest-method-badge">
                        Método:
                        {{
                          dest.difalMethod === 'DOUBLE_BASE'
                            ? 'Base Dupla (Reconstituída por dentro)'
                            : 'Base Simples'
                        }}
                      </span>
                    </div>

                    <div class="dest-calc-rows">
                      <div class="calc-row">
                        <span>Base de Cálculo Rateada:</span>
                        <span class="font-mono">{{
                          dest.allocatedNetBase
                            | currency: 'BRL' : 'symbol' : '1.2-2'
                        }}</span>
                      </div>
                      <div class="calc-row">
                        <span
                          >ICMS Origem ({{ dest.interstateRatePercent }}%
                          interestadual):</span
                        >
                        <span class="font-mono">{{
                          dest.icmsOriginAmount
                            | currency: 'BRL' : 'symbol' : '1.2-2'
                        }}</span>
                      </div>
                      @if (dest.difalMethod === 'DOUBLE_BASE') {
                        <div class="calc-row text-sky-800">
                          <span>Base Reconstituída no Destino:</span>
                          <span class="font-mono font-medium">{{
                            dest.reconstitutedDestinationBase
                              | currency: 'BRL' : 'symbol' : '1.2-2'
                          }}</span>
                        </div>
                      }
                      <div class="calc-row font-medium text-amber-800">
                        <span
                          >DIFAL Devido no Destino (Alíquota Interna
                          {{ dest.internalRatePercent }}%):</span
                        >
                        <span class="font-mono">{{
                          dest.difalAmount
                            | currency: 'BRL' : 'symbol' : '1.2-2'
                        }}</span>
                      </div>
                      @if (dest.fecoepRatePercent > 0) {
                        <div class="calc-row text-slate-700">
                          <span
                            >Adicional FECOEP ({{
                              dest.fecoepRatePercent
                            }}%):</span
                          >
                          <span class="font-mono">{{
                            dest.fecoepAmount
                              | currency: 'BRL' : 'symbol' : '1.2-2'
                          }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>

              <h4 class="section-heading">
                Tributos Federais (IPI, PIS & COFINS)
              </h4>
              <div class="federal-grid">
                <div class="federal-item">
                  <span class="fed-label"
                    >IPI ({{ selectedItem()?.ipiRatePercent }}%):</span
                  >
                  <span class="fed-val font-mono">{{
                    selectedItem()?.ipiAmount
                      | currency: 'BRL' : 'symbol' : '1.2-2'
                  }}</span>
                </div>
                <div class="federal-item">
                  <span class="fed-label"
                    >PIS ({{ selectedItem()?.pisRatePercent }}%):</span
                  >
                  <span class="fed-val font-mono">{{
                    selectedItem()?.pisAmount
                      | currency: 'BRL' : 'symbol' : '1.2-2'
                  }}</span>
                </div>
                <div class="federal-item">
                  <span class="fed-label"
                    >COFINS ({{ selectedItem()?.cofinsRatePercent }}%):</span
                  >
                  <span class="fed-val font-mono">{{
                    selectedItem()?.cofinsAmount
                      | currency: 'BRL' : 'symbol' : '1.2-2'
                  }}</span>
                </div>
                @if (selectedItem()?.reidiBenefitAmount) {
                  <div class="federal-item highlight-reidi">
                    <span class="fed-label">Economia REIDI:</span>
                    <span class="fed-val font-mono text-sky-700 font-bold">
                      -{{
                        selectedItem()?.reidiBenefitAmount
                          | currency: 'BRL' : 'symbol' : '1.2-2'
                      }}
                    </span>
                  </div>
                }
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="closeItemDetail()"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .pricing-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 0.5rem 0;
        color: #0f172a;
      }

      .header-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 1.25rem;
      }

      .subtitle-badge {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #0284c7;
        margin-bottom: 0.25rem;
      }

      .title {
        font-size: 1.5rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin: 0 0 0.25rem 0;
      }

      .description {
        font-size: 0.875rem;
        color: #64748b;
        margin: 0;
        max-width: 48rem;
      }

      .actions-group {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        font-weight: 600;
        border-radius: 0.375rem;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.15s ease-in-out;
      }

      .btn-primary {
        background-color: #0f172a;
        color: #ffffff;
      }
      .btn-primary:hover:not(:disabled) {
        background-color: #1e293b;
      }

      .btn-secondary {
        background-color: #f1f5f9;
        color: #334155;
        border-color: #cbd5e1;
      }
      .btn-secondary:hover {
        background-color: #e2e8f0;
      }

      .btn-outline-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 600;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 0.25rem;
        cursor: pointer;
      }

      /* Alertas */
      .alert-banner {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid transparent;
      }

      .alert-warning {
        background-color: #fffbeb;
        border-color: #fde68a;
        color: #92400e;
      }

      .alert-title {
        font-size: 0.875rem;
        font-weight: 700;
        margin: 0 0 0.25rem 0;
      }

      .alert-message {
        font-size: 0.8125rem;
        margin: 0;
      }

      /* Simulador */
      .simulator-panel {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 0.5rem;
        padding: 1.25rem;
      }

      .simulator-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }

      .simulator-title {
        font-size: 1rem;
        font-weight: 700;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .badge-tag {
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.2rem 0.5rem;
        background: #e0f2fe;
        color: #0369a1;
        border-radius: 0.25rem;
      }

      .simulator-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }

      .form-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
      }

      .form-select,
      .form-input {
        padding: 0.5rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        background: #ffffff;
      }

      .simulator-footer {
        margin-top: 1rem;
        display: flex;
        justify-content: flex-end;
      }

      /* KPIs */
      .kpis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }

      .kpi-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 1rem 1.25rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
      }

      .kpi-highlight-tax {
        border-left: 4px solid #f59e0b;
      }

      .kpi-highlight-total {
        border-left: 4px solid #10b981;
      }

      .kpi-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .kpi-label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #64748b;
      }

      .kpi-value {
        font-size: 1.35rem;
        font-weight: 800;
        font-family: monospace;
        color: #0f172a;
      }

      .kpi-foot {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 0.375rem;
      }

      .text-amber {
        color: #d97706;
      }
      .text-emerald {
        color: #059669;
      }
      .text-sky {
        color: #0284c7;
      }

      /* Tabela */
      .table-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      }

      .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
      }

      .table-title {
        font-size: 0.95rem;
        font-weight: 700;
        margin: 0;
      }

      .table-badge {
        font-size: 0.75rem;
        font-weight: 600;
        color: #475569;
        background: #e2e8f0;
        padding: 0.2rem 0.6rem;
        border-radius: 9999px;
      }

      .table-responsive {
        overflow-x: auto;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8125rem;
        text-align: left;
      }

      .data-table th {
        background: #f1f5f9;
        padding: 0.75rem 0.75rem;
        font-weight: 700;
        color: #475569;
        border-bottom: 1px solid #cbd5e1;
        white-space: nowrap;
      }

      .data-table td {
        padding: 0.625rem 0.75rem;
        border-bottom: 1px solid #f1f5f9;
      }

      .data-table tr:hover {
        background-color: #f8fafc;
      }

      .code-badge {
        font-family: monospace;
        font-weight: 700;
        background: #e2e8f0;
        color: #1e293b;
        padding: 0.15rem 0.4rem;
        border-radius: 0.25rem;
        font-size: 0.75rem;
      }

      .btn-icon {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
      }
      .btn-icon:hover {
        background: #e2e8f0;
      }

      /* Modal */
      .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        padding: 1rem;
      }

      .modal-dialog {
        background: #ffffff;
        border-radius: 0.75rem;
        width: 100%;
        max-width: 44rem;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 1.25rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .modal-title {
        font-size: 1.125rem;
        font-weight: 800;
        margin: 0;
      }

      .modal-subtitle {
        font-size: 0.8125rem;
        color: #64748b;
        margin: 0.25rem 0 0 0;
      }

      .btn-close {
        background: transparent;
        border: none;
        font-size: 1.25rem;
        font-weight: bold;
        cursor: pointer;
        color: #94a3b8;
      }

      .modal-body {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .modal-summary-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        background: #f8fafc;
        padding: 0.875rem;
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
      }

      .modal-summary-card {
        display: flex;
        justify-content: space-between;
        font-size: 0.8125rem;
      }

      .section-heading {
        font-size: 0.875rem;
        font-weight: 700;
        color: #334155;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0;
      }

      .dest-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
        padding: 0.875rem;
        margin-bottom: 0.75rem;
      }

      .dest-card-header {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        margin-bottom: 0.5rem;
        font-size: 0.8125rem;
        font-weight: 700;
      }

      .dest-method-badge {
        font-size: 0.7rem;
        background: #f1f5f9;
        padding: 0.15rem 0.4rem;
        border-radius: 0.25rem;
        color: #475569;
      }

      .calc-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        padding: 0.2rem 0;
      }

      .federal-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem;
        background: #f8fafc;
        padding: 0.875rem;
        border-radius: 0.5rem;
      }

      .federal-item {
        display: flex;
        justify-content: space-between;
        font-size: 0.8125rem;
      }

      .highlight-reidi {
        background: #f0f9ff;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
      }

      .modal-footer {
        padding: 1rem 1.25rem;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: flex-end;
      }

      .text-right {
        text-align: right;
      }
      .text-center {
        text-align: center;
      }
      .font-mono {
        font-family: monospace;
      }
      .font-bold {
        font-weight: 700;
      }
      .font-medium {
        font-weight: 500;
      }
    `,
  ],
})
export class MaterialPricingComponent implements OnInit {
  @Input({ required: true }) lineId!: number;

  private readonly pricingApi = inject(PricingApiService);

  readonly loading = signal<boolean>(false);
  readonly summary = signal<LineMaterialPricingSummary | null>(null);
  readonly selectedItem = signal<ItemTaxBreakdown | null>(null);
  readonly showSimulator = signal<boolean>(false);

  // Variáveis do simulador
  simulationTaxRegime: TaxRegime = 'STANDARD';
  simulationLmeUsd = 2400;
  simulationMidwestUsd = 450;
  simulationFxRate = 5.5;

  ngOnInit(): void {
    if (this.lineId) {
      this.loadPricing();
    }
  }

  loadPricing(): void {
    this.loading.set(true);
    this.pricingApi.getLinePricingSummary(this.lineId).subscribe({
      next: (res) => {
        this.summary.set(res);
        this.simulationTaxRegime = res.taxRegime;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  toggleSimulator(): void {
    this.showSimulator.update((v) => !v);
  }

  applySimulation(): void {
    this.loading.set(true);
    const payload: PricingSimulationPayload = {
      taxRegime: this.simulationTaxRegime,
      spotLmeUsdPerTon: this.simulationLmeUsd,
      spotMidwestPremiumUsdPerTon: this.simulationMidwestUsd,
      spotExchangeRateBrl: this.simulationFxRate,
    };

    this.pricingApi.simulateLinePricing(this.lineId, payload).subscribe({
      next: (res) => {
        this.summary.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  resetSimulation(): void {
    this.simulationLmeUsd = 2400;
    this.simulationMidwestUsd = 450;
    this.simulationFxRate = 5.5;
    this.loadPricing();
  }

  openItemDetail(item: ItemTaxBreakdown): void {
    this.selectedItem.set(item);
  }

  closeItemDetail(): void {
    this.selectedItem.set(null);
  }

  getTaxRegimeLabel(regime?: TaxRegime): string {
    if (!regime) return 'Padrão';
    return TAX_REGIME_LABELS[regime] || regime;
  }
}
