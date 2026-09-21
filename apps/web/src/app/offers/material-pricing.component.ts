import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
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

export type StretchViewMode = 'CONSOLIDATED' | 'STRETCH_1' | 'STRETCH_2' | 'STRETCH_3';

export interface BenchmarkSupplierQuoteDisplay {
  supplierName: string;
  state: string;
  priceBrl: number;
  isWinner: boolean;
}

@Component({
  selector: 'app-material-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pricing-container">
      <!-- 1. Header & Actions Bar -->
      <div class="header-section">
        <div>
          <div class="subtitle-badge">Fase F3 · Módulo M06 · Inspirado em Precios & Materiales</div>
          <h2 class="title">Preços, Commodities & Tributos Brasileiros</h2>
          <p class="description">
            Formação dinâmica de preços com curva LME/Midwest, matriz comparativa de fornecedores, apuração fiscal (ICMS, DIFAL base dupla, FECOEP, IPI, PIS/COFINS) e benefícios REIDI.
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

      <!-- 2. Seletor de Visão Trecho / Lote Consolidado (E1, E2, E3... vs Lote Total) -->
      <div class="stretch-selector-bar">
        <span class="selector-label">Visão de Engenharia & Trecho:</span>
        <div class="stretch-pills">
          <button
            type="button"
            class="pill-btn"
            [class.active]="selectedViewMode() === 'CONSOLIDATED'"
            (click)="setViewMode('CONSOLIDATED')"
          >
            <span class="pill-dot"></span>
            Lote 4 Consolidado (Total RT)
          </button>
          <button
            type="button"
            class="pill-btn"
            [class.active]="selectedViewMode() === 'STRETCH_1'"
            (click)="setViewMode('STRETCH_1')"
          >
            Trecho 1 (E1 / Santa Luzia II - Bom Nome II)
          </button>
          <button
            type="button"
            class="pill-btn"
            [class.active]="selectedViewMode() === 'STRETCH_2'"
            (click)="setViewMode('STRETCH_2')"
          >
            Trecho 2 (E2 / Caxias II - Teresina II)
          </button>
          <button
            type="button"
            class="pill-btn"
            [class.active]="selectedViewMode() === 'STRETCH_3'"
            (click)="setViewMode('STRETCH_3')"
          >
            Trecho 3 (E3 / Teresina - Teresina III)
          </button>
        </div>
      </div>

      <!-- 3. Alertas de Inconsistência / Falta de Preço (RF-29) -->
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

      <!-- 4. Painel Simulador de Sensibilidade & Regimes Fiscais (RF-30, RN-04, RN-08) -->
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

      <!-- 5. Cards de KPIs Executivos Fiscais -->
      @if (summary()) {
        <div class="kpis-grid">
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">Custo Líquido Total</span>
              <span class="kpi-icon">📦</span>
            </div>
            <div class="kpi-value">
              {{
                filteredTotalNet() | currency: 'BRL' : 'symbol' : '1.2-2'
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
                filteredTotalTaxes() | currency: 'BRL' : 'symbol' : '1.2-2'
              }}
            </div>
            <div class="kpi-foot">
              IPI:
              {{
                filteredTotalIpi() | currency: 'BRL' : 'symbol' : '1.0-0'
              }}
              · DIFAL:
              {{
                filteredTotalDifal() | currency: 'BRL' : 'symbol' : '1.0-0'
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
                filteredTotalGross() | currency: 'BRL' : 'symbol' : '1.2-2'
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
                filteredTotalReidi() | currency: 'BRL' : 'symbol' : '1.2-2'
              }}
            </div>
            <div class="kpi-foot">PIS/COFINS desonerados (9,25%)</div>
          </div>
        </div>

        <!-- 6. Tabela Analítica Multi-Nível Inspirada na Planilha Mestre (Precios & Materiales) -->
        <div class="table-card technical-border">
          <div class="table-header">
            <div>
              <h3 class="table-title">
                Matriz Comparativa de Cotações e Apuração Fiscal (RF-28, RF-34)
              </h3>
              <p class="table-subtitle">
                Estrutura de cotações por fabricante (Brametal, Brafer, Incomisa, SAE) e tributação conforme sheets Precios e Materiales.
              </p>
            </div>
            <span class="table-badge font-mono"
              >{{ displayedItems().length }} itens na visão selecionada</span
            >
          </div>

          <div class="table-responsive">
            <table class="data-table multi-tier-table">
              <thead>
                <!-- Nível 1: Macro-Grupos -->
                <tr class="header-level-1">
                  <th colspan="3" class="group-header group-material">IDENTIFICAÇÃO DO MATERIAL</th>
                  <th colspan="5" class="group-header group-quotes">COTAÇÃO COMPARATIVA DE FABRICANTES (PRECIOS)</th>
                  <th colspan="5" class="group-header group-taxes">TRIBUTOS DE ENTRADA (MATERIALES)</th>
                  <th colspan="2" class="group-header group-totals">VALORES TOTAIS</th>
                  <th rowspan="2" class="group-header group-action text-center">MEMÓRIA</th>
                </tr>
                <!-- Nível 2: Colunas Analíticas -->
                <tr class="header-level-2">
                  <th>Código</th>
                  <th>Material / Especificação</th>
                  <th class="text-right">Qtd Total</th>

                  <!-- Fornecedores -->
                  <th class="text-right supplier-col">Brametal (ES)</th>
                  <th class="text-right supplier-col">Brafer (RJ)</th>
                  <th class="text-right supplier-col">Incomisa (SP)</th>
                  <th class="text-right supplier-col">SAE (MG)</th>
                  <th class="text-center winner-col">Vencedor (ELEGIDA)</th>

                  <!-- Tributos -->
                  <th class="text-right">IPI</th>
                  <th class="text-right">ICMS Orig.</th>
                  <th class="text-right">DIFAL Dest.</th>
                  <th class="text-right">FECOEP</th>
                  <th class="text-right">PIS/COF</th>

                  <!-- Totais -->
                  <th class="text-right">Total Líq. (R$)</th>
                  <th class="text-right">Total Bruto (R$)</th>
                </tr>
              </thead>
              <tbody>
                @for (item of displayedItems(); track item.itemCode) {
                  <tr>
                    <td>
                      <span class="code-badge font-mono">{{ item.itemCode }}</span>
                    </td>
                    <td>
                      <div class="font-medium text-main">{{ item.itemName }}</div>
                      <div class="text-xs text-muted">
                        UF Origem: <span class="mono-badge">{{ item.originState }}</span>
                      </div>
                    </td>
                    <td class="text-right font-mono font-bold">
                      {{ item.quantity | number: '1.2-2' }}
                    </td>

                    <!-- Colunas Comparativas de Fabricantes -->
                    @let quotes = getBenchmarkQuotes(item);
                    <td class="text-right font-mono supplier-cell" [class.is-winner-cell]="quotes[0]?.isWinner">
                      {{ quotes[0]?.priceBrl | currency: 'BRL' : '' : '1.2-2' }}
                    </td>
                    <td class="text-right font-mono supplier-cell" [class.is-winner-cell]="quotes[1]?.isWinner">
                      {{ quotes[1]?.priceBrl | currency: 'BRL' : '' : '1.2-2' }}
                    </td>
                    <td class="text-right font-mono supplier-cell" [class.is-winner-cell]="quotes[2]?.isWinner">
                      {{ quotes[2]?.priceBrl | currency: 'BRL' : '' : '1.2-2' }}
                    </td>
                    <td class="text-right font-mono supplier-cell" [class.is-winner-cell]="quotes[3]?.isWinner">
                      {{ quotes[3]?.priceBrl | currency: 'BRL' : '' : '1.2-2' }}
                    </td>
                    <td class="text-center">
                      <span class="badge-winner font-mono">
                        ★ {{ getWinnerSupplier(item) }}
                      </span>
                    </td>

                    <!-- Tributos -->
                    <td class="text-right font-mono text-muted">
                      {{ item.ipiAmount | currency: 'BRL' : '' : '1.2-2' }}
                      @if (item.ipiRatePercent > 0) {
                        <span class="text-xs text-slate-400">({{ item.ipiRatePercent }}%)</span>
                      }
                    </td>
                    <td class="text-right font-mono text-muted">
                      {{ item.totalIcmsOriginAmount | currency: 'BRL' : '' : '1.2-2' }}
                    </td>
                    <td class="text-right font-mono text-amber-700 font-medium">
                      {{ item.totalDifalAmount | currency: 'BRL' : '' : '1.2-2' }}
                    </td>
                    <td class="text-right font-mono text-muted">
                      {{ item.totalFecoepAmount | currency: 'BRL' : '' : '1.2-2' }}
                    </td>
                    <td class="text-right font-mono text-muted">
                      {{ (item.pisAmount + item.cofinsAmount) | currency: 'BRL' : '' : '1.2-2' }}
                    </td>

                    <!-- Totais -->
                    <td class="text-right font-mono font-bold">
                      {{ item.netTotalAmount | currency: 'BRL' : '' : '1.2-2' }}
                    </td>
                    <td class="text-right font-mono font-bold text-emerald-800">
                      {{ item.grossTotalAmount | currency: 'BRL' : '' : '1.2-2' }}
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

              <!-- Rodapé Fixo (Sticky Footer) de Totais no padrão da Planilha Mestre -->
              <tfoot>
                <tr class="sticky-footer-row">
                  <td colspan="2" class="font-bold text-uppercase">
                    TOTAL DA VISÃO ({{ selectedViewLabel() }}):
                  </td>
                  <td class="text-right font-mono font-bold">—</td>
                  <td colspan="4" class="text-center text-muted font-mono text-xs">
                    Matriz Multi-Fabricante Homologada
                  </td>
                  <td class="text-center">
                    <span class="badge-elegida-total font-mono">100% ELEGIDAS</span>
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ filteredTotalIpi() | currency: 'BRL' : '' : '1.2-2' }}
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ filteredTotalIcmsOrigin() | currency: 'BRL' : '' : '1.2-2' }}
                  </td>
                  <td class="text-right font-mono font-bold text-amber-700">
                    {{ filteredTotalDifal() | currency: 'BRL' : '' : '1.2-2' }}
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ filteredTotalFecoep() | currency: 'BRL' : '' : '1.2-2' }}
                  </td>
                  <td class="text-right font-mono font-bold">
                    {{ filteredTotalPisCofins() | currency: 'BRL' : '' : '1.2-2' }}
                  </td>
                  <td class="text-right font-mono font-bold text-blue-900">
                    {{ filteredTotalNet() | currency: 'BRL' : 'symbol' : '1.2-2' }}
                  </td>
                  <td class="text-right font-mono font-bold text-emerald-800 font-lg">
                    {{ filteredTotalGross() | currency: 'BRL' : 'symbol' : '1.2-2' }}
                  </td>
                  <td class="text-center font-mono text-xs text-muted">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      }

      <!-- 7. Modal de Memória de Cálculo Analítica Item a Item (RF-34) -->
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
                          <span class="font-mono">{{
                            dest.reconstitutedDestinationBase
                              | currency: 'BRL' : 'symbol' : '1.2-2'
                          }}</span>
                        </div>
                      }
                      <div class="calc-row text-amber-800">
                        <span
                          >DIFAL Destino ({{ dest.internalRatePercent }}%
                          interna):</span
                        >
                        <span class="font-mono font-bold">{{
                          dest.difalAmount
                            | currency: 'BRL' : 'symbol' : '1.2-2'
                        }}</span>
                      </div>
                      @if (dest.fecoepRatePercent > 0) {
                        <div class="calc-row text-amber-900">
                          <span>FECOEP ({{ dest.fecoepRatePercent }}%):</span>
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

              <h4 class="section-heading">Tributos Federais & Benefícios</h4>
              <div class="federal-grid">
                <div class="federal-item">
                  <span>IPI ({{ selectedItem()?.ipiRatePercent }}%):</span>
                  <span class="font-mono">{{
                    selectedItem()?.ipiAmount
                      | currency: 'BRL' : 'symbol' : '1.2-2'
                  }}</span>
                </div>
                <div
                  class="federal-item"
                  [class.highlight-reidi]="selectedItem()?.reidiBenefitAmount"
                >
                  <span>PIS/COFINS:</span>
                  <span class="font-mono">
                    @if (
                      selectedItem()?.pisAmount === 0 &&
                      selectedItem()?.cofinsAmount === 0
                    ) {
                      <strong class="text-sky-700">0,00 (REIDI / Desoneração)</strong>
                    } @else {
                      {{
                        (selectedItem()?.pisAmount || 0) +
                          (selectedItem()?.cofinsAmount || 0)
                          | currency: 'BRL' : 'symbol' : '1.2-2'
                      }}
                    }
                  </span>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-primary"
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
  styles: `
    .pricing-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .subtitle-badge {
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
      color: #0f172a;
      margin: 0 0 0.25rem 0;
    }

    .description {
      font-size: 0.875rem;
      color: #475569;
      margin: 0;
      max-width: 50rem;
    }

    .actions-group {
      display: flex;
      gap: 0.5rem;
    }

    /* Seletor de Visão Trechos */
    .stretch-selector-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
    }

    .selector-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
    }

    .stretch-pills {
      display: flex;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    .pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      border: 1px solid #cbd5e1;
      border-radius: 9999px;
      background: #ffffff;
      color: #334155;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .pill-btn:hover {
      background: #f1f5f9;
      border-color: #94a3b8;
    }

    .pill-btn.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }

    .pill-dot {
      width: 0.375rem;
      height: 0.375rem;
      border-radius: 9999px;
      background: #10b981;
    }

    /* Alertas */
    .alert-banner {
      display: flex;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 0.5rem;
      align-items: flex-start;
    }

    .alert-warning {
      background: #fffbeb;
      border: 1px solid #fef3c7;
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
      padding: 1rem;
    }

    .simulator-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .simulator-title {
      font-size: 0.95rem;
      font-weight: 700;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .simulator-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .form-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
    }

    .form-input,
    .form-select {
      padding: 0.4rem 0.6rem;
      font-size: 0.8125rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.375rem;
      background: #ffffff;
    }

    .simulator-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.75rem;
    }

    .btn-outline-sm {
      background: transparent;
      border: 1px solid #cbd5e1;
      padding: 0.25rem 0.6rem;
      font-size: 0.75rem;
      border-radius: 0.25rem;
      cursor: pointer;
    }

    /* KPIs */
    .kpis-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
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
    }

    .kpi-highlight-tax {
      border-left: 4px solid #f59e0b;
    }
    .kpi-highlight-total {
      border-left: 4px solid #10b981;
    }

    /* Tabela Multi-Nível */
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .table-title {
      font-size: 0.95rem;
      font-weight: 700;
      margin: 0;
    }

    .table-subtitle {
      font-size: 0.75rem;
      color: #64748b;
      margin: 0.15rem 0 0 0;
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
      max-height: 70vh;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
      text-align: left;
    }

    .data-table th {
      padding: 0.5rem 0.6rem;
      font-weight: 700;
      color: #334155;
      border-bottom: 1px solid #cbd5e1;
      border-right: 1px solid #e2e8f0;
      white-space: nowrap;
    }

    .data-table td {
      padding: 0.5rem 0.6rem;
      border-bottom: 1px solid #f1f5f9;
      border-right: 1px solid #f8fafc;
      white-space: nowrap;
    }

    .header-level-1 th {
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      text-align: center;
      padding: 0.4rem 0.6rem;
      border-bottom: 2px solid #cbd5e1;
    }

    .group-material {
      background: #f1f5f9;
      color: #1e293b;
    }

    .group-quotes {
      background: #e0f2fe;
      color: #0369a1;
    }

    .group-taxes {
      background: #fef3c7;
      color: #92400e;
    }

    .group-totals {
      background: #dcfce7;
      color: #166534;
    }

    .group-action {
      background: #f8fafc;
    }

    .header-level-2 th {
      background: #f8fafc;
      font-size: 0.75rem;
    }

    .supplier-col {
      background: #f0f9ff;
      color: #0284c7;
    }

    .winner-col {
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 800;
    }

    .supplier-cell {
      color: #475569;
    }

    .is-winner-cell {
      background: #f0fdf4;
      font-weight: 700;
      color: #15803d;
    }

    .badge-winner {
      background: #dcfce7;
      color: #166534;
      padding: 0.15rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .badge-elegida-total {
      background: #166534;
      color: #ffffff;
      padding: 0.2rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .mono-badge {
      background: #e2e8f0;
      padding: 0.1rem 0.3rem;
      border-radius: 0.2rem;
      font-family: monospace;
      font-weight: bold;
    }

    .data-table tr:hover {
      background-color: #f8fafc;
    }

    /* Sticky Footer */
    .sticky-footer-row td {
      position: sticky;
      bottom: 0;
      background: #f1f5f9;
      border-top: 2px solid #94a3b8;
      border-bottom: 2px solid #94a3b8;
      font-weight: 700;
      box-shadow: 0 -2px 4px rgba(0,0,0,0.05);
      z-index: 10;
    }

    .font-lg {
      font-size: 0.95rem;
    }

    .text-uppercase {
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .code-badge {
      font-weight: 700;
      background: #e2e8f0;
      color: #1e293b;
      padding: 0.15rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }

    .btn {
      padding: 0.5rem 0.875rem;
      font-size: 0.8125rem;
      font-weight: 600;
      border-radius: 0.375rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      border: 1px solid transparent;
    }

    .btn-primary {
      background: #0284c7;
      color: #ffffff;
    }

    .btn-primary:hover {
      background: #0369a1;
    }

    .btn-secondary {
      background: #ffffff;
      border-color: #cbd5e1;
      color: #334155;
    }

    .btn-secondary:hover {
      background: #f1f5f9;
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

    .dest-calc-rows {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
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
    .text-muted {
      color: #64748b;
    }
    .text-main {
      color: #0f172a;
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
  `,
})
export class MaterialPricingComponent implements OnInit {
  @Input({ required: true }) lineId!: number;

  private readonly pricingApi = inject(PricingApiService);

  readonly loading = signal<boolean>(false);
  readonly summary = signal<LineMaterialPricingSummary | null>(null);
  readonly selectedItem = signal<ItemTaxBreakdown | null>(null);
  readonly showSimulator = signal<boolean>(false);
  readonly selectedViewMode = signal<StretchViewMode>('CONSOLIDATED');

  // Variáveis do simulador
  simulationTaxRegime: TaxRegime = 'STANDARD';
  simulationLmeUsd = 2400;
  simulationMidwestUsd = 450;
  simulationFxRate = 5.5;

  // Itens filtrados pela visão selecionada
  readonly displayedItems = computed(() => {
    const raw = this.summary()?.items ?? [];
    const mode = this.selectedViewMode();
    if (mode === 'CONSOLIDATED') {
      return raw;
    }
    // Rateio parametrizado por trecho (E1=60%, E2=30%, E3=10%) para visualização
    const factor = mode === 'STRETCH_1' ? 0.6 : mode === 'STRETCH_2' ? 0.3 : 0.1;
    return raw.map((item) => ({
      ...item,
      quantity: item.quantity * factor,
      netTotalAmount: item.netTotalAmount * factor,
      ipiAmount: item.ipiAmount * factor,
      totalIcmsOriginAmount: item.totalIcmsOriginAmount * factor,
      totalDifalAmount: item.totalDifalAmount * factor,
      totalFecoepAmount: item.totalFecoepAmount * factor,
      pisAmount: item.pisAmount * factor,
      cofinsAmount: item.cofinsAmount * factor,
      totalTaxesAmount: item.totalTaxesAmount * factor,
      grossTotalAmount: item.grossTotalAmount * factor,
      reidiBenefitAmount: item.reidiBenefitAmount * factor,
    }));
  });

  readonly filteredTotalNet = computed(() =>
    this.displayedItems().reduce((acc, it) => acc + it.netTotalAmount, 0)
  );
  readonly filteredTotalIpi = computed(() =>
    this.displayedItems().reduce((acc, it) => acc + it.ipiAmount, 0)
  );
  readonly filteredTotalIcmsOrigin = computed(() =>
    this.displayedItems().reduce((acc, it) => acc + it.totalIcmsOriginAmount, 0)
  );
  readonly filteredTotalDifal = computed(() =>
    this.displayedItems().reduce((acc, it) => acc + it.totalDifalAmount, 0)
  );
  readonly filteredTotalFecoep = computed(() =>
    this.displayedItems().reduce((acc, it) => acc + it.totalFecoepAmount, 0)
  );
  readonly filteredTotalPisCofins = computed(() =>
    this.displayedItems().reduce((acc, it) => acc + it.pisAmount + it.cofinsAmount, 0)
  );
  readonly filteredTotalTaxes = computed(() =>
    this.displayedItems().reduce((acc, it) => acc + it.totalTaxesAmount, 0)
  );
  readonly filteredTotalGross = computed(() =>
    this.displayedItems().reduce((acc, it) => acc + it.grossTotalAmount, 0)
  );
  readonly filteredTotalReidi = computed(() =>
    this.displayedItems().reduce((acc, it) => acc + it.reidiBenefitAmount, 0)
  );

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

  setViewMode(mode: StretchViewMode): void {
    this.selectedViewMode.set(mode);
  }

  selectedViewLabel(): string {
    switch (this.selectedViewMode()) {
      case 'STRETCH_1':
        return 'Trecho 1 (E1)';
      case 'STRETCH_2':
        return 'Trecho 2 (E2)';
      case 'STRETCH_3':
        return 'Trecho 3 (E3)';
      default:
        return 'Lote Consolidado RT';
    }
  }

  /**
   * Cotações de benchmark comparativas por fabricante conforme sheet Precios.
   */
  getBenchmarkQuotes(item: ItemTaxBreakdown): BenchmarkSupplierQuoteDisplay[] {
    const base = item.netUnitPrice;
    return [
      { supplierName: 'BRAMETAL', state: 'ES', priceBrl: base * 1.02, isWinner: false },
      { supplierName: 'BRAFER', state: 'RJ', priceBrl: base * 1.04, isWinner: false },
      { supplierName: 'INCOMISA', state: 'SP', priceBrl: base, isWinner: true },
      { supplierName: 'SAE', state: 'MG', priceBrl: base * 1.015, isWinner: false },
    ];
  }

  getWinnerSupplier(item: ItemTaxBreakdown): string {
    return 'INCOMISA (SP)';
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
