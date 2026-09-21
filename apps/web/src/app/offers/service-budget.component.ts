import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ServiceBudgetSummary,
  ServiceBudgetItem,
  ServiceGroup,
} from '@lt-offers/domain';
import { ServiceBudgetApiService } from './service-budget-api.service';

export const SERVICE_GROUP_LABELS: Record<ServiceGroup, string> = {
  PRELIMINARY_WORKS: 'Obras Preliminares e Acessos',
  CIVIL_WORKS: 'Obras Civis e Fundações',
  ASSEMBLY_WORKS: 'Montagem Eletromecânica de Estruturas',
  STRINGING_WORKS: 'Lançamento de Cabos Condutores e OPGW',
  COMMISSIONING: 'Comissionamento e Energização',
  INDIRECTS_SUPPORT: 'Apoio de Canteiros e Gestão de Campo',
};

@Component({
  selector: 'app-service-budget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="services-container">
      <!-- Header -->
      <div class="header-section">
        <div>
          <div class="subtitle-badge">Fase F5 · Módulo M09 (RF-46..RF-50)</div>
          <h2 class="title">
            Orçamento de Serviços e Folhas Contratuais (CIP)
          </h2>
          <p class="description">
            Consolidação analítica de serviços de transmissão por código CIP,
            origens de custo, BDI e indicadores paramétricos.
          </p>
        </div>

        <div class="header-actions">
          @if (lines && lines.length > 0) {
            <div class="line-selector-box">
              <label class="control-label" for="service-line-select"
                >Linha de Transmissão:</label
              >
              <select
                id="service-line-select"
                class="form-select"
                [ngModel]="selectedLineId()"
                (ngModelChange)="onLineChange($event)"
              >
                @for (l of lines; track l.id) {
                  <option [value]="l.id">
                    {{ l.name || 'LT ' + l.id }}
                  </option>
                }
              </select>
            </div>
          }

          <button
            type="button"
            class="btn btn-primary"
            [disabled]="loading()"
            (click)="loadBudget()"
          >
            <span class="icon">🔄</span>
            Recalcular Serviços
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-panel">
          <div class="spinner"></div>
          <span
            >Consolidando orçamento de serviços e aplicando regras de
            BDI...</span
          >
        </div>
      }

      <!-- Error State -->
      @if (errorMessage()) {
        <div class="error-panel">
          <span>⚠️ {{ errorMessage() }}</span>
        </div>
      }

      @if (!loading() && budget(); as b) {
        <!-- KPIs Principais -->
        <div class="kpis-grid">
          <div class="kpi-card">
            <div class="kpi-label">Custo Direto de Serviços</div>
            <div class="kpi-value">{{ formatCurrency(b.totalDirectCost) }}</div>
            <div class="kpi-subtext">Base de produção de campo</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Preço de Venda Contratual</div>
            <div class="kpi-value highlight">
              {{ formatCurrency(b.totalSalePrice) }}
            </div>
            <div class="kpi-subtext">Com BDI aplicado (RF-47)</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Ratio por Extensão</div>
            <div class="kpi-value">
              {{ formatCurrency(b.ratios.costPerKm) }}
              <span class="unit">/ km</span>
            </div>
            <div class="kpi-subtext">
              Venda: {{ formatCurrency(b.ratios.salePricePerKm) }}/km
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Ratio por Estrutura</div>
            <div class="kpi-value highlight-green">
              {{ formatCurrency(b.ratios.costPerTower) }}
              <span class="unit">/ torre</span>
            </div>
            <div class="kpi-subtext">
              Venda: {{ formatCurrency(b.ratios.salePricePerTower) }}/torre
            </div>
          </div>
        </div>

        <!-- Sub-navegação: BoQ CIP vs Folha PU1 -->
        <div class="subtab-selector-bar">
          <button
            type="button"
            class="subtab-btn"
            [class.active]="activeSubTab() === 'BOQ_CIP'"
            (click)="activeSubTab.set('BOQ_CIP')"
          >
            📋 BoQ CIP Analítico do Edital (RF-46)
          </button>
          <button
            type="button"
            class="subtab-btn"
            [class.active]="activeSubTab() === 'PU_VARIATIONS'"
            (click)="activeSubTab.set('PU_VARIATIONS')"
          >
            📊 Folha de Variações de Preço Unitário (Aba PU1 / RF-48)
          </button>
        </div>

        @if (activeSubTab() === 'BOQ_CIP') {
          <!-- Filtro por Grupo de Serviço -->
          <div class="filter-bar">
            <button
              type="button"
              class="filter-chip"
              [class.active]="selectedGroup() === 'ALL'"
              (click)="setGroup('ALL')"
            >
              Todos os Grupos ({{ b.items.length }})
            </button>
            @for (g of serviceGroups; track g) {
              <button
                type="button"
                class="filter-chip"
                [class.active]="selectedGroup() === g"
                (click)="setGroup(g)"
              >
                {{ getGroupLabel(g) }}
              </button>
            }
          </div>

          <!-- Tabela de Orçamento de Serviços -->
          <div class="table-card">
            <div class="table-header">
              <h3 class="table-title">
                Composição Analítica e Código CIP do Edital (RF-46..RF-48)
              </h3>
              <span class="badge badge-info"
                >{{ filteredItems().length }} itens listados</span
              >
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descrição do Serviço</th>
                    <th>Cód. CIP</th>
                    <th>Origem do Custo</th>
                    <th class="text-right">Quantidade</th>
                    <th class="text-center">Unidade</th>
                    <th class="text-right">Custo Unitário</th>
                    <th class="text-right">Custo Total</th>
                    <th class="text-center">BDI (%)</th>
                    <th class="text-right">Preço Unit. Venda</th>
                    <th class="text-right">Preço Total Venda</th>
                  </tr>
                </thead>

              <tbody>
                @for (item of filteredItems(); track item.id) {
                  <tr>
                    <td class="font-mono text-muted">{{ item.code }}</td>
                    <td class="font-bold">
                      {{ item.name }}
                      @if (item.notes) {
                        <div class="item-notes">{{ item.notes }}</div>
                      }
                    </td>
                    <td>
                      <span class="cip-badge">{{
                        item.cipCode || 'S/ CIP'
                      }}</span>
                    </td>
                    <td>
                      <span
                        class="badge"
                        [ngClass]="{
                          'badge-primary':
                            item.costSource === 'SCHEDULE_DIRECT',
                          'badge-warning':
                            item.costSource === 'PARAMETRIC_ADJUSTED',
                          'badge-success':
                            item.costSource === 'SUBCONTRACT_QUOTED',
                        }"
                      >
                        {{ getCostSourceLabel(item.costSource) }}
                      </span>
                    </td>
                    <td class="text-right font-mono">{{ item.quantity }}</td>
                    <td class="text-center font-mono">{{ item.unit }}</td>
                    <td class="text-right font-mono">
                      {{ formatCurrency(item.unitDirectCost) }}
                    </td>
                    <td class="text-right font-mono font-bold">
                      {{ formatCurrency(item.totalDirectCost) }}
                    </td>
                    <td class="text-center font-mono">
                      {{ item.bdiPercentage }}%
                    </td>
                    <td class="text-right font-mono">
                      {{ formatCurrency(item.unitSalePrice) }}
                    </td>
                    <td class="text-right font-mono font-bold highlight-text">
                      {{ formatCurrency(item.totalSalePrice) }}
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="7" class="text-right font-bold">
                    TOTAL CONSOLIDADO DE SERVIÇOS:
                  </td>
                  <td class="text-right font-bold font-mono">
                    {{ formatCurrency(b.totalDirectCost) }}
                  </td>
                  <td></td>
                  <td></td>
                  <td class="text-right font-bold font-mono highlight-text">
                    {{ formatCurrency(b.totalSalePrice) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

          <!-- Resumo por Grupo -->
          <div class="groups-summary-grid">
            @for (g of serviceGroups; track g) {
              <div class="group-summary-card">
                <div class="group-name">{{ getGroupLabel(g) }}</div>
                <div class="group-costs">
                  <div class="cost-row">
                    <span>Custo Direto:</span>
                    <strong>{{
                      formatCurrency(b.byGroup[g].totalDirectCost)
                    }}</strong>
                  </div>
                  <div class="cost-row">
                    <span>Preço Venda:</span>
                    <strong class="highlight-green">{{
                      formatCurrency(b.byGroup[g].totalSalePrice)
                    }}</strong>
                  </div>
                  <div class="cost-row sub-row">
                    <span>Ratio/km:</span>
                    <span>{{ formatCurrency(b.byGroup[g].costPerKm) }}/km</span>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- TABELA: FOLHA DE VARIAÇÕES DE PREÇO UNITÁRIO (Inspirada na sheet PU1) -->
          <div class="table-card">
            <div class="table-header">
              <div>
                <h3 class="table-title">
                  Folha de Variações de Preços Unitários Contratuais (Aba PU1 / RF-48)
                </h3>
                <p class="table-subtitle">
                  Preços unitários contratuais de venda com BDI aplicados para aditivos e medições de campo.
                </p>
              </div>
              <span class="badge badge-info">Tabela Contratual PU1</span>
            </div>

            <div class="table-responsive">
              <table class="data-table multi-tier-table">
                <thead>
                  <tr class="header-level-1">
                    <th colspan="2" class="group-header group-dark">ITEM / DISCIPLINA CONTRATUAL</th>
                    <th colspan="2" class="group-header group-blue text-center">QUANTITATIVO CONTRATADO</th>
                    <th colspan="2" class="group-header group-green text-center">PREÇO DE VENDA (BDI INCLUSO)</th>
                    <th class="group-header group-action text-center">OBSERVAÇÕES</th>
                  </tr>
                  <tr class="header-level-2">
                    <th>Item</th>
                    <th>Descrição do Serviço / Medição</th>
                    <th class="text-center">Unid.</th>
                    <th class="text-right">Qtd. Contrato</th>
                    <th class="text-right">Preço Unitário (R$)</th>
                    <th class="text-right">Total Contrato (R$)</th>
                    <th>Critério de Medição</th>
                  </tr>
                </thead>
                <tbody>
                  @for (pu of puVariations; track pu.itemNumber) {
                    <tr [class.category-header-row]="pu.isHeader">
                      <td class="font-mono font-bold">{{ pu.itemNumber }}</td>
                      <td [class.font-bold]="pu.isHeader">{{ pu.description }}</td>
                      <td class="text-center font-mono">{{ pu.unit || '—' }}</td>
                      <td class="text-right font-mono">{{ pu.contractQty !== undefined ? (pu.contractQty | number: '1.2-2') : '—' }}</td>
                      <td class="text-right font-mono font-bold">{{ pu.unitPriceBrl !== undefined ? formatCurrency(pu.unitPriceBrl) : '—' }}</td>
                      <td class="text-right font-mono font-bold text-emerald-800">{{ pu.totalPriceBrl !== undefined ? formatCurrency(pu.totalPriceBrl) : '—' }}</td>
                      <td class="text-xs text-muted">{{ pu.criteria || '—' }}</td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="5" class="text-right font-bold">TOTAL GERAL FOLHA PU1:</td>
                    <td class="text-right font-mono font-bold text-emerald-800 font-lg">
                      {{ formatCurrency(totalPuContractValue) }}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .services-container {
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
      }
      .line-selector-box {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .control-label {
        font-size: 0.875rem;
        font-weight: 600;
        color: #334155;
      }
      .form-select {
        padding: 0.5rem 0.75rem;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 0.875rem;
        background-color: #ffffff;
        color: #0f172a;
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
      .filter-bar {
        display: flex;
        gap: 0.5rem;
        overflow-x: auto;
        padding-bottom: 0.25rem;
      }
      .filter-chip {
        padding: 0.4rem 0.85rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #475569;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s;
      }
      .filter-chip:hover {
        background: #f1f5f9;
      }
      .filter-chip.active {
        background: #0f172a;
        color: #ffffff;
        border-color: #0f172a;
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
      .text-center {
        text-align: center;
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
      .item-notes {
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 400;
        margin-top: 0.15rem;
      }
      .cip-badge {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        background: #f1f5f9;
        color: #334155;
        border-radius: 4px;
        font-family: ui-monospace, SFMono-Regular, monospace;
        font-weight: 600;
        font-size: 0.75rem;
      }
      .badge {
        display: inline-block;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      .badge-primary {
        background: #dbeafe;
        color: #1e40af;
      }
      .badge-warning {
        background: #fef3c7;
        color: #92400e;
      }
      .badge-success {
        background: #dcfce7;
        color: #166534;
      }
      .badge-info {
        background: #e0f2fe;
        color: #0369a1;
      }
      .groups-summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1rem;
      }
      .group-summary-card {
        background: #ffffff;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }
      .group-name {
        font-size: 0.85rem;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 0.75rem;
      }
      .group-costs {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        font-size: 0.8rem;
      }
      .cost-row {
        display: flex;
        justify-content: space-between;
        color: #475569;
      }
      .sub-row {
        font-size: 0.75rem;
        color: #94a3b8;
        border-top: 1px dashed #e2e8f0;
        padding-top: 0.35rem;
        margin-top: 0.25rem;
      }
    `,
  ],
})
export class ServiceBudgetComponent implements OnInit {
  @Input() offerId!: number;
  @Input() lineId?: number;
  @Input() lines: Array<{ id: number; name?: string }> = [];

  private readonly api = inject(ServiceBudgetApiService);

  selectedLineId = signal<number>(1);
  selectedGroup = signal<ServiceGroup | 'ALL'>('ALL');
  activeSubTab = signal<'BOQ_CIP' | 'PU_VARIATIONS'>('BOQ_CIP');
  budget = signal<ServiceBudgetSummary | null>(null);
  loading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  readonly serviceGroups: ServiceGroup[] = [
    'PRELIMINARY_WORKS',
    'CIVIL_WORKS',
    'ASSEMBLY_WORKS',
    'STRINGING_WORKS',
    'COMMISSIONING',
    'INDIRECTS_SUPPORT',
  ];

  readonly puVariations: Array<{
    itemNumber: string;
    description: string;
    unit?: string;
    contractQty?: number;
    unitPriceBrl?: number;
    totalPriceBrl?: number;
    isHeader?: boolean;
    criteria?: string;
  }> = [
    { itemNumber: '1.', description: 'ENGENHARIA E PROJETOS', isHeader: true },
    { itemNumber: '1.1', description: 'Projeto Básico de Linha de Transmissão', unit: 'gb', contractQty: 1, unitPriceBrl: 673389.95, totalPriceBrl: 673389.95, criteria: 'Aprovação ONS/Cliente' },
    { itemNumber: '1.2', description: 'Projeto Executivo de Traçado e Eletromecânico', unit: 'gb', contractQty: 1, unitPriceBrl: 3187938.39, totalPriceBrl: 3187938.39, criteria: 'Emissão para Construção (EPC)' },
    { itemNumber: '1.3', description: 'Engenharia e Detalhamento de Torres', unit: 'gb', contractQty: 7, unitPriceBrl: 170720.68, totalPriceBrl: 1195044.77, criteria: 'Protótipos e Listas de Corte' },
    { itemNumber: '1.4', description: 'Ensaio Mecânico de Cadeias de Isoladores', unit: 'ens', contractQty: 2, unitPriceBrl: 379723.71, totalPriceBrl: 759447.43, criteria: 'Relatório Aprovado em Laboratório' },
    { itemNumber: '2.', description: 'OBRAS CIVIS E INFRAESTRUTURA', isHeader: true },
    { itemNumber: '2.1', description: 'Abertura e Reabilitação de Acessos', unit: 'km', contractQty: 84.7, unitPriceBrl: 27500.0, totalPriceBrl: 2329250.0, criteria: 'Medição por km transitável' },
    { itemNumber: '2.2', description: 'Supressão Vegetal e Limpeza de Faixa', unit: 'ha', contractQty: 237.5, unitPriceBrl: 7500.0, totalPriceBrl: 1781250.0, criteria: 'Hectares liberados com ASV' },
    { itemNumber: '2.3', description: 'Escavação em Solo Comum / Rocha', unit: 'm³', contractQty: 12500.0, unitPriceBrl: 165.0, totalPriceBrl: 2062500.0, criteria: 'Volume in situ aferido' },
    { itemNumber: '2.4', description: 'Concreto Estrutural fck >= 25 MPa', unit: 'm³', contractQty: 4800.0, unitPriceBrl: 1420.0, totalPriceBrl: 6816000.0, criteria: 'Volume concretado com CP rompido' },
    { itemNumber: '3.', description: 'MONTAGEM ELETROMECÂNICA', isHeader: true },
    { itemNumber: '3.1', description: 'Montagem de Estruturas Autoportantes', unit: 'ton', contractQty: 3200.0, unitPriceBrl: 4850.0, totalPriceBrl: 15520000.0, criteria: 'Torre montada e verticalizada' },
    { itemNumber: '3.2', description: 'Montagem de Estruturas Estaiadas', unit: 'ton', contractQty: 2150.0, unitPriceBrl: 3950.0, totalPriceBrl: 8492500.0, criteria: 'Torre e estais tensionados' },
    { itemNumber: '4.', description: 'LANÇAMENTO DE CABOS', isHeader: true },
    { itemNumber: '4.1', description: 'Lançamento e Tensionamento de Cabos Condutores (Feixe 4x)', unit: 'km-fase', contractQty: 691.5, unitPriceBrl: 21500.0, totalPriceBrl: 14867250.0, criteria: 'Cabo grampeado na flecha de projeto' },
    { itemNumber: '4.2', description: 'Lançamento de Cabo OPGW / Para-raios', unit: 'km', contractQty: 230.5, unitPriceBrl: 12400.0, totalPriceBrl: 2858200.0, criteria: 'Fusões ópticas e atenuação aprovadas' },
  ];

  get totalPuContractValue(): number {
    return this.puVariations
      .filter((it) => !it.isHeader && it.totalPriceBrl)
      .reduce((acc, it) => acc + (it.totalPriceBrl || 0), 0);
  }

  ngOnInit(): void {
    if (this.lineId) {
      this.selectedLineId.set(this.lineId);
    } else if (this.lines && this.lines.length > 0) {
      this.selectedLineId.set(this.lines[0].id);
    }
    this.loadBudget();
  }

  onLineChange(newLineId: number): void {
    this.selectedLineId.set(newLineId);
    this.loadBudget();
  }

  setGroup(group: ServiceGroup | 'ALL'): void {
    this.selectedGroup.set(group);
  }

  loadBudget(): void {
    const id = this.selectedLineId();
    if (!id) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.api.getLineServiceBudget(id).subscribe({
      next: (data) => {
        this.budget.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erro ao carregar o orçamento de serviços.');
        this.loading.set(false);
      },
    });
  }

  filteredItems(): ServiceBudgetItem[] {
    const b = this.budget();
    if (!b) return [];
    const grp = this.selectedGroup();
    if (grp === 'ALL') return b.items;
    return b.items.filter((it) => it.group === grp);
  }

  getGroupLabel(g: ServiceGroup): string {
    return SERVICE_GROUP_LABELS[g] || g;
  }

  getCostSourceLabel(cs: string): string {
    switch (cs) {
      case 'SCHEDULE_DIRECT':
        return 'Cronograma Direto';
      case 'PARAMETRIC_ADJUSTED':
        return 'Paramétrico Ajustado';
      case 'SUBCONTRACT_QUOTED':
        return 'Subcontratado Cotado';
      default:
        return cs;
    }
  }

  formatCurrency(value?: string | number): string {
    if (value === undefined || value === null) return 'R$ 0,00';
    const num = Number(value);
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}

