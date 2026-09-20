import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ElectromechanicalSummary,
  TowerTraceabilityDetail,
  ElectromechanicalFamily,
  ELECTROMECHANICAL_FAMILY_LABELS,
} from '@lt-offers/domain';
import { ElectromechanicalApiService } from './electromechanical-api.service';

@Component({
  selector: 'app-electromechanical-quantities',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="electro-container">
      <!-- 1. Header & Actions Bar -->
      <div class="header-section">
        <div>
          <div class="subtitle-badge">Fase F2 · Módulo M05</div>
          <h2 class="title">Quantitativos de Engenharia Eletromecânica</h2>
          <p class="description">
            Inventário de estruturas metálicas, cabos condutores com flecha,
            cabos de guarda OPGW com descidas, cadeias de isoladores, tirantes,
            acessos e limpeza de faixa com separação de teóricos, perdas e
            sobressalentes.
          </p>
        </div>

        <div class="actions-group">
          <button
            type="button"
            class="btn btn-secondary"
            (click)="openTraceabilityModal()"
          >
            <span class="icon">🔍</span>
            Memorial de Rastreabilidade
          </button>
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="loading()"
            (click)="loadQuantities()"
          >
            <span class="icon">🔄</span>
            Atualizar Quantitativos
          </button>
        </div>
      </div>

      <!-- 2. Loading State -->
      @if (loading()) {
        <div class="loading-panel">
          <div class="spinner"></div>
          <span>Calculando quantitativos eletromecânicos da linha...</span>
        </div>
      }

      <!-- 3. KPIs Cards (Swiss Design) -->
      @if (summary() && !loading()) {
        <div class="kpis-grid">
          <div class="kpi-card kpi-highlight-steel">
            <div class="kpi-header">
              <span class="kpi-label">Aço das Torres</span>
              <span class="kpi-icon">🗼</span>
            </div>
            <div class="kpi-value text-slate">
              {{ summary()?.kpis?.totalTowerSteelTons | number: '1.2-2' }}
              <span class="unit">t</span>
            </div>
            <div class="kpi-foot">
              {{ summary()?.towers?.length || 0 }} tipos de estrutura (0,5%
              extra)
            </div>
          </div>

          <div class="kpi-card kpi-highlight-cond">
            <div class="kpi-header">
              <span class="kpi-label">Cabos Condutores</span>
              <span class="kpi-icon">⚡</span>
            </div>
            <div class="kpi-value text-amber">
              {{ summary()?.kpis?.totalConductorTons | number: '1.2-2' }}
              <span class="unit">t</span>
            </div>
            <div class="kpi-foot">
              {{ summary()?.kpis?.totalConductorKm | number: '1.2-2' }} km (2,5%
              flecha + 3% perda)
            </div>
          </div>

          <div class="kpi-card kpi-highlight-opgw">
            <div class="kpi-header">
              <span class="kpi-label">Cabos de Guarda / OPGW</span>
              <span class="kpi-icon">🌐</span>
            </div>
            <div class="kpi-value text-sky">
              {{ summary()?.kpis?.totalGroundWireKm | number: '1.2-2' }}
              <span class="unit">km</span>
            </div>
            <div class="kpi-foot">
              {{ summary()?.kpis?.totalGroundWireTons | number: '1.2-2' }} t com
              descidas de torre
            </div>
          </div>

          <div class="kpi-card kpi-highlight-iso">
            <div class="kpi-header">
              <span class="kpi-label">Isoladores</span>
              <span class="kpi-icon">🔘</span>
            </div>
            <div class="kpi-value text-emerald">
              {{ summary()?.kpis?.totalInsulatorUnits | number: '1.0-0' }}
              <span class="unit">un</span>
            </div>
            <div class="kpi-foot">Suspensão e Ancoragem (2% quebra)</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">Acessos & Faixa</span>
              <span class="kpi-icon">🚜</span>
            </div>
            <div class="kpi-value text-indigo">
              {{ summary()?.kpis?.totalClearingHectares | number: '1.1-1' }}
              <span class="unit">ha</span>
            </div>
            <div class="kpi-foot">
              {{ summary()?.kpis?.totalAccessKm | number: '1.1-1' }} km de
              acessos
            </div>
          </div>
        </div>

        <!-- 4. Filtro por Família de Suprimentos -->
        <div class="filter-bar">
          <div class="filter-label">Visualização:</div>
          <div class="filter-pills">
            <button
              type="button"
              class="pill-btn"
              [class.active]="selectedFilter() === 'ALL'"
              (click)="setFilter('ALL')"
            >
              Matriz Consolidada (M06)
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="selectedFilter() === 'TOWERS'"
              (click)="setFilter('TOWERS')"
            >
              Torres ({{ summary()?.towers?.length || 0 }})
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="selectedFilter() === 'CONDUCTORS'"
              (click)="setFilter('CONDUCTORS')"
            >
              Condutores ({{ summary()?.conductors?.length || 0 }})
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="selectedFilter() === 'GROUND_WIRES'"
              (click)="setFilter('GROUND_WIRES')"
            >
              Cabos de Guarda ({{ summary()?.groundWires?.length || 0 }})
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="selectedFilter() === 'INSULATORS'"
              (click)="setFilter('INSULATORS')"
            >
              Isoladores & Ferragens
            </button>
            <button
              type="button"
              class="pill-btn"
              [class.active]="selectedFilter() === 'ACCESSES'"
              (click)="setFilter('ACCESSES')"
            >
              Acessos, Limpeza & Travessias
            </button>
          </div>
        </div>

        <!-- 5. Tabela de Matriz Consolidada para M06 (Padrão) -->
        @if (selectedFilter() === 'ALL') {
          <div class="table-card">
            <div class="table-header">
              <h3 class="table-title">
                Matriz Consolidada de Suprimentos e Quantitativos (RF-26)
              </h3>
              <span class="table-badge"
                >{{ summary()?.consolidatedMaterials?.length || 0 }} materiais
                cadastrados</span
              >
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Item de Suprimento</th>
                    <th>Família</th>
                    <th>Unidade</th>
                    <th class="text-right">Qtd Teórica</th>
                    <th class="text-right">Extra Obra</th>
                    <th class="text-right">Sobressalente</th>
                    <th class="text-right">Total Aquisição</th>
                  </tr>
                </thead>
                <tbody>
                  @for (
                    item of summary()?.consolidatedMaterials;
                    track item.itemCode
                  ) {
                    <tr>
                      <td>
                        <span class="code-badge">{{ item.itemCode }}</span>
                      </td>
                      <td class="font-medium">{{ item.itemName }}</td>
                      <td>
                        <span class="family-badge">{{
                          getFamilyLabel(item.family)
                        }}</span>
                      </td>
                      <td class="font-mono text-slate-500">{{ item.unit }}</td>
                      <td class="text-right font-mono">
                        {{ item.theoreticalQuantity | number: '1.2-2' }}
                      </td>
                      <td class="text-right font-mono text-amber-700">
                        +{{ item.extraQuantity | number: '1.2-2' }}
                      </td>
                      <td class="text-right font-mono text-sky-700">
                        +{{ item.spareQuantity | number: '1.2-2' }}
                      </td>
                      <td class="text-right font-mono font-bold text-slate-900">
                        {{ item.totalQuantity | number: '1.2-2' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- 6. Tabela Específica de Torres -->
        @if (selectedFilter() === 'TOWERS') {
          <div class="table-card">
            <div class="table-header">
              <h3 class="table-title">
                Inventário de Estruturas Metálicas e Torres (RF-23)
              </h3>
              <span class="table-badge"
                >{{ summary()?.totalTowers }} torres totais</span
              >
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Tipo de Torre</th>
                    <th>Série</th>
                    <th class="text-right">Altura (m)</th>
                    <th class="text-right">Qtd Torres</th>
                    <th class="text-right">Peso Unit. Base (kg)</th>
                    <th class="text-right">Teórico (kg)</th>
                    <th class="text-right">Extra (0,5%)</th>
                    <th class="text-right">Total (kg)</th>
                    <th class="text-right">Total (t)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of summary()?.towers; track t.towerTypeCode) {
                    <tr>
                      <td>
                        <span class="code-badge">{{ t.towerTypeCode }}</span>
                      </td>
                      <td class="font-medium">{{ t.towerTypeName }}</td>
                      <td class="text-slate-500">
                        {{ t.seriesName || 'Padrão' }}
                      </td>
                      <td class="text-right font-mono">
                        {{ t.heightBodyM }} m
                      </td>
                      <td class="text-right font-mono font-bold">
                        {{ t.count }}
                      </td>
                      <td class="text-right font-mono">
                        {{ t.baseWeightKg | number: '1.0-0' }}
                      </td>
                      <td class="text-right font-mono">
                        {{ t.theoreticalWeightKg | number: '1.2-2' }}
                      </td>
                      <td class="text-right font-mono text-amber-700">
                        {{ t.extraWeightKg | number: '1.2-2' }}
                      </td>
                      <td class="text-right font-mono font-medium">
                        {{ t.totalWeightKg | number: '1.2-2' }}
                      </td>
                      <td
                        class="text-right font-mono font-bold text-emerald-800"
                      >
                        {{ t.totalWeightTons | number: '1.3-3' }} t
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- 7. Tabela de Condutores -->
        @if (selectedFilter() === 'CONDUCTORS') {
          <div class="table-card">
            <div class="table-header">
              <h3 class="table-title">
                Condutores de Alumínio e Feixes (RF-23, RN-10, RN-11)
              </h3>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cabo</th>
                    <th class="text-right">Seção</th>
                    <th class="text-right">Feixe</th>
                    <th class="text-right">Extensão Traçado</th>
                    <th class="text-right">Flecha (2,5%)</th>
                    <th class="text-right">Perda (3,0%)</th>
                    <th class="text-right">Extensão Total (km)</th>
                    <th class="text-right">Peso Total (t)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of summary()?.conductors; track c.cableCode) {
                    <tr>
                      <td>
                        <span class="code-badge">{{ c.cableCode }}</span>
                      </td>
                      <td class="font-medium">{{ c.cableName }}</td>
                      <td class="text-right font-mono">
                        {{ c.nominalSectionMm2 }} mm²
                      </td>
                      <td class="text-right font-mono">
                        {{ c.subconductorsPerPhase }}x subcond.
                      </td>
                      <td class="text-right font-mono">
                        {{ c.routeLengthKm | number: '1.2-2' }} km
                      </td>
                      <td class="text-right font-mono text-slate-500">
                        {{ c.theoreticalLengthKm | number: '1.2-2' }} km
                      </td>
                      <td class="text-right font-mono text-amber-700">
                        +{{ c.wasteLengthKm | number: '1.2-2' }} km
                      </td>
                      <td class="text-right font-mono font-bold">
                        {{ c.totalLengthKm | number: '1.2-2' }} km
                      </td>
                      <td
                        class="text-right font-mono font-bold text-emerald-800"
                      >
                        {{ c.totalWeightTons | number: '1.3-3' }} t
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- 8. Tabela de Cabos de Guarda -->
        @if (selectedFilter() === 'GROUND_WIRES') {
          <div class="table-card">
            <div class="table-header">
              <h3 class="table-title">
                Cabos de Guarda (Aço & OPGW com Descidas Verticais)
              </h3>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Cabo</th>
                    <th>Tipo</th>
                    <th class="text-right">Descidas Torre</th>
                    <th class="text-right">Teórico</th>
                    <th class="text-right">Perdas (3%)</th>
                    <th class="text-right">Total (km)</th>
                    <th class="text-right">Total (t)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (gw of summary()?.groundWires; track gw.cableCode) {
                    <tr>
                      <td>
                        <span class="code-badge">{{ gw.cableCode }}</span>
                      </td>
                      <td class="font-medium">{{ gw.cableName }}</td>
                      <td>
                        <span class="code-badge">{{ gw.type }}</span>
                      </td>
                      <td class="text-right font-mono">
                        {{ gw.totalDownleadKm | number: '1.3-3' }} km
                      </td>
                      <td class="text-right font-mono">
                        {{ gw.theoreticalLengthKm | number: '1.2-2' }} km
                      </td>
                      <td class="text-right font-mono text-amber-700">
                        +{{ gw.wasteLengthKm | number: '1.2-2' }} km
                      </td>
                      <td class="text-right font-mono font-bold">
                        {{ gw.totalLengthKm | number: '1.2-2' }} km
                      </td>
                      <td
                        class="text-right font-mono font-bold text-emerald-800"
                      >
                        {{ gw.totalWeightTons | number: '1.3-3' }} t
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- 9. Tabela de Isoladores e Ferragens -->
        @if (selectedFilter() === 'INSULATORS') {
          <div class="table-card">
            <div class="table-header">
              <h3 class="table-title">
                Cadeias de Isoladores, Tirantes e Amortecedores
              </h3>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Descrição</th>
                    <th>Tipo</th>
                    <th class="text-right">Cadeias / Estais</th>
                    <th class="text-right">Qtd Teórica</th>
                    <th class="text-right">Extra Quebra</th>
                    <th class="text-right">Total Final</th>
                  </tr>
                </thead>
                <tbody>
                  @for (ins of summary()?.insulators; track ins.typeCode) {
                    <tr>
                      <td>
                        <span class="code-badge">{{ ins.typeCode }}</span>
                      </td>
                      <td class="font-medium">{{ ins.typeName }}</td>
                      <td>
                        <span class="family-badge">{{ ins.category }}</span>
                      </td>
                      <td class="text-right font-mono">
                        {{ ins.stringsCount }} cadeias
                      </td>
                      <td class="text-right font-mono">
                        {{ ins.theoreticalUnits | number: '1.0-0' }}
                      </td>
                      <td class="text-right font-mono text-amber-700">
                        +{{ ins.extraUnits | number: '1.0-0' }}
                      </td>
                      <td
                        class="text-right font-mono font-bold text-emerald-800"
                      >
                        {{ ins.totalUnits | number: '1.0-0' }} {{ ins.unit }}
                      </td>
                    </tr>
                  }
                  @for (guy of summary()?.guyWires; track guy.cableCode) {
                    <tr>
                      <td>
                        <span class="code-badge">{{ guy.cableCode }}</span>
                      </td>
                      <td class="font-medium">{{ guy.cableName }}</td>
                      <td><span class="family-badge">TIRANTE</span></td>
                      <td class="text-right font-mono">
                        {{ guy.guyedTowersCount }} torres
                      </td>
                      <td class="text-right font-mono">
                        {{ guy.theoreticalLengthM | number: '1.0-0' }} m
                      </td>
                      <td class="text-right font-mono text-amber-700">
                        +{{ guy.extraLengthM | number: '1.0-0' }} m
                      </td>
                      <td
                        class="text-right font-mono font-bold text-emerald-800"
                      >
                        {{ guy.totalLengthM | number: '1.0-0' }} m ({{
                          guy.totalWeightKg | number: '1.1-1'
                        }}
                        kg)
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- 10. Tabela de Acessos, Limpeza e Travessias -->
        @if (selectedFilter() === 'ACCESSES') {
          <div class="table-card">
            <div class="table-header">
              <h3 class="table-title">
                Serviços Civis Preliminares, Acessos, Limpeza e Travessias
                (RF-25)
              </h3>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Descrição do Serviço</th>
                    <th>Tipo / Densidade</th>
                    <th class="text-right">Extensão (km)</th>
                    <th class="text-right">Área / Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of summary()?.accesses; track a.description) {
                    <tr>
                      <td><span class="family-badge">ACESSOS</span></td>
                      <td class="font-medium">{{ a.description }}</td>
                      <td>{{ a.accessType }}</td>
                      <td class="text-right font-mono font-bold">
                        {{ a.lengthKm | number: '1.2-2' }} km
                      </td>
                      <td class="text-right font-mono text-slate-500">—</td>
                    </tr>
                  }
                  @for (
                    cl of summary()?.vegetationClearing;
                    track cl.description
                  ) {
                    <tr>
                      <td><span class="family-badge">SUPRESSÃO</span></td>
                      <td class="font-medium">{{ cl.description }}</td>
                      <td>Densidade {{ cl.density }}</td>
                      <td class="text-right font-mono">
                        {{ cl.lengthKm | number: '1.2-2' }} km
                      </td>
                      <td
                        class="text-right font-mono font-bold text-emerald-800"
                      >
                        {{ cl.areaHectares | number: '1.2-2' }} ha
                      </td>
                    </tr>
                  }
                  @for (cr of summary()?.crossings; track cr.description) {
                    <tr>
                      <td><span class="family-badge">TRAVESSIA</span></td>
                      <td class="font-medium">{{ cr.description }}</td>
                      <td>{{ cr.type }}</td>
                      <td class="text-right font-mono text-slate-500">—</td>
                      <td class="text-right font-mono font-bold">
                        {{ cr.count }} travessias
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }

      <!-- 11. Modal de Memória de Cálculo e Rastreabilidade Torre a Torre (RF-27) -->
      @if (showTraceabilityModal()) {
        <div
          class="modal-backdrop"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          (click)="closeTraceabilityModal()"
          (keydown.escape)="closeTraceabilityModal()"
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
                  Memorial de Rastreabilidade Estrutural (RF-27)
                </h3>
                <p class="modal-subtitle">
                  Detalhamento de peso, altura e extensões de perna estrutura
                  por estrutura
                </p>
              </div>
              <button
                type="button"
                class="btn-close"
                (click)="closeTraceabilityModal()"
              >
                ✕
              </button>
            </div>

            <div class="modal-body">
              <div class="trace-search">
                <label for="traceSearchInput" class="form-label"
                  >Filtrar por Estrutura:</label
                >
                <input
                  id="traceSearchInput"
                  type="text"
                  class="form-input"
                  placeholder="Ex.: T001, SUSP-LEVE..."
                  [(ngModel)]="traceSearchQuery"
                />
              </div>

              <div class="table-responsive modal-table">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Estrutura</th>
                      <th>Estaca</th>
                      <th>Tipo</th>
                      <th class="text-right">Altura (m)</th>
                      <th class="text-right">Ext. Pé (m)</th>
                      <th class="text-right">Massa Base (kg)</th>
                      <th class="text-right">Adicional Pé (kg)</th>
                      <th class="text-right">Massa Total (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (
                      item of filteredTraceability();
                      track item.towerNumber
                    ) {
                      <tr>
                        <td>
                          <span class="code-badge font-bold">{{
                            item.towerNumber
                          }}</span>
                        </td>
                        <td class="font-mono text-slate-500">
                          {{ item.stationMeters }} m
                        </td>
                        <td class="font-medium">{{ item.towerTypeCode }}</td>
                        <td class="text-right font-mono">
                          {{ item.heightM }} m
                        </td>
                        <td class="text-right font-mono">
                          {{ item.legExtensionM | number: '1.1-1' }} m
                        </td>
                        <td class="text-right font-mono">
                          {{ item.nominalWeightKg | number: '1.0-0' }}
                        </td>
                        <td class="text-right font-mono text-amber-700">
                          +{{ item.legExtensionWeightKg | number: '1.0-0' }}
                        </td>
                        <td
                          class="text-right font-mono font-bold text-slate-900"
                        >
                          {{ item.totalStructureWeightKg | number: '1.0-0' }} kg
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div class="modal-footer">
              <span class="text-xs text-slate-500"
                >Exibindo {{ filteredTraceability().length }} de
                {{ traceabilityData().length }} estruturas</span
              >
              <button
                type="button"
                class="btn btn-secondary"
                (click)="closeTraceabilityModal()"
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
      .electro-container {
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

      .loading-panel {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 3rem;
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
        border-radius: 0.5rem;
        color: #64748b;
        font-weight: 600;
      }

      .spinner {
        width: 1.5rem;
        height: 1.5rem;
        border: 3px solid #cbd5e1;
        border-top-color: #0284c7;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* KPIs */
      .kpis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
      }

      .kpi-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        padding: 1rem 1.25rem;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
      }

      .kpi-highlight-steel {
        border-left: 4px solid #475569;
      }
      .kpi-highlight-cond {
        border-left: 4px solid #f59e0b;
      }
      .kpi-highlight-opgw {
        border-left: 4px solid #0284c7;
      }
      .kpi-highlight-iso {
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

      .kpi-value .unit {
        font-size: 0.875rem;
        font-weight: 500;
        color: #64748b;
      }

      .kpi-foot {
        font-size: 0.75rem;
        color: #64748b;
        margin-top: 0.375rem;
      }

      .text-slate {
        color: #334155;
      }
      .text-amber {
        color: #d97706;
      }
      .text-sky {
        color: #0284c7;
      }
      .text-emerald {
        color: #059669;
      }
      .text-indigo {
        color: #4f46e5;
      }

      /* Filter Bar */
      .filter-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        background: #f8fafc;
        padding: 0.5rem 0.75rem;
        border-radius: 0.5rem;
        border: 1px solid #e2e8f0;
        flex-wrap: wrap;
      }

      .filter-label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748b;
      }

      .filter-pills {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .pill-btn {
        padding: 0.35rem 0.75rem;
        font-size: 0.75rem;
        font-weight: 600;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        border-radius: 9999px;
        cursor: pointer;
        color: #334155;
        transition: all 0.15s ease;
      }

      .pill-btn:hover {
        background: #f1f5f9;
      }

      .pill-btn.active {
        background: #0f172a;
        color: #ffffff;
        border-color: #0f172a;
      }

      /* Tabelas */
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

      .family-badge {
        font-size: 0.7rem;
        font-weight: 600;
        background: #e0f2fe;
        color: #0369a1;
        padding: 0.15rem 0.4rem;
        border-radius: 0.25rem;
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
        max-width: 52rem;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
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
        gap: 1rem;
        overflow-y: auto;
      }

      .trace-search {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .form-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
      }

      .form-input {
        padding: 0.5rem;
        border: 1px solid #cbd5e1;
        border-radius: 0.375rem;
        font-size: 0.875rem;
      }

      .modal-table {
        max-height: 50vh;
        overflow-y: auto;
        border: 1px solid #e2e8f0;
        border-radius: 0.375rem;
      }

      .modal-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.25rem;
        border-top: 1px solid #e2e8f0;
        background: #f8fafc;
      }

      .text-right {
        text-align: right;
      }
      .font-mono {
        font-family: monospace;
      }
      .font-medium {
        font-weight: 500;
      }
      .font-bold {
        font-weight: 700;
      }
    `,
  ],
})
export class ElectromechanicalQuantitiesComponent implements OnInit {
  @Input({ required: true }) lineId!: number;

  private readonly electroApi = inject(ElectromechanicalApiService);

  readonly loading = signal<boolean>(false);
  readonly summary = signal<ElectromechanicalSummary | null>(null);
  readonly traceabilityData = signal<TowerTraceabilityDetail[]>([]);
  readonly showTraceabilityModal = signal<boolean>(false);
  readonly selectedFilter = signal<string>('ALL');

  traceSearchQuery = '';

  ngOnInit(): void {
    if (this.lineId) {
      this.loadQuantities();
    }
  }

  loadQuantities(): void {
    this.loading.set(true);
    this.electroApi.getLineElectromechanicalSummary(this.lineId).subscribe({
      next: (res) => {
        this.summary.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  setFilter(filter: string): void {
    this.selectedFilter.set(filter);
  }

  openTraceabilityModal(): void {
    this.showTraceabilityModal.set(true);
    if (this.traceabilityData().length === 0) {
      this.electroApi
        .getLineElectromechanicalTraceability(this.lineId)
        .subscribe({
          next: (data) => {
            this.traceabilityData.set(data);
          },
        });
    }
  }

  closeTraceabilityModal(): void {
    this.showTraceabilityModal.set(false);
  }

  filteredTraceability(): TowerTraceabilityDetail[] {
    const query = this.traceSearchQuery.toLowerCase().trim();
    if (!query) return this.traceabilityData();
    return this.traceabilityData().filter(
      (t) =>
        t.towerNumber.toLowerCase().includes(query) ||
        t.towerTypeCode.toLowerCase().includes(query),
    );
  }

  getFamilyLabel(family: ElectromechanicalFamily): string {
    return ELECTROMECHANICAL_FAMILY_LABELS[family] || family;
  }
}
