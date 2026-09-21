import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  Input,
  OnChanges,
  OnInit,
  signal,
  SimpleChanges,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  FoundationMaterialFamily,
  FOUNDATION_MATERIAL_FAMILIES,
  FOUNDATION_MATERIAL_FAMILY_LABELS,
  FoundationMaterialItem,
  FoundationTraceabilityItem,
  LineFoundationSummary,
  SpecialCrossingItem,
  AccessOpeningItem,
  RightOfWayClearingItem,
} from '@lt-offers/domain';
import { FoundationsApi } from './foundations-api.service';

@Component({
  selector: 'app-foundation-quantities',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  template: `
    <div class="foundations-container">
      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="44"></mat-spinner>
          <p>Calculando quantitativos de engenharia e obras civis...</p>
        </div>
      }

      <!-- Error State -->
      @if (errorMessage() && !loading()) {
        <div class="error-banner">
          <mat-icon>error</mat-icon>
          <span>{{ errorMessage() }}</span>
          <button mat-stroked-button color="warn" (click)="loadData()">
            <mat-icon>refresh</mat-icon> Tentar novamente
          </button>
        </div>
      }

      @if (!loading() && summary()) {
        <div class="content-wrapper">
          <!-- Banner de Inconsistências / Combinações Pendentes (RF-20) -->
          @if (summary()!.missingCombinations.length > 0) {
            <div class="alert-box warning-box">
              <div class="alert-icon">
                <mat-icon>warning</mat-icon>
              </div>
              <div class="alert-content">
                <div class="alert-title">
                  Combinações de Fundação Pendentes no Catálogo
                </div>
                <div class="alert-desc">
                  Foram identificadas
                  <strong>{{ summary()!.missingCombinations.length }}</strong>
                  combinações sem matriz cadastrada no catálogo
                  <code>FoundationVolume</code>. Os quantitativos dessas
                  estruturas não foram somados silenciosamente.
                </div>
                <div class="missing-pills">
                  @for (
                    miss of summary()!.missingCombinations;
                    track miss.towerTypeId +
                      ':' +
                      miss.soilTypeId +
                      ':' +
                      miss.foundationTypeId
                  ) {
                    <span class="missing-pill">
                      Torre: {{ miss.towerCode || 'N/A' }} | Solo:
                      {{ miss.soilCode || 'N/A' }} | Fundação:
                      {{ miss.foundationCode || 'N/A' }} ({{
                        miss.affectedTowersCount
                      }}
                      estruturas)
                    </span>
                  }
                </div>
              </div>
            </div>
          }

          <!-- KPIs Cards -->
          <div class="kpis-grid">
            <div class="kpi-card excavation-kpi">
              <div class="kpi-icon-wrapper">
                <mat-icon>terrain</mat-icon>
              </div>
              <div class="kpi-data">
                <span class="kpi-label">Volume Total de Escavação</span>
                <div class="kpi-value-row">
                  <span class="kpi-val">{{
                    summary()!.kpis.totalExcavationM3
                  }}</span>
                  <span class="kpi-unit">m³</span>
                </div>
                <span class="kpi-sub">Com sobre-escavação (RN-12)</span>
              </div>
            </div>

            <div class="kpi-card concrete-kpi">
              <div class="kpi-icon-wrapper">
                <mat-icon>foundation</mat-icon>
              </div>
              <div class="kpi-data">
                <span class="kpi-label">Concreto Estrutural & Base</span>
                <div class="kpi-value-row">
                  <span class="kpi-val">{{
                    summary()!.kpis.totalConcreteM3
                  }}</span>
                  <span class="kpi-unit">m³</span>
                </div>
                <span class="kpi-sub">Inclui 5% de perda</span>
              </div>
            </div>

            <div class="kpi-card steel-kpi">
              <div class="kpi-icon-wrapper">
                <mat-icon>hardware</mat-icon>
              </div>
              <div class="kpi-data">
                <span class="kpi-label">Armadura de Aço Total</span>
                <div class="kpi-value-row">
                  <span class="kpi-val">{{
                    summary()!.kpis.totalSteelKg
                  }}</span>
                  <span class="kpi-unit">kg</span>
                </div>
                <span class="kpi-sub">Reforço (10%) e Tubulão (3%)</span>
              </div>
            </div>

            <div class="kpi-card backfill-kpi">
              <div class="kpi-icon-wrapper">
                <mat-icon>architecture</mat-icon>
              </div>
              <div class="kpi-data">
                <span class="kpi-label">Reaterro Compactado</span>
                <div class="kpi-value-row">
                  <span class="kpi-val">{{
                    summary()!.kpis.totalBackfillM3
                  }}</span>
                  <span class="kpi-unit">m³</span>
                </div>
                <span class="kpi-sub">Balanço escavação x concreto</span>
              </div>
            </div>
          </div>

          <!-- Seção de Tabelas por Família -->
          <div class="table-container-card">
            <div class="card-header-row">
              <div>
                <h2 class="section-title">
                  Memória de Quantitativos de Obras Civis
                </h2>
                <p class="section-subtitle">
                  Modo de cálculo:
                  <strong>{{
                    summary()!.calculationMode === 'STAKING_DETAILED'
                      ? 'Estaqueamento Real Torre a Torre'
                      : 'Distribuição Paramétrica Preliminar'
                  }}</strong>
                  | Estruturas processadas:
                  <strong
                    >{{ summary()!.calculatedTowers }} /
                    {{ summary()!.totalTowers }}</strong
                  >
                </p>
              </div>
              <button mat-stroked-button (click)="loadData()">
                <mat-icon>refresh</mat-icon> Recalcular
              </button>
            </div>

            <mat-tab-group
              animationDuration="250ms"
              [(selectedIndex)]="selectedFamilyIndex"
            >
              @for (family of families; track family) {
                <mat-tab [label]="familyLabels[family]">
                  <div class="tab-content">
                    <table
                      mat-table
                      [dataSource]="summary()!.materialsByFamily[family]"
                      class="quantities-table"
                    >
                      <!-- Código -->
                      <ng-container matColumnDef="code">
                        <th mat-header-cell *matHeaderCellDef>Código</th>
                        <td mat-cell *matCellDef="let item">
                          <span class="code-badge">{{ item.code }}</span>
                        </td>
                      </ng-container>

                      <!-- Descrição -->
                      <ng-container matColumnDef="name">
                        <th mat-header-cell *matHeaderCellDef>
                          Material / Serviço
                        </th>
                        <td
                          mat-cell
                          *matCellDef="let item"
                          class="material-name"
                        >
                          <strong>{{ item.name }}</strong>
                        </td>
                      </ng-container>

                      <!-- Unidade -->
                      <ng-container matColumnDef="unit">
                        <th mat-header-cell *matHeaderCellDef>Unid.</th>
                        <td mat-cell *matCellDef="let item">{{ item.unit }}</td>
                      </ng-container>

                      <!-- Quantidade Teórica -->
                      <ng-container matColumnDef="theoretical">
                        <th
                          mat-header-cell
                          *matHeaderCellDef
                          class="text-right"
                        >
                          Qtd. Teórica
                        </th>
                        <td
                          mat-cell
                          *matCellDef="let item"
                          class="text-right font-mono"
                        >
                          {{ item.theoreticalQuantity }}
                        </td>
                      </ng-container>

                      <!-- Fator de Desperdício/Sobre-escavação -->
                      <ng-container matColumnDef="wasteFactor">
                        <th
                          mat-header-cell
                          *matHeaderCellDef
                          class="text-right"
                        >
                          Perda / Sobre (%)
                        </th>
                        <td mat-cell *matCellDef="let item" class="text-right">
                          <span
                            [class.waste-badge]="+item.wasteFactorPercent > 0"
                          >
                            +{{ item.wasteFactorPercent }}%
                          </span>
                        </td>
                      </ng-container>

                      <!-- Volume de Perda/Sobre-escavação -->
                      <ng-container matColumnDef="waste">
                        <th
                          mat-header-cell
                          *matHeaderCellDef
                          class="text-right"
                        >
                          Acréscimo
                        </th>
                        <td
                          mat-cell
                          *matCellDef="let item"
                          class="text-right font-mono"
                        >
                          {{ item.wasteQuantity }}
                        </td>
                      </ng-container>

                      <!-- Total Final -->
                      <ng-container matColumnDef="total">
                        <th
                          mat-header-cell
                          *matHeaderCellDef
                          class="text-right"
                        >
                          Total Consolidado
                        </th>
                        <td
                          mat-cell
                          *matCellDef="let item"
                          class="text-right font-mono font-bold total-cell"
                        >
                          {{ item.totalQuantity }} {{ item.unit }}
                        </td>
                      </ng-container>

                      <!-- Ações / Rastreabilidade -->
                      <ng-container matColumnDef="actions">
                        <th
                          mat-header-cell
                          *matHeaderCellDef
                          class="text-center"
                        >
                          Memória
                        </th>
                        <td mat-cell *matCellDef="let item" class="text-center">
                          <button
                            mat-icon-button
                            color="primary"
                            matTooltip="Ver rastreabilidade torre a torre"
                            (click)="openTraceability(item)"
                          >
                            <mat-icon>insights</mat-icon>
                          </button>
                        </td>
                      </ng-container>

                      <tr
                        mat-header-row
                        *matHeaderRowDef="displayedColumns"
                      ></tr>
                      <tr
                        mat-row
                        *matRowDef="let row; columns: displayedColumns"
                        class="table-row"
                      ></tr>
                    </table>

                    @if (summary()!.materialsByFamily[family].length === 0) {
                      <div class="empty-tab">
                        <mat-icon>info</mat-icon>
                        <span>Nenhum material computado nesta categoria.</span>
                      </div>
                    }
                  </div>
                </mat-tab>
              }

              <!-- ABA ADICIONAL: TRAVESSIAS ESPECIAIS (Inspirada na sheet Travesias) -->
              <mat-tab label="Travessias Especiais (Travesias)">
                <div class="tab-content">
                  <div class="sub-tab-desc">
                    <p class="text-sm text-slate-600">
                      Relação de cruzamentos especiais cadastrados no traçado (rodovias federais/estaduais, ferrovias, rios navegáveis e outras linhas de transmissão), com medidas de segurança e proteções de rede.
                    </p>
                  </div>
                  <table class="quantities-table native-full-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Tipo de Obstáculo</th>
                        <th>Descrição da Travessia</th>
                        <th class="text-right">Vão de Cruzamento (m)</th>
                        <th>Requisito de Segurança / Proteção</th>
                        <th class="text-right">Custo Estimado (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (trv of specialCrossings; track trv.id) {
                        <tr>
                          <td><span class="code-badge">{{ trv.code }}</span></td>
                          <td><span class="meta-tag fnd-tag">{{ trv.crossingTypeName }}</span></td>
                          <td><strong>{{ trv.description }}</strong></td>
                          <td class="text-right font-mono">{{ trv.spanMeters }} m</td>
                          <td><span class="text-xs text-slate-600">{{ trv.safetyRequirement }}</span></td>
                          <td class="text-right font-mono font-bold text-emerald-800">
                            {{ trv.estimatedCostBrl | currency: 'BRL' : 'symbol' : '1.2-2' }}
                          </td>
                        </tr>
                      }
                    </tbody>
                    <tfoot>
                      <tr class="footer-summary-row">
                        <td colspan="5" class="font-bold">TOTAL DE TRAVESSIAS ESPECIAIS:</td>
                        <td class="text-right font-mono font-bold text-emerald-800">
                          {{ totalCrossingsCost | currency: 'BRL' : 'symbol' : '1.2-2' }}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </mat-tab>

              <!-- ABA ADICIONAL: ACESSOS & LIMPEZA DE FAIXA (Inspirada nas sheets Accesos & Limpieza) -->
              <mat-tab label="Acessos & Limpeza de Faixa (Accesos / Limpieza)">
                <div class="tab-content dual-tables-grid">
                  <!-- Tabela 1: Acessos -->
                  <div class="sub-table-card">
                    <h4 class="sub-table-title">🛣️ Abertura e Manutenção de Acessos (Accesos)</h4>
                    <table class="quantities-table native-full-table">
                      <thead>
                        <tr>
                          <th>Tipologia de Terreno</th>
                          <th class="text-right">Extensão (km)</th>
                          <th class="text-right">Custo Unit. (R$/km)</th>
                          <th class="text-right">Total (R$)</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (acc of accessOpenings; track acc.id) {
                          <tr>
                            <td><strong>{{ acc.terrainTypeName }}</strong></td>
                            <td class="text-right font-mono">{{ acc.lengthKm | number: '1.2-2' }} km</td>
                            <td class="text-right font-mono">{{ acc.unitCostPerKm | currency: 'BRL' : '' : '1.2-2' }}</td>
                            <td class="text-right font-mono font-bold text-slate-800">
                              {{ acc.totalCostBrl | currency: 'BRL' : 'symbol' : '1.2-2' }}
                            </td>
                          </tr>
                        }
                      </tbody>
                      <tfoot>
                        <tr class="footer-summary-row">
                          <td class="font-bold">Total Acessos:</td>
                          <td class="text-right font-mono font-bold">{{ totalAccessKm | number: '1.2-2' }} km</td>
                          <td></td>
                          <td class="text-right font-mono font-bold text-emerald-800">
                            {{ totalAccessCost | currency: 'BRL' : 'symbol' : '1.2-2' }}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <!-- Tabela 2: Limpeza de Faixa -->
                  <div class="sub-table-card">
                    <h4 class="sub-table-title">🌳 Supressão Vegetal e Limpeza de Faixa (Limpieza)</h4>
                    <table class="quantities-table native-full-table">
                      <thead>
                        <tr>
                          <th>Densidade de Vegetação</th>
                          <th class="text-right">Área (ha)</th>
                          <th class="text-right">Custo Unit. (R$/ha)</th>
                          <th class="text-right">Total (R$)</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (veg of vegetationClearings; track veg.id) {
                          <tr>
                            <td><strong>{{ veg.clearingTypeName }}</strong></td>
                            <td class="text-right font-mono">{{ veg.areaHectares | number: '1.2-2' }} ha</td>
                            <td class="text-right font-mono">{{ veg.unitCostPerHa | currency: 'BRL' : '' : '1.2-2' }}</td>
                            <td class="text-right font-mono font-bold text-slate-800">
                              {{ veg.totalCostBrl | currency: 'BRL' : 'symbol' : '1.2-2' }}
                            </td>
                          </tr>
                        }
                      </tbody>
                      <tfoot>
                        <tr class="footer-summary-row">
                          <td class="font-bold">Total Supressão:</td>
                          <td class="text-right font-mono font-bold">{{ totalClearingHa | number: '1.2-2' }} ha</td>
                          <td></td>
                          <td class="text-right font-mono font-bold text-emerald-800">
                            {{ totalClearingCost | currency: 'BRL' : 'symbol' : '1.2-2' }}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>
          </div>
        </div>
      }

      <!-- Drawer / Modal de Rastreabilidade (RF-27) -->
      @if (activeTraceability()) {
        <div class="traceability-backdrop">
          <div class="traceability-panel">
            <div class="panel-header">
              <div class="panel-title-group">
                <mat-icon class="panel-icon">schema</mat-icon>
                <div>
                  <h3 class="panel-title">
                    Memória de Cálculo: {{ activeTraceability()!.name }}
                  </h3>
                  <p class="panel-subtitle">
                    Total da Linha:
                    <strong
                      >{{ activeTraceability()!.totalQuantity }}
                      {{ activeTraceability()!.unit }}</strong
                    >
                    | Contribuição de
                    <strong>{{ activeTraceability()!.towersCount }}</strong>
                    estruturas
                  </p>
                </div>
              </div>
              <button mat-icon-button (click)="activeTraceability.set(null)">
                <mat-icon>close</mat-icon>
              </button>
            </div>

            <div class="panel-body">
              <table class="traceability-table">
                <thead>
                  <tr>
                    <th>Estrutura</th>
                    <th>Estaca</th>
                    <th>Tipo Torre</th>
                    <th>Tipo Solo</th>
                    <th>Fundação</th>
                    <th class="text-right">Unitário Teórico</th>
                    <th class="text-right">Perda / Sobre (%)</th>
                    <th class="text-right">Total Unitário</th>
                  </tr>
                </thead>
                <tbody>
                  @for (
                    t of activeTraceability()!.towerDetails;
                    track t.towerNumber + ':' + t.stationMeters
                  ) {
                    <tr>
                      <td>
                        <strong>{{ t.towerNumber }}</strong>
                      </td>
                      <td>{{ t.stationMeters }} m</td>
                      <td>
                        <span class="meta-tag">{{ t.towerCode }}</span>
                      </td>
                      <td>
                        <span class="meta-tag soil-tag">{{ t.soilCode }}</span>
                      </td>
                      <td>
                        <span class="meta-tag fnd-tag">{{
                          t.foundationCode
                        }}</span>
                      </td>
                      <td class="text-right font-mono">
                        {{ t.theoreticalUnit }}
                      </td>
                      <td class="text-right font-mono">
                        +{{ t.wastePercent }}%
                      </td>
                      <td class="text-right font-mono font-bold">
                        {{ t.totalUnit }} {{ activeTraceability()!.unit }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .foundations-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1rem 0;
      }

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3.5rem;
        gap: 1rem;
        color: #4b5563;
      }

      .error-banner {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.5rem;
        background: #fee2e2;
        border: 1px solid #f87171;
        border-radius: 8px;
        color: #991b1b;
      }

      .alert-box {
        display: flex;
        gap: 1rem;
        padding: 1rem 1.25rem;
        border-radius: 8px;
        margin-bottom: 1rem;
      }

      .warning-box {
        background: rgba(245, 158, 11, 0.08);
        border: 1px solid #f59e0b;
        color: #92400e;
      }

      .alert-title {
        font-weight: 600;
        font-size: 0.95rem;
      }

      .alert-desc {
        font-size: 0.85rem;
        margin-top: 0.25rem;
      }

      .missing-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }

      .missing-pill {
        display: inline-block;
        font-size: 0.75rem;
        padding: 0.2rem 0.6rem;
        background: #fef3c7;
        border: 1px solid #fcd34d;
        border-radius: 9999px;
        color: #78350f;
        font-weight: 500;
      }

      /* KPI Cards */
      .kpis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1rem;
      }

      .kpi-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.25rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease;
      }

      .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .kpi-icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .excavation-kpi .kpi-icon-wrapper {
        background: #fef3c7;
        color: #d97706;
      }
      .concrete-kpi .kpi-icon-wrapper {
        background: #e0e7ff;
        color: #4f46e5;
      }
      .steel-kpi .kpi-icon-wrapper {
        background: #f3e8ff;
        color: #7c3aed;
      }
      .backfill-kpi .kpi-icon-wrapper {
        background: #ecfdf5;
        color: #059669;
      }

      .kpi-label {
        font-size: 0.8rem;
        color: #6b7280;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }

      .kpi-value-row {
        display: flex;
        align-items: baseline;
        gap: 0.25rem;
        margin: 0.15rem 0;
      }

      .kpi-val {
        font-size: 1.45rem;
        font-weight: 700;
        color: #111827;
        font-family: monospace;
      }

      .kpi-unit {
        font-size: 0.9rem;
        color: #4b5563;
        font-weight: 600;
      }

      .kpi-sub {
        font-size: 0.75rem;
        color: #9ca3af;
      }

      /* Card de Tabelas */
      .table-container-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }

      .card-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #f3f4f6;
      }

      .section-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: #111827;
        margin: 0;
      }

      .section-subtitle {
        font-size: 0.85rem;
        color: #6b7280;
        margin: 0.25rem 0 0;
      }

      .tab-content {
        padding: 0.5rem 0;
      }

      .quantities-table {
        width: 100%;
      }

      .code-badge {
        font-family: monospace;
        font-size: 0.75rem;
        background: #f3f4f6;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        color: #374151;
        font-weight: 600;
      }

      .material-name {
        color: #1f2937;
        font-size: 0.9rem;
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

      .waste-badge {
        display: inline-block;
        font-size: 0.75rem;
        background: #fee2e2;
        color: #b91c1c;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        font-weight: 600;
      }

      .total-cell {
        color: #0f766e;
      }

      .table-row:hover {
        background-color: #f9fafb;
      }

      .empty-tab {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 2.5rem;
        justify-content: center;
        color: #9ca3af;
      }

      /* Modal / Drawer de Rastreabilidade */
      .traceability-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(2px);
      }

      .traceability-panel {
        background: #ffffff;
        border-radius: 12px;
        width: 90%;
        max-width: 960px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .panel-title-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .panel-icon {
        color: #4f46e5;
      }

      .panel-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: #111827;
        margin: 0;
      }

      .panel-subtitle {
        font-size: 0.8rem;
        color: #6b7280;
        margin: 0.15rem 0 0;
      }

      .panel-body {
        padding: 1rem 1.5rem;
        overflow-y: auto;
      }

      .traceability-table {
        width: 100%;
        border-collapse: collapse;
      }

      .traceability-table th {
        text-align: left;
        font-size: 0.75rem;
        text-transform: uppercase;
        color: #6b7280;
        padding: 0.75rem 0.5rem;
        border-bottom: 2px solid #e5e7eb;
      }

      .traceability-table td {
        padding: 0.6rem 0.5rem;
        border-bottom: 1px solid #f3f4f6;
        font-size: 0.85rem;
      }

      .meta-tag {
        font-size: 0.75rem;
        padding: 0.15rem 0.4rem;
        border-radius: 4px;
        background: #f3f4f6;
        color: #374151;
        font-weight: 500;
      }
      .soil-tag {
        background: #fef3c7;
        color: #92400e;
      }
      .fnd-tag {
        background: #e0e7ff;
        color: #3730a3;
      }
    `,
  ],
})
export class FoundationQuantitiesComponent implements OnInit, OnChanges {
  @Input({ required: true }) lineId!: number;

  private readonly api = inject(FoundationsApi);

  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly summary = signal<LineFoundationSummary | null>(null);
  readonly activeTraceability = signal<FoundationTraceabilityItem | null>(null);

  readonly families: FoundationMaterialFamily[] = [
    ...FOUNDATION_MATERIAL_FAMILIES,
  ];
  readonly familyLabels = FOUNDATION_MATERIAL_FAMILY_LABELS;

  selectedFamilyIndex = 0;

  readonly displayedColumns: string[] = [
    'code',
    'name',
    'unit',
    'theoretical',
    'wasteFactor',
    'waste',
    'total',
    'actions',
  ];

  readonly specialCrossings: SpecialCrossingItem[] = [
    {
      id: 'TRV-01',
      code: 'TRV-BR-101',
      crossingType: 'HIGHWAY',
      crossingTypeName: 'Rodovia Federal BR-101',
      description: 'Cruzamento com rede de proteção e alteamento de estrutura',
      spanMeters: 450,
      safetyRequirement: 'Rede de proteção sobre pista dupla + estrutura ancoragem reforçada',
      estimatedCostBrl: 185000,
    },
    {
      id: 'TRV-02',
      code: 'TRV-RIO-PARDO',
      crossingType: 'RIVER',
      crossingTypeName: 'Rio Pardo (Navegável)',
      description: 'Vão longo com fundação especial em tubulão a ar comprimido',
      spanMeters: 780,
      safetyRequirement: 'Gabarito náutico de 25m + sinalização diurna/noturna ICAO',
      estimatedCostBrl: 340000,
    },
    {
      id: 'TRV-03',
      code: 'TRV-LT-230',
      crossingType: 'TRANSMISSION_LINE',
      crossingTypeName: 'Linha 230 kV Existente',
      description: 'Passagem superior com cabo guarda aterrado e guarda-corpo',
      spanMeters: 320,
      safetyRequirement: 'Desligamento programado ONS + gaiola de proteção',
      estimatedCostBrl: 95000,
    },
  ];

  readonly accessOpenings: AccessOpeningItem[] = [
    { id: 'ACC-01', terrainType: 'FLAT', terrainTypeName: 'Terreno Plano (Solo Comum)', lengthKm: 42.5, unitCostPerKm: 18000, totalCostBrl: 765000 },
    { id: 'ACC-02', terrainType: 'ROLLING', terrainTypeName: 'Terreno Ondulado / Cascalho', lengthKm: 28.0, unitCostPerKm: 28000, totalCostBrl: 784000 },
    { id: 'ACC-03', terrainType: 'MOUNTAINOUS', terrainTypeName: 'Terreno Montanhoso / Rocha', lengthKm: 14.2, unitCostPerKm: 55000, totalCostBrl: 781000 },
  ];

  readonly vegetationClearings: RightOfWayClearingItem[] = [
    { id: 'VEG-01', clearingType: 'LIGHT', clearingTypeName: 'Supressão Leve (Pastagem / Capineira)', areaHectares: 120.0, unitCostPerHa: 4500, totalCostBrl: 540000 },
    { id: 'VEG-02', clearingType: 'MEDIUM', clearingTypeName: 'Supressão Média (Cerrado / Mata Secundária)', areaHectares: 85.0, unitCostPerHa: 8500, totalCostBrl: 722500 },
    { id: 'VEG-03', clearingType: 'HEAVY', clearingTypeName: 'Supressão Pesada (Mata Densa / Floresta)', areaHectares: 32.5, unitCostPerHa: 16000, totalCostBrl: 520000 },
  ];

  get totalCrossingsCost(): number {
    return this.specialCrossings.reduce((acc, c) => acc + c.estimatedCostBrl, 0);
  }

  get totalAccessKm(): number {
    return this.accessOpenings.reduce((acc, a) => acc + a.lengthKm, 0);
  }

  get totalAccessCost(): number {
    return this.accessOpenings.reduce((acc, a) => acc + a.totalCostBrl, 0);
  }

  get totalClearingHa(): number {
    return this.vegetationClearings.reduce((acc, v) => acc + v.areaHectares, 0);
  }

  get totalClearingCost(): number {
    return this.vegetationClearings.reduce((acc, v) => acc + v.totalCostBrl, 0);
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lineId'] && !changes['lineId'].firstChange) {
      this.loadData();
    }
  }

  loadData(): void {
    if (!this.lineId) return;
    this.loading.set(true);
    this.errorMessage.set(null);

    this.api.getQuantities(this.lineId).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao calcular quantitativos de fundação:', err);
        this.errorMessage.set(
          'Não foi possível carregar os quantitativos de fundação da linha.',
        );
        this.loading.set(false);
      },
    });
  }

  openTraceability(item: FoundationMaterialItem): void {
    this.api.getTraceability(this.lineId).subscribe({
      next: (traceMap) => {
        const trace = traceMap[item.field];
        if (trace) {
          this.activeTraceability.set(trace);
        }
      },
      error: (err) => {
        console.error('Erro ao buscar rastreabilidade:', err);
      },
    });
  }
}

