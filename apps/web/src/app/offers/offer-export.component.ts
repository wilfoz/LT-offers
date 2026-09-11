import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  TenderSheetLayout,
  TenderSheetExportData,
  MeasurementSheetExportData,
  CashflowExportData,
  PerformanceIndicatorsSummary,
} from '@lt-offers/domain';
import { ExportApiService } from './export-api.service';

@Component({
  selector: 'app-offer-export',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <div class="export-center-container">
      <!-- Cabeçalho da Central de Exportação -->
      <div class="header-section">
        <div class="header-title">
          <div class="icon-badge">
            <mat-icon>file_download</mat-icon>
          </div>
          <div>
            <h2>Central de Emissão e Exportações Contratuais</h2>
            <p class="subtitle">
              Emissão de Planilhas de Preços do Edital, Folhas de Medição, Fluxo de Caixa e Pacote Aberto JSON (M12, RF-47, RF-48, RF-49, RF-50, RF-60, RNF-11, RNF-18)
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button
            mat-stroked-button
            color="primary"
            (click)="loadAllData()"
            [disabled]="isLoading()"
          >
            <mat-icon>refresh</mat-icon>
            Atualizar Dados
          </button>
        </div>
      </div>

      <!-- Spinner Geral -->
      @if (isLoading()) {
        <div class="loading-state">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Consolidando entregáveis contratuais e calculando indicadores...</p>
        </div>
      } @else {
        <!-- Painel de Benchmarking & Indicadores Sintéticos (RF-49) -->
        @if (indicators(); as ind) {
          <div class="benchmarking-card">
            <div class="section-title">
              <mat-icon class="accent-icon">analytics</mat-icon>
              <h3>Indicadores Sintéticos de Performance & Custos Unitários (RF-49, M09)</h3>
              <mat-chip-set>
                <mat-chip class="total-chip">
                  Extensão: {{ ind.consolidated.lengthKm }} km | {{ ind.consolidated.towerCount }} Torres
                </mat-chip>
              </mat-chip-set>
            </div>

            <div class="kpi-grid">
              <div class="kpi-card highlight-blue">
                <span class="kpi-label">Custo Total / km</span>
                <span class="kpi-value">R$ {{ formatCurrency(ind.consolidated.costPerKm) }}</span>
                <span class="kpi-sub">Preço de venda por quilômetro de LT</span>
              </div>

              <div class="kpi-card highlight-green">
                <span class="kpi-label">Custo Total / Torre</span>
                <span class="kpi-value">R$ {{ formatCurrency(ind.consolidated.costPerTower) }}</span>
                <span class="kpi-sub">Preço de venda por estrutura erguida</span>
              </div>

              <div class="kpi-card">
                <span class="kpi-label">Materiais / km</span>
                <span class="kpi-value">R$ {{ formatCurrency(ind.consolidated.suppliesCostPerKm) }}</span>
                <span class="kpi-sub">Cabos, torres e isoladores</span>
              </div>

              <div class="kpi-card">
                <span class="kpi-label">Serviços / km</span>
                <span class="kpi-value">R$ {{ formatCurrency(ind.consolidated.servicesCostPerKm) }}</span>
                <span class="kpi-sub">Construção civil e montagem</span>
              </div>

              <div class="kpi-card">
                <span class="kpi-label">Aço Galvanizado</span>
                <span class="kpi-value">{{ ind.consolidated.steelPerKm }} t/km</span>
                <span class="kpi-sub">{{ ind.consolidated.steelPerTower }} t/torre</span>
              </div>

              <div class="kpi-card">
                <span class="kpi-label">Concreto Estrutural</span>
                <span class="kpi-value">{{ ind.consolidated.concretePerKm }} m³/km</span>
                <span class="kpi-sub">{{ ind.consolidated.concretePerTower }} m³/torre</span>
              </div>

              <div class="kpi-card">
                <span class="kpi-label">Densidade de Estruturas</span>
                <span class="kpi-value">{{ ind.consolidated.structuresDensityPerKm }} torres/km</span>
                <span class="kpi-sub">Vão Médio: {{ ind.consolidated.averageSpanMeters }} m</span>
              </div>
            </div>
          </div>
        }

        <!-- Grid de Cards de Exportação com 1 Clique -->
        <div class="export-cards-grid">
          <!-- Card 1: Planilha de Preços do Edital -->
          <mat-card class="export-card">
            <mat-card-header>
              <div mat-card-avatar class="card-icon blue-bg">
                <mat-icon>table_chart</mat-icon>
              </div>
              <mat-card-title>Planilha de Preços do Edital (XLSX)</mat-card-title>
              <mat-card-subtitle>RF-47, RF-50, RNF-11 • Código CIP e BDI</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p class="card-desc">
                Planilha oficial estruturada por árvore CIP com discriminação de custos diretos, BDI por grupo e preços de venda.
              </p>

              <mat-form-field appearance="outline" class="full-width density-compact">
                <mat-label>Layout de Edital do Cliente</mat-label>
                <mat-select
                  [value]="selectedLayout()"
                  (selectionChange)="onLayoutChange($event.value)"
                >
                  <mat-option value="ANEEL_STANDARD">Padrão ANEEL (Oficial Leilão)</mat-option>
                  <mat-option value="CELEO_STANDARD">Padrão Celeo Redes</mat-option>
                  <mat-option value="GENERIC_EPC">Padrão Geral Construtora EPC</mat-option>
                </mat-select>
              </mat-form-field>
            </mat-card-content>
            <mat-card-actions>
              <button
                mat-flat-button
                color="primary"
                class="full-width action-btn"
                (click)="downloadTenderSheet()"
                [disabled]="isDownloading() !== null"
              >
                @if (isDownloading() === 'tender') {
                  <mat-spinner diameter="18" class="inline-spinner"></mat-spinner>
                  Gerando XLSX...
                } @else {
                  <mat-icon>download</mat-icon>
                  Baixar Planilha do Edital (.xlsx)
                }
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Card 2: Folha de Medição Contratual e PUs -->
          <mat-card class="export-card">
            <mat-card-header>
              <div mat-card-avatar class="card-icon green-bg">
                <mat-icon>fact_check</mat-icon>
              </div>
              <mat-card-title>Folha de Medição & PUs (XLSX)</mat-card-title>
              <mat-card-subtitle>RF-48, RNF-11 • Folhas M1..M10 e PU1..PU10</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p class="card-desc">
                Folha de medição de obras civis, fundações, montagem e cabos com critérios de medição em campo e preços unitários contratuais.
              </p>
              <div class="card-tags">
                <span class="tag-badge">Topografia</span>
                <span class="tag-badge">Fundações</span>
                <span class="tag-badge">Montagem</span>
                <span class="tag-badge">Lançamento</span>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button
                mat-flat-button
                color="accent"
                class="full-width action-btn"
                (click)="downloadMeasurementSheet()"
                [disabled]="isDownloading() !== null"
              >
                @if (isDownloading() === 'measurement') {
                  <mat-spinner diameter="18" class="inline-spinner"></mat-spinner>
                  Gerando XLSX...
                } @else {
                  <mat-icon>download</mat-icon>
                  Baixar Folha de Medição (.xlsx)
                }
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Card 3: Cronograma de Faturamento e Desembolso -->
          <mat-card class="export-card">
            <mat-card-header>
              <div mat-card-avatar class="card-icon orange-bg">
                <mat-icon>trending_up</mat-icon>
              </div>
              <mat-card-title>Cronograma Financeiro (XLSX)</mat-card-title>
              <mat-card-subtitle>RF-60, RNF-11 • Desembolso & Curva S</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p class="card-desc">
                Desembolso mês a mês por grupo de suprimentos e serviços, faturamento por medição, adiantamentos e pico de caixa.
              </p>
              @if (cashflowData(); as cf) {
                <div class="exposure-highlight">
                  <mat-icon>warning</mat-icon>
                  <span>Pico de Exposição: Mês {{ cf.peakExposureMonth }} (R$ {{ formatCurrency(cf.peakExposureAmount) }})</span>
                </div>
              }
            </mat-card-content>
            <mat-card-actions>
              <button
                mat-flat-button
                class="full-width action-btn orange-btn"
                (click)="downloadCashflowSheet()"
                [disabled]="isDownloading() !== null"
              >
                @if (isDownloading() === 'cashflow') {
                  <mat-spinner diameter="18" class="inline-spinner"></mat-spinner>
                  Gerando XLSX...
                } @else {
                  <mat-icon>download</mat-icon>
                  Baixar Cronograma (.xlsx)
                }
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- Card 4: Pacote Aberto Integral JSON -->
          <mat-card class="export-card">
            <mat-card-header>
              <div mat-card-avatar class="card-icon purple-bg">
                <mat-icon>code</mat-icon>
              </div>
              <mat-card-title>Pacote Aberto da Oferta (JSON)</mat-card-title>
              <mat-card-subtitle>RNF-18 • Interoperabilidade sem Vendor Lock-in</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p class="card-desc">
                Exportação integral de todas as entidades da proposta (engenharia, suprimentos, BDI, riscos e resultados) em esquema JSON aberto.
              </p>
              <div class="card-tags">
                <span class="tag-badge">Schema v1</span>
                <span class="tag-badge">Sem Lock-in</span>
                <span class="tag-badge">100% Auditável</span>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button
                mat-flat-button
                class="full-width action-btn purple-btn"
                (click)="downloadFullPackageJson()"
                [disabled]="isDownloading() !== null"
              >
                @if (isDownloading() === 'json') {
                  <mat-spinner diameter="18" class="inline-spinner"></mat-spinner>
                  Gerando JSON...
                } @else {
                  <mat-icon>code</mat-icon>
                  Exportar Pacote Aberto (.json)
                }
              </button>
            </mat-card-actions>
          </mat-card>
        </div>

        <!-- Seção de Prévia Interativa -->
        <mat-card class="preview-card">
          <mat-card-header>
            <div class="preview-header">
              <div class="preview-title">
                <mat-icon>visibility</mat-icon>
                <h3>Prévia dos Dados Estruturados</h3>
              </div>
              <div class="preview-controls">
                <mat-form-field appearance="outline" class="density-compact search-field">
                  <mat-icon matPrefix>search</mat-icon>
                  <mat-label>Filtrar linhas...</mat-label>
                  <input
                    matInput
                    [ngModel]="filterText()"
                    (ngModelChange)="filterText.set($event)"
                    placeholder="ex: CIP, Torres, Escavação"
                  />
                </mat-form-field>
              </div>
            </div>
          </mat-card-header>

          <mat-tab-group
            [selectedIndex]="previewTabIndex()"
            (selectedIndexChange)="onTabChange($event)"
          >
            <!-- Tab: Planilha do Edital -->
            <mat-tab label="Planilha do Edital (CIP)">
              <div class="table-responsive">
                <table class="styled-table">
                  <thead>
                    <tr>
                      <th>Código CIP</th>
                      <th>Descrição do Item / Disciplina</th>
                      <th class="text-center">Unid.</th>
                      <th class="text-right">Quant.</th>
                      <th class="text-right">Custo Direto Unit. (R$)</th>
                      <th class="text-right">Custo Direto Total (R$)</th>
                      <th class="text-right">BDI (%)</th>
                      <th class="text-right">Preço Unit. Venda (R$)</th>
                      <th class="text-right">Preço Total Venda (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of filteredTenderRows(); track $index) {
                      <tr
                        [class.group-header-row]="row.level === 1 || !row.cipCode"
                        [class.total-summary-row]="row.isTotal"
                      >
                        <td class="font-mono text-center">{{ row.cipCode }}</td>
                        <td [style.padding-left.px]="(row.level || 1) * 12">{{ row.description }}</td>
                        <td class="text-center">{{ row.unit }}</td>
                        <td class="text-right">{{ formatNumber(row.quantity) }}</td>
                        <td class="text-right">{{ formatCurrency(row.directUnitCost) }}</td>
                        <td class="text-right">{{ formatCurrency(row.directTotalCost) }}</td>
                        <td class="text-right font-semibold">{{ row.bdiRate ? row.bdiRate + '%' : '' }}</td>
                        <td class="text-right">{{ formatCurrency(row.unitPrice) }}</td>
                        <td class="text-right font-bold">{{ formatCurrency(row.totalPrice) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-tab>

            <!-- Tab: Folha de Medição Contratual -->
            <mat-tab label="Folha de Medição & PUs">
              <div class="table-responsive">
                <table class="styled-table">
                  <thead>
                    <tr>
                      <th>Código Item</th>
                      <th>Disciplina Contratual</th>
                      <th>Descrição do Serviço / Medição</th>
                      <th class="text-center">Unid.</th>
                      <th class="text-right">Qtd. Contratual</th>
                      <th>Critério de Medição em Campo</th>
                      <th class="text-right">Preço Unitário (R$)</th>
                      <th class="text-right">Total Contratual (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of filteredMeasurementRows(); track item.itemCode) {
                      <tr>
                        <td class="font-mono text-center font-bold">{{ item.itemCode }}</td>
                        <td><span class="discipline-tag">{{ item.discipline }}</span></td>
                        <td>{{ item.description }}</td>
                        <td class="text-center">{{ item.unit }}</td>
                        <td class="text-right">{{ formatNumber(item.contractQuantity) }}</td>
                        <td class="criteria-cell">{{ item.measurementCriteria }}</td>
                        <td class="text-right">{{ formatCurrency(item.unitPriceWithTax) }}</td>
                        <td class="text-right font-bold">{{ formatCurrency(item.totalContractPrice) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-tab>

            <!-- Tab: Cronograma de Faturamento -->
            <mat-tab label="Cronograma de Faturamento & Curva S">
              <div class="table-responsive">
                <table class="styled-table">
                  <thead>
                    <tr>
                      <th class="text-center">Mês</th>
                      <th>Período</th>
                      <th class="text-right">Desembolso Suprimentos (R$)</th>
                      <th class="text-right">Desembolso Serviços (R$)</th>
                      <th class="text-right">Desembolso Indiretos (R$)</th>
                      <th class="text-right">Desembolso Total (R$)</th>
                      <th class="text-right">Desembolso Acumulado (R$)</th>
                      <th class="text-right">Faturamento Mensal (R$)</th>
                      <th class="text-right">Faturamento Acumulado (R$)</th>
                      <th class="text-right">Saldo Líquido (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (m of filteredCashflowRows(); track m.monthIndex) {
                      <tr [class.peak-exposure-row]="m.isPeakExposure">
                        <td class="text-center font-bold">{{ m.monthIndex }}</td>
                        <td>
                          {{ m.monthLabel }}
                          @if (m.isPeakExposure) {
                            <span class="peak-badge">PICO DE CAIXA</span>
                          }
                        </td>
                        <td class="text-right">{{ formatCurrency(m.suppliesDisbursement) }}</td>
                        <td class="text-right">{{ formatCurrency(m.servicesDisbursement) }}</td>
                        <td class="text-right">{{ formatCurrency(m.indirectDisbursement) }}</td>
                        <td class="text-right font-semibold">{{ formatCurrency(m.monthlyTotalDisbursement) }}</td>
                        <td class="text-right">{{ formatCurrency(m.accumulatedDisbursement) }}</td>
                        <td class="text-right font-semibold text-green">{{ formatCurrency(m.monthlyBilling) }}</td>
                        <td class="text-right">{{ formatCurrency(m.accumulatedBilling) }}</td>
                        <td
                          class="text-right font-bold"
                          [class.text-negative]="isNegative(m.netCashflow)"
                          [class.text-positive]="!isNegative(m.netCashflow)"
                        >
                          {{ formatCurrency(m.netCashflow) }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      .export-center-container {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .header-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px 24px;
        color: #ffffff;
      }

      .header-title {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .icon-badge {
        width: 48px;
        height: 48px;
        border-radius: 10px;
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .header-title h2 {
        margin: 0 0 4px 0;
        font-size: 1.4rem;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      .subtitle {
        margin: 0;
        color: #94a3b8;
        font-size: 0.9rem;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 0;
        color: #64748b;
        gap: 16px;
      }

      .benchmarking-card {
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        padding: 20px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .accent-icon {
        color: #2563eb;
      }

      .section-title h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #1e293b;
      }

      .total-chip {
        font-weight: 600;
        background: #eff6ff !important;
        color: #1d4ed8 !important;
      }

      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 14px;
      }

      .kpi-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        transition: transform 0.2s ease;
      }

      .kpi-card:hover {
        transform: translateY(-2px);
      }

      .highlight-blue {
        border-left: 4px solid #2563eb;
        background: #f0f7ff;
      }

      .highlight-green {
        border-left: 4px solid #16a34a;
        background: #f0fdf4;
      }

      .kpi-label {
        font-size: 0.8rem;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
      }

      .kpi-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: #0f172a;
      }

      .kpi-sub {
        font-size: 0.75rem;
        color: #94a3b8;
      }

      .export-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
      }

      .export-card {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .card-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
      }

      .blue-bg {
        background: #dbeafe;
        color: #1e40af;
      }

      .green-bg {
        background: #dcfce7;
        color: #15803d;
      }

      .orange-bg {
        background: #ffedd5;
        color: #c2410c;
      }

      .purple-bg {
        background: #f3e8ff;
        color: #7e22ce;
      }

      .card-desc {
        color: #475569;
        font-size: 0.88rem;
        line-height: 1.4;
        margin: 12px 0;
      }

      .card-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
      }

      .tag-badge {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        color: #475569;
      }

      .exposure-highlight {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        color: #9a3412;
        padding: 8px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
      }

      .full-width {
        width: 100%;
      }

      .action-btn {
        height: 42px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .orange-btn {
        background: #ea580c !important;
        color: #ffffff !important;
      }

      .purple-btn {
        background: #7c3aed !important;
        color: #ffffff !important;
      }

      .inline-spinner {
        margin-right: 8px;
      }

      .preview-card {
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }

      .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 8px 0;
      }

      .preview-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #1e293b;
      }

      .preview-title h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
      }

      .search-field {
        width: 260px;
      }

      .table-responsive {
        overflow-x: auto;
        margin-top: 12px;
      }

      .styled-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.88rem;
        color: #1e293b;
      }

      .styled-table th {
        background: #f8fafc;
        color: #475569;
        font-weight: 600;
        padding: 10px 12px;
        border-bottom: 2px solid #e2e8f0;
        white-space: nowrap;
      }

      .styled-table td {
        padding: 8px 12px;
        border-bottom: 1px solid #e2e8f0;
        white-space: nowrap;
      }

      .group-header-row {
        background: #f1f5f9;
        font-weight: 700;
      }

      .total-summary-row {
        background: #dbeafe;
        font-weight: 700;
      }

      .peak-exposure-row {
        background: #fef2f2;
      }

      .peak-badge {
        background: #ef4444;
        color: white;
        font-size: 0.65rem;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: 6px;
        font-weight: 700;
      }

      .discipline-tag {
        background: #e0f2fe;
        color: #0369a1;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .criteria-cell {
        white-space: normal;
        max-width: 300px;
        font-size: 0.8rem;
        color: #64748b;
      }

      .font-mono {
        font-family: monospace;
      }

      .font-semibold {
        font-weight: 600;
      }

      .font-bold {
        font-weight: 700;
      }

      .text-center {
        text-align: center;
      }

      .text-right {
        text-align: right;
      }

      .text-green {
        color: #16a34a;
      }

      .text-negative {
        color: #dc2626;
      }

      .text-positive {
        color: #16a34a;
      }
    `,
  ],
})
export class OfferExportComponent implements OnInit {
  private readonly exportApi = inject(ExportApiService);

  readonly offerId = input.required<number>();
  readonly offerName = input<string>('');

  readonly selectedLayout = signal<TenderSheetLayout>('ANEEL_STANDARD');
  readonly indicators = signal<PerformanceIndicatorsSummary | null>(null);
  readonly tenderData = signal<TenderSheetExportData | null>(null);
  readonly measurementData = signal<MeasurementSheetExportData | null>(null);
  readonly cashflowData = signal<CashflowExportData | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isDownloading = signal<string | null>(null);
  readonly previewTabIndex = signal<number>(0);
  readonly filterText = signal<string>('');

  readonly filteredTenderRows = computed(() => {
    const data = this.tenderData();
    if (!data) return [];
    const query = this.filterText().toLowerCase().trim();
    if (!query) return data.rows;
    return data.rows.filter(
      (r) =>
        r.description.toLowerCase().includes(query) ||
        r.cipCode.toLowerCase().includes(query) ||
        (r.group && r.group.toLowerCase().includes(query)),
    );
  });

  readonly filteredMeasurementRows = computed(() => {
    const data = this.measurementData();
    if (!data) return [];
    const query = this.filterText().toLowerCase().trim();
    if (!query) return data.items;
    return data.items.filter(
      (item) =>
        item.description.toLowerCase().includes(query) ||
        item.itemCode.toLowerCase().includes(query) ||
        item.discipline.toLowerCase().includes(query),
    );
  });

  readonly filteredCashflowRows = computed(() => {
    const data = this.cashflowData();
    if (!data) return [];
    const query = this.filterText().toLowerCase().trim();
    if (!query) return data.months;
    return data.months.filter(
      (m) =>
        m.monthLabel.toLowerCase().includes(query) ||
        String(m.monthIndex).includes(query),
    );
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    const id = this.offerId();
    if (!id) return;

    this.isLoading.set(true);

    this.exportApi.getPerformanceIndicators(id).subscribe({
      next: (res) => this.indicators.set(res),
      error: () => {},
    });

    this.exportApi.getTenderSheetData(id, this.selectedLayout()).subscribe({
      next: (res) => this.tenderData.set(res),
      error: () => {},
    });

    this.exportApi.getMeasurementSheetData(id).subscribe({
      next: (res) => this.measurementData.set(res),
      error: () => {},
    });

    this.exportApi.getCashflowExportData(id).subscribe({
      next: (res) => {
        this.cashflowData.set(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onLayoutChange(layout: TenderSheetLayout): void {
    this.selectedLayout.set(layout);
    const id = this.offerId();
    if (id) {
      this.exportApi.getTenderSheetData(id, layout).subscribe({
        next: (res) => this.tenderData.set(res),
      });
    }
  }

  onTabChange(index: number): void {
    this.previewTabIndex.set(index);
  }

  downloadTenderSheet(): void {
    const id = this.offerId();
    this.isDownloading.set('tender');
    this.exportApi.downloadTenderSheet(id, this.selectedLayout()).subscribe({
      next: (blob) => {
        const filename = `Planilha_Precos_Edital_Oferta_${id}_${this.selectedLayout()}.xlsx`;
        this.exportApi.saveBlob(blob, filename);
        this.isDownloading.set(null);
      },
      error: () => this.isDownloading.set(null),
    });
  }

  downloadMeasurementSheet(): void {
    const id = this.offerId();
    this.isDownloading.set('measurement');
    this.exportApi.downloadMeasurementSheet(id).subscribe({
      next: (blob) => {
        const filename = `Folha_Medicao_Contratual_Oferta_${id}.xlsx`;
        this.exportApi.saveBlob(blob, filename);
        this.isDownloading.set(null);
      },
      error: () => this.isDownloading.set(null),
    });
  }

  downloadCashflowSheet(): void {
    const id = this.offerId();
    this.isDownloading.set('cashflow');
    this.exportApi.downloadCashflowSheet(id).subscribe({
      next: (blob) => {
        const filename = `Cronograma_Faturamento_Desembolso_Oferta_${id}.xlsx`;
        this.exportApi.saveBlob(blob, filename);
        this.isDownloading.set(null);
      },
      error: () => this.isDownloading.set(null),
    });
  }

  downloadFullPackageJson(): void {
    const id = this.offerId();
    this.isDownloading.set('json');
    this.exportApi.getFullOfferPackage(id).subscribe({
      next: (pkg) => {
        const filename = `Pacote_Integral_Oferta_${id}.json`;
        this.exportApi.saveJson(pkg, filename);
        this.isDownloading.set(null);
      },
      error: () => this.isDownloading.set(null),
    });
  }

  formatCurrency(value?: string | number): string {
    const num = Number(value) || 0;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatNumber(value?: string | number): string {
    const num = Number(value) || 0;
    if (num === 0) return '-';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  isNegative(value?: string): boolean {
    return (Number(value) || 0) < 0;
  }
}
