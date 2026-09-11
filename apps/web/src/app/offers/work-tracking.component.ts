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
  ChangeOrderStatus,
  ChangeOrderType,
  ContractChangeOrder,
  CurrentWorkingEstimate,
  CurveSData,
  ErpIntegrationPackage,
  ErpTargetSystem,
  MonthlyProgressRecord,
  RecordMonthlyProgressPayload,
  WorkBaseline,
  WorkPackageCategory,
  WORK_PACKAGE_CATEGORY_LABELS,
  CHANGE_ORDER_TYPE_LABELS,
  CHANGE_ORDER_STATUS_LABELS,
  CURVE_S_STATUS_LABELS,
} from '@lt-offers/domain';
import { BaselineApiService } from './baseline-api.service';

@Component({
  selector: 'app-work-tracking',
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
    <div class="work-tracking-container">
      <!-- Cabeçalho Principal -->
      <div class="tracking-header">
        <div class="header-info">
          <div class="icon-badge">
            <mat-icon>insights</mat-icon>
          </div>
          <div>
            <h2>Ponte com a Execução & Acompanhamento de Obra (Fase F7)</h2>
            <p class="subtitle">
              Linha de Base Contratual Imutável (Data 0), Curva S (Previsto vs. Realizado), Análise de Valor Agregado (IDP/IDC), Aditivos e Carga ERP
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button mat-stroked-button color="primary" (click)="loadAllData()">
            <mat-icon>refresh</mat-icon>
            Atualizar
          </button>
          <button mat-flat-button color="accent" (click)="openFreezeModal()">
            <mat-icon>lock</mat-icon>
            Congelar Baseline Data 0
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Carregando dados da obra e processando Curva S...</p>
        </div>
      } @else {
        <!-- Linha de Base Data 0 Banner -->
        @if (baseline()) {
          <div class="baseline-banner">
            <div class="banner-title">
              <span class="badge-tag">DATA 0</span>
              <h3>{{ baseline()?.name }}</h3>
              <span class="status-chip active">STATUS: {{ baseline()?.status }}</span>
            </div>

            <div class="banner-grid">
              <div class="stat-box">
                <span class="label">Valor Contratual Vencedor</span>
                <span class="value">{{ formatCurrency(baseline()?.totalContractValue) }}</span>
              </div>
              <div class="stat-box">
                <span class="label">Custo Orçado da Linha</span>
                <span class="value">{{ formatCurrency(baseline()?.totalBudgetCost) }}</span>
              </div>
              <div class="stat-box">
                <span class="label">Margem Alvo Planejada</span>
                <span class="value highlight">{{ baseline()?.targetMarginPercent }}%</span>
              </div>
              <div class="stat-box">
                <span class="label">Prazo de Execução</span>
                <span class="value">{{ baseline()?.scheduleMonths }} Meses</span>
              </div>
              <div class="stat-box">
                <span class="label">Congelado Em</span>
                <span class="value small">{{ formatDate(baseline()?.frozenAt) }}</span>
              </div>
            </div>
          </div>
        }

        <!-- Cards de Indicadores de Valor Agregado (EVM) -->
        <div class="kpi-cards-grid">
          <div class="kpi-card" [class.danger]="isSpiLow()" [class.success]="!isSpiLow()">
            <div class="kpi-icon"><mat-icon>speed</mat-icon></div>
            <div class="kpi-content">
              <span class="kpi-label">SPI / IDP (Prazo)</span>
              <span class="kpi-value">{{ curveSData()?.currentSpi || '1.0000' }}</span>
              <span class="kpi-subtext">
                @if (isSpiLow()) {
                  <span class="text-danger">Atraso no cronograma físico</span>
                } @else {
                  <span class="text-success">Ritmo de avanço no prazo</span>
                }
              </span>
            </div>
          </div>

          <div class="kpi-card" [class.danger]="isCpiLow()" [class.success]="!isCpiLow()">
            <div class="kpi-icon"><mat-icon>account_balance_wallet</mat-icon></div>
            <div class="kpi-content">
              <span class="kpi-label">CPI / IDC (Custo)</span>
              <span class="kpi-value">{{ curveSData()?.currentCpi || '1.0000' }}</span>
              <span class="kpi-subtext">
                @if (isCpiLow()) {
                  <span class="text-danger">Sobrecusto na medição</span>
                } @else {
                  <span class="text-success">Dentro do orçamento previsto</span>
                }
              </span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon"><mat-icon>trending_up</mat-icon></div>
            <div class="kpi-content">
              <span class="kpi-label">Avanço Físico Realizado</span>
              <span class="kpi-value highlight">{{ curveSData()?.currentPhysicalProgressPercent || '0.00' }}%</span>
              <span class="kpi-subtext">Medição acumulada em campo</span>
            </div>
          </div>

          <div class="kpi-card highlight-card">
            <div class="kpi-icon"><mat-icon>auto_graph</mat-icon></div>
            <div class="kpi-content">
              <span class="kpi-label">CWE (Estimativa Corrente)</span>
              <span class="kpi-value">{{ formatCurrency(cweData()?.currentWorkingEstimateValue) }}</span>
              <span class="kpi-subtext">+{{ formatCurrency(cweData()?.totalApprovedAdditivesCost) }} em Aditivos</span>
            </div>
          </div>
        </div>

        <!-- Seção do Gráfico de Curva S -->
        <mat-card class="curve-s-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon color="primary">show_chart</mat-icon>
              Curva S de Acompanhamento Físico-Financeiro (Previsto vs. Agregado vs. Realizado)
            </mat-card-title>
            <mat-card-subtitle>
              Status Consolidado:
              <span class="status-pill" [class]="curveSData()?.statusSummary?.toLowerCase()">
                {{ getStatusLabel(curveSData()?.statusSummary) }}
              </span>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="chart-wrapper">
              <!-- Legenda Superior -->
              <div class="chart-legend">
                <div class="legend-item"><span class="legend-box pv"></span> Valor Planejado ($PV$ - Baseline)</div>
                <div class="legend-item"><span class="legend-box ev"></span> Valor Agregado ($EV$ - Físico Realizado)</div>
                <div class="legend-item"><span class="legend-box ac"></span> Custo Real ($AC$ - Medição Financeira)</div>
              </div>

              <!-- SVG Interativo da Curva S -->
              <div class="svg-container">
                <svg viewBox="0 0 900 320" class="curve-s-svg" preserveAspectRatio="none">
                  <!-- Grade de Fundo -->
                  <line x1="60" y1="40" x2="860" y2="40" stroke="#334155" stroke-dasharray="3,3" />
                  <line x1="60" y1="100" x2="860" y2="100" stroke="#334155" stroke-dasharray="3,3" />
                  <line x1="60" y1="160" x2="860" y2="160" stroke="#334155" stroke-dasharray="3,3" />
                  <line x1="60" y1="220" x2="860" y2="220" stroke="#334155" stroke-dasharray="3,3" />
                  <line x1="60" y1="280" x2="860" y2="280" stroke="#64748B" />

                  <!-- Eixos -->
                  <text x="15" y="45" fill="#94A3B8" font-size="11">100%</text>
                  <text x="15" y="105" fill="#94A3B8" font-size="11">75%</text>
                  <text x="15" y="165" fill="#94A3B8" font-size="11">50%</text>
                  <text x="15" y="225" fill="#94A3B8" font-size="11">25%</text>
                  <text x="25" y="285" fill="#94A3B8" font-size="11">0%</text>

                  <!-- Linha PV (Azul) -->
                  <polyline
                    fill="none"
                    stroke="#38BDF8"
                    stroke-width="3.5"
                    [attr.points]="pvPoints()"
                  />

                  <!-- Linha EV (Verde) -->
                  <polyline
                    fill="none"
                    stroke="#34D399"
                    stroke-width="3.5"
                    [attr.points]="evPoints()"
                  />

                  <!-- Linha AC (Laranja) -->
                  <polyline
                    fill="none"
                    stroke="#FB923C"
                    stroke-width="3"
                    stroke-dasharray="5,3"
                    [attr.points]="acPoints()"
                  />

                  <!-- Pontos Marcadores EV -->
                  @for (pt of evMarkerPoints(); track pt.x) {
                    <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="5" fill="#34D399" stroke="#0F172A" stroke-width="2" />
                  }
                </svg>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Abas Detalhadas de Gestão da Obra -->
        <mat-tab-group class="execution-tabs" animationDuration="200ms">
          <!-- Aba 1: EAP / WBS da Baseline -->
          <mat-tab label="Estrutura Analítica (EAP / WBS)">
            <div class="tab-content">
              <div class="table-header-bar">
                <h3>Pacotes de Trabalho da Baseline Data 0</h3>
                <span class="count-tag">{{ baseline()?.workPackages?.length || 0 }} Pacotes Contratados</span>
              </div>

              <table class="styled-table">
                <thead>
                  <tr>
                    <th>Código EAP</th>
                    <th>Descrição do Pacote de Trabalho</th>
                    <th>Categoria</th>
                    <th>Unid.</th>
                    <th class="text-right">Qtd. Planejada</th>
                    <th class="text-right">Custo Orçado (R$)</th>
                    <th class="text-right">Peso no Contrato (%)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (wp of baseline()?.workPackages; track wp.wbsCode) {
                    <tr>
                      <td class="code-cell">{{ wp.wbsCode }}</td>
                      <td><strong>{{ wp.name }}</strong></td>
                      <td><span class="category-chip">{{ getCategoryLabel(wp.category) }}</span></td>
                      <td>{{ wp.unit }}</td>
                      <td class="text-right">{{ wp.plannedQuantity }}</td>
                      <td class="text-right currency">{{ formatCurrency(wp.budgetedCost) }}</td>
                      <td class="text-right"><strong class="highlight-pct">{{ wp.weightPercent }}%</strong></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </mat-tab>

          <!-- Aba 2: Apontamento & Boletins de Medição -->
          <mat-tab label="Apontamento & Medições Mensais">
            <div class="tab-content">
              <div class="table-header-bar">
                <h3>Histórico de Boletins de Medição de Campo</h3>
                <button mat-flat-button color="primary" (click)="openProgressModal()">
                  <mat-icon>add</mat-icon>
                  Lançar Medição Mensal
                </button>
              </div>

              <table class="styled-table">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Período</th>
                    <th class="text-right">Avanço Físico Acumulado (%)</th>
                    <th class="text-right">Medição do Mês (R$)</th>
                    <th class="text-right">Valor Agregado EV (R$)</th>
                    <th class="text-right">Custo Real AC (R$)</th>
                    <th>Apontado Por</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  @for (rec of progressRecords(); track rec.monthNumber) {
                    <tr>
                      <td class="code-cell">Mês {{ rec.monthNumber }}</td>
                      <td>{{ rec.periodDate }}</td>
                      <td class="text-right"><strong>{{ rec.physicalProgressPercent }}%</strong></td>
                      <td class="text-right currency">{{ formatCurrency(rec.monthlyMeasuredAmount) }}</td>
                      <td class="text-right currency">{{ formatCurrency(rec.earnedValueCumulative) }}</td>
                      <td class="text-right currency">{{ formatCurrency(rec.actualCostCumulative) }}</td>
                      <td>{{ rec.createdBy }}</td>
                      <td class="notes-cell">{{ rec.notes || '-' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </mat-tab>

          <!-- Aba 3: Gestão de Aditivos & Pleitos (Change Orders) -->
          <mat-tab label="Aditivos & Pleitos (Change Orders)">
            <div class="tab-content">
              <div class="table-header-bar">
                <div>
                  <h3>Gestão de Ordens de Alteração Contratual (*Change Orders*)</h3>
                  <p class="sub">Projeção CWE: {{ formatCurrency(cweData()?.currentWorkingEstimateValue) }}</p>
                </div>
                <button mat-flat-button color="accent" (click)="openChangeOrderModal()">
                  <mat-icon>post_add</mat-icon>
                  Cadastrar Aditivo / Pleito
                </button>
              </div>

              <table class="styled-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Título / Descrição</th>
                    <th>Origem / Tipo</th>
                    <th>Status</th>
                    <th class="text-right">Valor Solicitado (R$)</th>
                    <th class="text-right">Valor Aprovado (R$)</th>
                    <th class="text-center">Prazo (Meses)</th>
                    <th class="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  @for (co of changeOrders(); track co.code) {
                    <tr>
                      <td class="code-cell">{{ co.code }}</td>
                      <td>
                        <strong>{{ co.title }}</strong>
                        <p class="subtext-table">{{ co.justification }}</p>
                      </td>
                      <td><span class="category-chip">{{ getChangeOrderTypeLabel(co.type) }}</span></td>
                      <td>
                        <span class="status-badge" [class]="co.status.toLowerCase()">
                          {{ getChangeOrderStatusLabel(co.status) }}
                        </span>
                      </td>
                      <td class="text-right currency">{{ formatCurrency(co.requestedCostDelta) }}</td>
                      <td class="text-right currency highlight">{{ formatCurrency(co.approvedCostDelta) }}</td>
                      <td class="text-center">+{{ co.scheduleDeltaMonths }}m</td>
                      <td class="text-center">
                        @if (co.status !== 'APPROVED') {
                          <button mat-icon-button color="primary" matTooltip="Aprovar Aditivo" (click)="approveChangeOrder(co)">
                            <mat-icon>check_circle</mat-icon>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </mat-tab>

          <!-- Aba 4: Integração ERP (SAP, TOTVS, Mega) -->
          <mat-tab label="Integração ERP">
            <div class="tab-content">
              <div class="table-header-bar">
                <div>
                  <h3>Exportação e Carga para ERPs Corporativos</h3>
                  <p class="sub">Geração de pacotes padronizados para SAP S/4HANA, TOTVS/RM e Sienge/Mega</p>
                </div>

                <div class="erp-actions">
                  <mat-form-field appearance="outline" class="system-select">
                    <mat-label>Sistema ERP Alvo</mat-label>
                    <mat-select [(ngModel)]="selectedErpSystem">
                      <mat-option value="SAP">SAP S/4HANA</mat-option>
                      <mat-option value="TOTVS_RM">TOTVS Linha RM</mat-option>
                      <mat-option value="MEGA_SIENGE">Mega / Sienge</mat-option>
                      <mat-option value="GENERIC_JSON">Universal JSON</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <button mat-stroked-button color="primary" (click)="downloadErpJson()">
                    <mat-icon>code</mat-icon>
                    Baixar JSON
                  </button>
                  <button mat-flat-button color="primary" (click)="downloadErpXlsx()">
                    <mat-icon>table_view</mat-icon>
                    Exportar XLSX para ERP
                  </button>
                </div>
              </div>

              <div class="erp-summary-card">
                <h4>Estrutura do Plano de Contas da Obra</h4>
                <p>O pacote contempla o mapeamento de Centros de Custo por trecho, contas contábeis do Razão e distribuição mensal físico-financeira.</p>
                <div class="erp-pills">
                  <span class="pill"><mat-icon>domain</mat-icon> Código Empresa: 1000 / COLIG-01</span>
                  <span class="pill"><mat-icon>layers</mat-icon> 7 Centros de Custo EAP</span>
                  <span class="pill"><mat-icon>calendar_today</mat-icon> 18 Meses de Distribuição</span>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      }

      <!-- Modal Simulado: Congelar Baseline -->
      @if (showFreezeModal()) {
        <div class="modal-overlay">
          <div class="modal-card">
            <h3>Congelar Linha de Base Contratual (Data 0)</h3>
            <p class="modal-desc">
              Esta ação tornará a revisão da proposta vencedora imutável e registrará a baseline contratual definitiva para medições e gestão de aditivos.
            </p>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notas Contratuais / Justificativa</mat-label>
              <textarea matInput [(ngModel)]="freezeNotes" rows="3"></textarea>
            </mat-form-field>

            <div class="modal-actions">
              <button mat-button (click)="closeFreezeModal()">Cancelar</button>
              <button mat-flat-button color="accent" (click)="confirmFreeze()">Confirmar Congelamento</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Simulado: Lançar Medição Mensal -->
      @if (showProgressModal()) {
        <div class="modal-overlay">
          <div class="modal-card">
            <h3>Lançar Boletim de Medição Mensal</h3>

            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Número do Mês</mat-label>
                <input matInput type="number" [(ngModel)]="newProgressMonth" min="1" max="36" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Período (YYYY-MM)</mat-label>
                <input matInput [(ngModel)]="newProgressPeriod" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Avanço Físico Acumulado (%)</mat-label>
                <input matInput [(ngModel)]="newProgressPercent" placeholder="ex: 25.50" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Valor Faturado/Medido no Mês (R$)</mat-label>
                <input matInput [(ngModel)]="newProgressMeasuredAmount" placeholder="ex: 8500000.00" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Observações do Diário de Obras</mat-label>
              <textarea matInput [(ngModel)]="newProgressNotes" rows="2"></textarea>
            </mat-form-field>

            <div class="modal-actions">
              <button mat-button (click)="closeProgressModal()">Cancelar</button>
              <button mat-flat-button color="primary" (click)="confirmProgressRecord()">Salvar Boletim</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Simulado: Cadastrar Aditivo -->
      @if (showChangeOrderModal()) {
        <div class="modal-overlay">
          <div class="modal-card">
            <h3>Cadastrar Ordem de Alteração Contratual (*Change Order*)</h3>

            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Código (ex: AD-04)</mat-label>
                <input matInput [(ngModel)]="newCoCode" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Origem / Tipo do Aditivo</mat-label>
                <mat-select [(ngModel)]="newCoType">
                  <mat-option value="GEOTECHNICAL_SOIL">Geotecnia / Solo Imprevisto</mat-option>
                  <mat-option value="ALIGNMENT_TOWER_RELOCATION">Realocação de Estruturas</mat-option>
                  <mat-option value="ENVIRONMENTAL_REQUISITION">Exigência Ambiental</mat-option>
                  <mat-option value="PRICE_READJUSTMENT">Reajuste de Preços</mat-option>
                  <mat-option value="SCOPE_ADDITION">Aditivo de Escopo</mat-option>
                  <mat-option value="OTHER">Outros Pleitos</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="span-2">
                <mat-label>Título do Pleito / Aditivo</mat-label>
                <input matInput [(ngModel)]="newCoTitle" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Valor Solicitado (R$)</mat-label>
                <input matInput [(ngModel)]="newCoRequestedDelta" placeholder="ex: 1200000.00" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Impacto em Prazo (Meses)</mat-label>
                <input matInput type="number" [(ngModel)]="newCoScheduleDelta" min="0" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Justificativa Técnica e Contratual</mat-label>
              <textarea matInput [(ngModel)]="newCoJustification" rows="2"></textarea>
            </mat-form-field>

            <div class="modal-actions">
              <button mat-button (click)="closeChangeOrderModal()">Cancelar</button>
              <button mat-flat-button color="accent" (click)="confirmCreateChangeOrder()">Cadastrar Aditivo</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .work-tracking-container {
      padding: 1.5rem;
      background: #0b1329;
      color: #e2e8f0;
      min-height: 100vh;
      font-family: 'Inter', -apple-system, sans-serif;
    }

    .tracking-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .icon-badge {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .header-info h2 {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .subtitle {
      margin: 0.25rem 0 0 0;
      font-size: 0.85rem;
      color: #94a3b8;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Baseline Banner */
    .baseline-banner {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
    }

    .banner-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .badge-tag {
      background: #3b82f6;
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .banner-title h3 {
      margin: 0;
      font-size: 1.15rem;
      color: #f1f5f9;
    }

    .status-chip.active {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid #10b981;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .banner-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }

    .stat-box {
      background: rgba(15, 23, 42, 0.6);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      flex-direction: column;
    }

    .stat-box .label {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-bottom: 0.25rem;
    }

    .stat-box .value {
      font-size: 1.15rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .stat-box .value.highlight {
      color: #38bdf8;
    }

    .stat-box .value.small {
      font-size: 0.85rem;
      color: #cbd5e1;
    }

    /* KPI Cards Grid */
    .kpi-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .kpi-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }

    .kpi-card.highlight-card {
      border-color: rgba(56, 189, 248, 0.4);
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
    }

    .kpi-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .kpi-content {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .kpi-value {
      font-size: 1.4rem;
      font-weight: 800;
      color: #f8fafc;
    }

    .kpi-value.highlight {
      color: #34d399;
    }

    .kpi-subtext {
      font-size: 0.75rem;
      margin-top: 2px;
    }

    .text-success {
      color: #34d399;
    }

    .text-danger {
      color: #f87171;
    }

    /* Curva S Card */
    .curve-s-card {
      background: rgba(30, 41, 59, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      margin-bottom: 1.5rem;
      padding: 1rem;
      color: #e2e8f0;
    }

    .status-pill {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 8px;
      margin-left: 0.5rem;
      text-transform: uppercase;
    }

    .status-pill.on_track {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }

    .status-pill.behind_schedule {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
    }

    .status-pill.critical_deviation {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    .chart-wrapper {
      margin-top: 1rem;
    }

    .chart-legend {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      margin-bottom: 1rem;
      font-size: 0.85rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .legend-box {
      width: 14px;
      height: 14px;
      border-radius: 3px;
    }

    .legend-box.pv { background: #38bdf8; }
    .legend-box.ev { background: #34d399; }
    .legend-box.ac { background: #fb923c; }

    .svg-container {
      width: 100%;
      height: 320px;
      background: rgba(15, 23, 42, 0.5);
      border-radius: 8px;
      padding: 10px;
    }

    .curve-s-svg {
      width: 100%;
      height: 100%;
    }

    /* Tabs & Tables */
    .execution-tabs {
      background: rgba(30, 41, 59, 0.6);
      border-radius: 12px;
      padding: 0.5rem;
    }

    .tab-content {
      padding: 1.5rem;
    }

    .table-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .table-header-bar h3 {
      margin: 0;
      font-size: 1.15rem;
      color: #f8fafc;
    }

    .table-header-bar .sub {
      margin: 0.25rem 0 0 0;
      font-size: 0.85rem;
      color: #94a3b8;
    }

    .count-tag {
      background: rgba(255, 255, 255, 0.08);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
    }

    .styled-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }

    .styled-table th {
      text-align: left;
      padding: 0.75rem 1rem;
      background: rgba(15, 23, 42, 0.7);
      color: #94a3b8;
      font-weight: 600;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .styled-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #e2e8f0;
    }

    .code-cell {
      font-family: monospace;
      font-weight: 700;
      color: #38bdf8;
    }

    .category-chip {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .status-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .status-badge.approved {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
    }

    .status-badge.submitted, .status-badge.draft {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
    }

    .currency {
      font-family: monospace;
      font-weight: 600;
    }

    .highlight-pct {
      color: #38bdf8;
    }

    .subtext-table {
      margin: 0.25rem 0 0 0;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }

    /* ERP Section */
    .erp-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .system-select {
      width: 220px;
    }

    .erp-summary-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 1.25rem;
      margin-top: 1rem;
    }

    .erp-pills {
      display: flex;
      gap: 1rem;
      margin-top: 0.75rem;
    }

    .pill {
      background: rgba(30, 41, 59, 0.8);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: #94a3b8;
    }

    /* Modal Overlay */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-card {
      background: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      width: 500px;
      max-width: 90vw;
      color: #f8fafc;
    }

    .modal-desc {
      font-size: 0.85rem;
      color: #94a3b8;
      margin-bottom: 1rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .span-2 {
      grid-column: span 2;
    }

    .full-width {
      width: 100%;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      gap: 1rem;
      color: #94a3b8;
    }
  `],
})
export class WorkTrackingComponent implements OnInit {
  private readonly baselineApi = inject(BaselineApiService);

  // Input do ID da oferta
  readonly offerId = input<number>(1);

  // Signals
  readonly loading = signal<boolean>(true);
  readonly baseline = signal<WorkBaseline | null>(null);
  readonly curveSData = signal<CurveSData | null>(null);
  readonly progressRecords = signal<MonthlyProgressRecord[]>([]);
  readonly changeOrders = signal<ContractChangeOrder[]>([]);
  readonly cweData = signal<CurrentWorkingEstimate | null>(null);

  // Modals state
  readonly showFreezeModal = signal<boolean>(false);
  readonly showProgressModal = signal<boolean>(false);
  readonly showChangeOrderModal = signal<boolean>(false);

  // Form fields
  freezeNotes = 'Linha de Base Contratual Data 0 congelada a partir da proposta vencedora.';
  newProgressMonth = 4;
  newProgressPeriod = '2026-04';
  newProgressPercent = '25.00';
  newProgressMeasuredAmount = '10000000.00';
  newProgressNotes = 'Avanço físico em fundações e montagem de estruturas.';

  newCoCode = 'AD-04';
  newCoType: ChangeOrderType = 'GEOTECHNICAL_SOIL';
  newCoTitle = 'Ajuste de fundação profunda em trecho de várzea';
  newCoRequestedDelta = '1250000.00';
  newCoScheduleDelta = 1;
  newCoJustification = 'Sondagens complementares demonstraram camada de argila mole de 12m.';

  selectedErpSystem: ErpTargetSystem = 'SAP';

  // SVG Points Computed
  readonly pvPoints = computed(() => {
    const series = this.curveSData()?.monthlySeries || [];
    if (series.length === 0) return '60,280 860,40';
    return series
      .map((s, idx) => {
        const x = 60 + (idx / (series.length - 1 || 1)) * 800;
        const progressPct = parseFloat(s.plannedValue) / (parseFloat(this.baseline()?.totalContractValue || '1') || 1);
        const y = 280 - Math.min(1, Math.max(0, progressPct)) * 240;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  readonly evPoints = computed(() => {
    const series = this.curveSData()?.monthlySeries || [];
    const validSeries = series.filter((s) => parseFloat(s.earnedValue) > 0);
    if (validSeries.length === 0) return '60,280';
    return validSeries
      .map((s, idx) => {
        const x = 60 + (idx / (series.length - 1 || 1)) * 800;
        const progressPct = parseFloat(s.earnedValue) / (parseFloat(this.baseline()?.totalContractValue || '1') || 1);
        const y = 280 - Math.min(1, Math.max(0, progressPct)) * 240;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  readonly acPoints = computed(() => {
    const series = this.curveSData()?.monthlySeries || [];
    const validSeries = series.filter((s) => parseFloat(s.actualCost) > 0);
    if (validSeries.length === 0) return '60,280';
    return validSeries
      .map((s, idx) => {
        const x = 60 + (idx / (series.length - 1 || 1)) * 800;
        const costPct = parseFloat(s.actualCost) / (parseFloat(this.baseline()?.totalContractValue || '1') || 1);
        const y = 280 - Math.min(1, Math.max(0, costPct)) * 240;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  readonly evMarkerPoints = computed(() => {
    const series = this.curveSData()?.monthlySeries || [];
    const validSeries = series.filter((s) => parseFloat(s.earnedValue) > 0);
    return validSeries.map((s, idx) => {
      const x = 60 + (idx / (series.length - 1 || 1)) * 800;
      const progressPct = parseFloat(s.earnedValue) / (parseFloat(this.baseline()?.totalContractValue || '1') || 1);
      const y = 280 - Math.min(1, Math.max(0, progressPct)) * 240;
      return { x, y };
    });
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading.set(true);
    const id = this.offerId() || 1;

    this.baselineApi.getBaseline(id).subscribe({
      next: (b) => {
        this.baseline.set(b);
        this.loadCurveSAndCwe(id, b.id);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private loadCurveSAndCwe(offerId: number, baselineId: number): void {
    this.baselineApi.getCurveS(offerId, baselineId).subscribe({
      next: (curve) => this.curveSData.set(curve),
    });

    this.baselineApi.listProgressRecords(offerId, baselineId).subscribe({
      next: (records) => this.progressRecords.set(records),
    });

    this.baselineApi.listChangeOrders(offerId, baselineId).subscribe({
      next: (orders) => this.changeOrders.set(orders),
    });

    this.baselineApi.getCurrentWorkingEstimate(offerId, baselineId).subscribe({
      next: (cwe) => {
        this.cweData.set(cwe);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  isSpiLow(): boolean {
    const spi = parseFloat(this.curveSData()?.currentSpi || '1.0');
    return spi < 0.95;
  }

  isCpiLow(): boolean {
    const cpi = parseFloat(this.curveSData()?.currentCpi || '1.0');
    return cpi < 0.95;
  }

  // Modals actions
  openFreezeModal(): void {
    this.showFreezeModal.set(true);
  }

  closeFreezeModal(): void {
    this.showFreezeModal.set(false);
  }

  confirmFreeze(): void {
    const id = this.offerId() || 1;
    this.baselineApi
      .freezeBaseline(id, {
        offerId: id,
        revisionId: 1,
        notes: this.freezeNotes,
      })
      .subscribe({
        next: (b) => {
          this.baseline.set(b);
          this.closeFreezeModal();
          this.loadAllData();
        },
      });
  }

  openProgressModal(): void {
    const nextMonth = (this.progressRecords().length || 0) + 1;
    this.newProgressMonth = nextMonth;
    this.newProgressPeriod = `2026-${nextMonth < 10 ? '0' + nextMonth : nextMonth}`;
    this.showProgressModal.set(true);
  }

  closeProgressModal(): void {
    this.showProgressModal.set(false);
  }

  confirmProgressRecord(): void {
    const bId = this.baseline()?.id || 1;
    const payload: RecordMonthlyProgressPayload = {
      baselineId: bId,
      monthNumber: this.newProgressMonth,
      periodDate: this.newProgressPeriod,
      physicalProgressPercent: this.newProgressPercent,
      monthlyMeasuredAmount: this.newProgressMeasuredAmount,
      notes: this.newProgressNotes,
      createdBy: 'engenheiro.campo@engevix.com.br',
    };

    this.baselineApi.recordMonthlyProgress(this.offerId() || 1, payload).subscribe({
      next: () => {
        this.closeProgressModal();
        this.loadAllData();
      },
    });
  }

  openChangeOrderModal(): void {
    this.showChangeOrderModal.set(true);
  }

  closeChangeOrderModal(): void {
    this.showChangeOrderModal.set(false);
  }

  confirmCreateChangeOrder(): void {
    const bId = this.baseline()?.id || 1;
    this.baselineApi
      .createChangeOrder(this.offerId() || 1, {
        baselineId: bId,
        code: this.newCoCode,
        title: this.newCoTitle,
        type: this.newCoType,
        requestedCostDelta: this.newCoRequestedDelta,
        scheduleDeltaMonths: this.newCoScheduleDelta,
        description: this.newCoTitle,
        justification: this.newCoJustification,
        createdBy: 'gestor.contrato@engevix.com.br',
      })
      .subscribe({
        next: () => {
          this.closeChangeOrderModal();
          this.loadAllData();
        },
      });
  }

  approveChangeOrder(co: ContractChangeOrder): void {
    if (!co.id) return;
    this.baselineApi
      .updateChangeOrder(this.offerId() || 1, co.id, {
        status: 'APPROVED',
        approvedCostDelta: co.requestedCostDelta,
        approvedBy: 'diretor.comercial@engevix.com.br',
      })
      .subscribe({
        next: () => this.loadAllData(),
      });
  }

  downloadErpJson(): void {
    this.baselineApi
      .generateErpPackageJson(this.offerId() || 1, {
        targetSystem: this.selectedErpSystem,
      })
      .subscribe({
        next: (pkg) => {
          const blob = new Blob([JSON.stringify(pkg, null, 2)], {
            type: 'application/json',
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Pacote_ERP_${this.selectedErpSystem}_Oferta_${this.offerId()}.json`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
      });
  }

  downloadErpXlsx(): void {
    this.baselineApi
      .exportErpPackageXlsx(this.offerId() || 1, {
        targetSystem: this.selectedErpSystem,
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Carga_ERP_${this.selectedErpSystem}_Oferta_${this.offerId()}.xlsx`;
          a.click();
          window.URL.revokeObjectURL(url);
        },
      });
  }

  // Helpers de formatação
  formatCurrency(val?: string | null): string {
    if (!val) return 'R$ 0,00';
    const num = parseFloat(val);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  }

  formatDate(iso?: string | null): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('pt-BR');
  }

  getCategoryLabel(cat: WorkPackageCategory): string {
    return WORK_PACKAGE_CATEGORY_LABELS[cat] || cat;
  }

  getChangeOrderTypeLabel(type: ChangeOrderType): string {
    return CHANGE_ORDER_TYPE_LABELS[type] || type;
  }

  getChangeOrderStatusLabel(status: ChangeOrderStatus): string {
    return CHANGE_ORDER_STATUS_LABELS[status] || status;
  }

  getStatusLabel(status?: string): string {
    return (status && (CURVE_S_STATUS_LABELS as any)[status]) || status || 'No Prazo';
  }
}
