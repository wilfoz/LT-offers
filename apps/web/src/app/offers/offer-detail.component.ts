import { Component, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  CANONICAL_SCOPE_ITEMS,
  DATE_PATTERN,
  OfferDetail,
  OfferRevisionItem,
  OfferRevisionStatus,
  POSITIVE_DECIMAL_PATTERN,
  ScopeMatrixItemPayload,
  ScopeResponsibleParty,
  TransmissionLineItem,
  UpdateOfferRevisionPayload,
} from '@lt-offers/domain';
import { decimalScaleValidator, orNull } from '../catalogs/form-utils';
import { REVISION_STATUS_LABELS } from './offer-list.component';
import { OffersApi } from './offers-api.service';
import { StakingTableComponent } from './staking-table.component';
import { FoundationQuantitiesComponent } from './foundation-quantities.component';
import { ElectromechanicalQuantitiesComponent } from './electromechanical-quantities.component';
import { MaterialPricingComponent } from './material-pricing.component';
import { ScheduleGanttComponent } from './schedule-gantt.component';
import { CampsManagementComponent } from './camps-management.component';
import { ResourceHistogramsComponent } from './resource-histograms.component';
import { ServiceBudgetComponent } from './service-budget.component';
import { EconomicResultComponent } from './economic-result.component';
import { CashflowComponent } from './cashflow.component';
import { OfferRisksComponent } from './offer-risks.component';
import { OfferChecksComponent } from './offer-checks.component';
import { OfferAuditComponent } from './offer-audit.component';
import { OfferExportComponent } from './offer-export.component';
import { ChecksApiService } from './checks-api.service';
import { AuthService } from '../auth/auth.service';
import { OfferHealthSummary, CheckNavigationTarget } from '@lt-offers/domain';

const BRAZILIAN_UFS = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
];

@Component({
  selector: 'app-offer-detail',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatTabsModule,
    MatTableModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressBarModule,
    StakingTableComponent,
    FoundationQuantitiesComponent,
    ElectromechanicalQuantitiesComponent,
    MaterialPricingComponent,
    ScheduleGanttComponent,
    CampsManagementComponent,
    ResourceHistogramsComponent,
    ServiceBudgetComponent,
    EconomicResultComponent,
    CashflowComponent,
    OfferRisksComponent,
    OfferChecksComponent,
    OfferAuditComponent,
    OfferExportComponent,
  ],
  template: `
    <section class="offer-detail-page">
      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <div class="loading-state">
          <mat-icon class="spin-icon">sync</mat-icon>
          <p>Carregando dados da proposta técnica…</p>
        </div>
      } @else if (error()) {
        <div class="error-banner" role="alert">
          <mat-icon>error_outline</mat-icon>
          <div>
            <strong>Erro ao carregar proposta:</strong>
            <p>{{ error() }}</p>
          </div>
          <a mat-stroked-button routerLink="/offers">Voltar à listagem</a>
        </div>
      } @else if (offer()) {
        <!-- Breadcrumb & Top Bar -->
        <div class="editorial-breadcrumb">
          <a routerLink="/offers">PROPOSTAS</a>
          <span class="sep">/</span>
          <span class="mono">{{ offer()!.code }}</span>
          <span class="sep">/</span>
          <span class="current">REVISÃO R{{ selectedRevisionNumber() }}</span>
        </div>

        <!-- Header da Proposta -->
        <div class="offer-header">
          <div class="header-main">
            <div class="code-row">
              <span class="offer-code mono">{{ offer()!.code }}</span>
              <span class="badge badge-primary mono">{{ offer()!.baseCurrency }}</span>
              @if (offer()!.clonedFromOfferId) {
                <span class="badge-cloned">
                  <mat-icon>content_copy</mat-icon> Clonada da proposta #{{ offer()!.clonedFromOfferId }}
                </span>
              }
            </div>
            <h1 class="page-title font-display-lg">{{ offer()!.name }}</h1>
            <p class="client-subtitle">
              <mat-icon>business</mat-icon>
              <span>{{ offer()!.clientName }}</span>
              <span class="sep-dot">•</span>
              <span class="lot-info mono">{{ currentRevision()?.lotName ?? 'Lote 1' }}</span>
            </p>
          </div>

          <div class="header-actions">
            <a mat-stroked-button [routerLink]="['edit']">
              <mat-icon>edit</mat-icon> Editar dados gerais
            </a>
            <button mat-stroked-button type="button" (click)="cloneCurrentOffer()">
              <mat-icon>copy_all</mat-icon> Clonar proposta
            </button>
            <a mat-button routerLink="/offers">
              <mat-icon>arrow_back</mat-icon> Voltar
            </a>
          </div>
        </div>

        <!-- Seletor de Revisões e Status Bar -->
        <div class="revision-bar technical-border">
          <div class="revision-selector">
            <span class="label font-label-caps">Revisão do Projeto:</span>
            <div class="revision-pills">
              @for (rev of offer()!.revisions; track rev.revisionNumber) {
                <button
                  type="button"
                  class="rev-pill"
                  [class.active]="rev.revisionNumber === selectedRevisionNumber()"
                  (click)="selectRevision(rev.revisionNumber)"
                >
                  <span class="mono">R{{ rev.revisionNumber }}</span>
                  <span
                    class="status-dot"
                    [attr.data-status]="rev.status"
                  ></span>
                </button>
              }
            </div>
          </div>

          <div class="revision-status-info">
            <span
              class="status-chip"
              [attr.data-status]="currentRevision()?.status"
            >
              {{ statusLabel(currentRevision()?.status ?? 'DRAFT') }}
            </span>

            @if (offerHealth(); as health) {
              <button
                type="button"
                class="health-badge-btn"
                [class.healthy]="health.status === 'HEALTHY'"
                [class.warning]="health.status === 'WARNINGS_ONLY'"
                [class.critical]="health.status === 'CRITICAL_ERRORS'"
                (click)="activeTabIndex.set(13)"
                matTooltip="Ver diagnósticos de consistência e integridade (M12)"
              >
                @if (health.status === 'HEALTHY') {
                  ✓ Integridade 100%
                } @else if (health.status === 'WARNINGS_ONLY') {
                  ⚠ {{ health.warningCount }} Alerta(s)
                } @else {
                  ✕ {{ health.criticalCount }} Erro(s) Crítico(s)
                }
              </button>
            }

            @if (isDraft()) {
              <button
                mat-stroked-button
                type="button"
                (click)="freezeRevision()"
                matTooltip="Bloqueia edições tornando a revisão imutável para histórico"
              >
                <mat-icon>lock</mat-icon> Fechar revisão
              </button>
            } @else if (isFrozen()) {
              <button
                mat-stroked-button
                type="button"
                (click)="markDelivered()"
                matTooltip="Marca proposta como formalmente entregue ao cliente"
              >
                <mat-icon>send</mat-icon> Marcar como entregue
              </button>
              <button
                mat-flat-button
                color="primary"
                type="button"
                (click)="createNewRevision()"
                matTooltip="Cria uma nova revisão R{{ (currentRevision()?.revisionNumber ?? 0) + 1 }} derivada desta"
              >
                <mat-icon>add</mat-icon> Nova revisão
              </button>
            } @else if (isDelivered()) {
              <button
                mat-flat-button
                color="primary"
                type="button"
                (click)="createNewRevision()"
                matTooltip="Cria uma nova revisão derivada desta"
              >
                <mat-icon>add</mat-icon> Nova revisão
              </button>
            }
          </div>
        </div>

        @if (!isDraft()) {
          <div class="immutable-banner" role="status">
            <mat-icon>lock</mat-icon>
            <div>
              <strong>Revisão imutável:</strong> Esta revisão está
              {{ statusLabel(currentRevision()?.status ?? 'FROZEN').toLowerCase() }}
              e não aceita alterações diretas (RNF-05). Para efetuar
              modificações de engenharia ou escopo, crie uma nova revisão.
            </div>
          </div>
        }

        <!-- Abas do Módulo da Oferta -->
        <mat-tab-group
          [selectedIndex]="activeTabIndex()"
          (selectedIndexChange)="activeTabIndex.set($event)"
          animationDuration="0ms"
          class="offer-tabs"
        >
          <!-- ABA 1: LINHAS DE TRANSMISSÃO -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">power</mat-icon>
              Linhas de Transmissão ({{ currentRevision()?.transmissionLines?.length ?? 0 }})
            </ng-template>

            <div class="tab-content">
              <div class="lines-summary-cards">
                <div class="kpi-card">
                  <span class="kpi-label">Total de Linhas</span>
                  <span class="kpi-value mono">{{ currentRevision()?.transmissionLines?.length ?? 0 }}</span>
                  <span class="kpi-subtext">Circuitos independentes</span>
                </div>
                <div class="kpi-card">
                  <span class="kpi-label">Extensão Refinada Total</span>
                  <span class="kpi-value mono text-primary">{{ totalRefinedKm() }} km</span>
                  <span class="kpi-subtext">Cálculo de traçado vetorial</span>
                </div>
                <div class="kpi-card">
                  <span class="kpi-label">Extensão Relatório Total</span>
                  <span class="kpi-value mono">{{ totalReportKm() }} km</span>
                  <span class="kpi-subtext">Extensão nominal edital</span>
                </div>
              </div>

              <div class="section-actions">
                <div>
                  <h3 class="font-display">Linhas de Transmissão do Lote</h3>
                  <p class="section-subtitle">Relação de trechos físicos, especificações de condutores e rateio territorial por estado.</p>
                </div>
                @if (isDraft()) {
                  <button
                    mat-flat-button
                    color="primary"
                    type="button"
                    (click)="openAddLineForm()"
                  >
                    <mat-icon>add</mat-icon> Adicionar linha
                  </button>
                }
              </div>

              <!-- Formulário Inline de Adicionar/Editar Linha -->
              @if (isEditingLine()) {
                <div class="line-edit-box technical-border">
                  <div class="line-edit-header">
                    <h4>
                      {{
                        editingLineIndex() === -1
                          ? 'Nova Linha de Transmissão'
                          : 'Editar Linha de Transmissão'
                      }}
                    </h4>
                    <span class="font-label-caps badge badge-primary">Engenharia Eletromecânica</span>
                  </div>
                  <form
                    [formGroup]="lineForm"
                    class="line-grid"
                    (ngSubmit)="saveLine()"
                  >
                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      class="col-3"
                    >
                      <mat-label>Código da LT *</mat-label>
                      <input
                        matInput
                        id="lineCode"
                        formControlName="code"
                        placeholder="ex.: LT-500-01"
                        maxlength="50"
                      />
                    </mat-form-field>

                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      class="col-6"
                    >
                      <mat-label>Nome da LT *</mat-label>
                      <input
                        matInput
                        id="lineName"
                        formControlName="name"
                        placeholder="ex.: LT 500 kV Curitiba Leste - Blumenau"
                        maxlength="200"
                      />
                    </mat-form-field>

                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      class="col-3"
                    >
                      <mat-label>Tensão Nominal (kV) *</mat-label>
                      <input
                        matInput
                        id="lineNominalVoltageKv"
                        formControlName="nominalVoltageKv"
                        inputmode="decimal"
                        placeholder="ex.: 500.00"
                      />
                    </mat-form-field>

                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      class="col-3"
                    >
                      <mat-label>Extensão Refinada (km) *</mat-label>
                      <input
                        matInput
                        id="lineRefinedLengthKm"
                        formControlName="refinedLengthKm"
                        inputmode="decimal"
                        placeholder="ex.: 154.230"
                      />
                    </mat-form-field>

                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      class="col-3"
                    >
                      <mat-label>Extensão Relatório (km) *</mat-label>
                      <input
                        matInput
                        id="lineReportLengthKm"
                        formControlName="reportLengthKm"
                        inputmode="decimal"
                        placeholder="ex.: 155.000"
                      />
                    </mat-form-field>

                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      class="col-3"
                    >
                      <mat-label>Nº Circuitos *</mat-label>
                      <input
                        matInput
                        id="lineCircuitCount"
                        formControlName="circuitCount"
                        type="number"
                        min="1"
                      />
                    </mat-form-field>

                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      class="col-3"
                    >
                      <mat-label>Condutores / Fase *</mat-label>
                      <input
                        matInput
                        id="lineBundleConductorCount"
                        formControlName="bundleConductorCount"
                        type="number"
                        min="1"
                      />
                    </mat-form-field>

                    <!-- Rateio Territorial (RN-01) -->
                    <div class="col-12 uf-allocation-panel">
                      <mat-icon class="text-primary">share_location</mat-icon>
                      <div>
                        <strong>Rateio Territorial por Estado (RN-01):</strong>
                        <span>A soma dos percentuais deve totalizar exatamente 100,00% para correta tributação e faturamento.</span>
                      </div>
                    </div>

                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      class="col-3"
                    >
                      <mat-label>UF Primária *</mat-label>
                      <mat-select
                        id="lineUf1"
                        formControlName="destinationStatePrimary"
                      >
                        @for (uf of ufs; track uf) {
                          <mat-option [value]="uf">{{ uf }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      class="col-3"
                    >
                      <mat-label>% UF Primária *</mat-label>
                      <input
                        matInput
                        id="linePercent1"
                        formControlName="destinationPercentagePrimary"
                        inputmode="decimal"
                        placeholder="ex.: 60.00"
                      />
                    </mat-form-field>

                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      class="col-3"
                    >
                      <mat-label>UF Secundária (opcional)</mat-label>
                      <mat-select
                        id="lineUf2"
                        formControlName="destinationStateSecondary"
                      >
                        <mat-option [value]="null">Nenhuma</mat-option>
                        @for (uf of ufs; track uf) {
                          <mat-option [value]="uf">{{ uf }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field
                      appearance="outline"
                      floatLabel="always"
                      class="col-3"
                    >
                      <mat-label>% UF Secundária</mat-label>
                      <input
                        matInput
                        id="linePercent2"
                        formControlName="destinationPercentageSecondary"
                        inputmode="decimal"
                        placeholder="ex.: 40.00"
                      />
                    </mat-form-field>

                    @if (lineUfError()) {
                      <div class="col-12 line-uf-error" role="alert">
                        <mat-icon>error</mat-icon> {{ lineUfError() }}
                      </div>
                    }

                    <div class="col-12 line-form-actions">
                      <button
                        mat-stroked-button
                        type="button"
                        (click)="cancelLineEdit()"
                      >
                        Cancelar
                      </button>
                      <button
                        mat-flat-button
                        color="primary"
                        type="submit"
                        [disabled]="lineForm.invalid"
                      >
                        {{
                          editingLineIndex() === -1
                            ? 'Inserir linha'
                            : 'Atualizar linha'
                        }}
                      </button>
                    </div>
                  </form>
                </div>
              }

              <!-- Tabela de Linhas -->
              @if ((currentRevision()?.transmissionLines?.length ?? 0) === 0) {
                <div class="empty-state technical-border">
                  <mat-icon>alt_route</mat-icon>
                  <p>Nenhuma linha de transmissão cadastrada nesta revisão.</p>
                  @if (isDraft()) {
                    <button mat-flat-button color="primary" (click)="openAddLineForm()">
                      Adicionar primeira linha
                    </button>
                  }
                </div>
              } @else {
                <div class="table-scroll technical-border">
                  <table
                    mat-table
                    [dataSource]="currentRevision()?.transmissionLines ?? []"
                    class="technical-table"
                  >
                    <ng-container matColumnDef="code">
                      <th mat-header-cell *matHeaderCellDef scope="col">
                        Código
                      </th>
                      <td
                        mat-cell
                        *matCellDef="let line"
                        class="mono font-bold"
                      >
                        {{ line.code }}
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="name">
                      <th mat-header-cell *matHeaderCellDef scope="col">
                        Nome da LT
                      </th>
                      <td mat-cell *matCellDef="let line">
                        <span class="line-title font-medium">{{ line.name }}</span>
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="nominalVoltageKv">
                      <th mat-header-cell *matHeaderCellDef scope="col">
                        Tensão (kV)
                      </th>
                      <td mat-cell *matCellDef="let line" class="mono num">
                        {{ line.nominalVoltageKv }} kV
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="lengths">
                      <th mat-header-cell *matHeaderCellDef scope="col">
                        Extensão (Refinada / Relatório)
                      </th>
                      <td mat-cell *matCellDef="let line" class="mono">
                        {{ line.refinedLengthKm }} km /
                        {{ line.reportLengthKm }} km
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="circuits">
                      <th mat-header-cell *matHeaderCellDef scope="col">
                        Circ. / Cond.
                      </th>
                      <td mat-cell *matCellDef="let line" class="mono">
                        {{ line.circuitCount }}C •
                        {{ line.bundleConductorCount }} cond/fase
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="ufs">
                      <th mat-header-cell *matHeaderCellDef scope="col">
                        Rateio Territorial (RN-01)
                      </th>
                      <td mat-cell *matCellDef="let line">
                        <span class="badge badge-neutral mono">
                          {{ line.destinationStatePrimary }}: {{ line.destinationPercentagePrimary }}%
                        </span>
                        @if (line.destinationStateSecondary) {
                          <span class="badge badge-neutral mono ml-1">
                            {{ line.destinationStateSecondary }}: {{ line.destinationPercentageSecondary }}%
                          </span>
                        }
                      </td>
                    </ng-container>

                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef scope="col" class="text-right">
                        Ações
                      </th>
                      <td mat-cell *matCellDef="let line; let idx = index" class="text-right">
                        @if (line.id) {
                          <button
                            mat-icon-button
                            type="button"
                            (click)="openStakingForLine(line.id)"
                            matTooltip="Gerenciar estaqueamento e dados de torre (M04)"
                            aria-label="Gerenciar estaqueamento da linha"
                          >
                            <mat-icon>straighten</mat-icon>
                          </button>
                          <button
                            mat-icon-button
                            type="button"
                            (click)="openFoundationsForLine(line.id)"
                            matTooltip="Ver quantitativos de fundações e escavações (M05)"
                            aria-label="Ver quantitativos de fundação da linha"
                          >
                            <mat-icon>foundation</mat-icon>
                          </button>
                          <button
                            mat-icon-button
                            type="button"
                            (click)="openElectroForLine(line.id)"
                            matTooltip="Ver quantitativos eletromecânicos de torres, cabos e acessórios (M05)"
                            aria-label="Ver quantitativos eletromecânicos da linha"
                          >
                            <mat-icon>bolt</mat-icon>
                          </button>
                          <button
                            mat-icon-button
                            type="button"
                            (click)="openPricingForLine(line.id)"
                            matTooltip="Ver preços, commodities e tributos de materiais (M06)"
                            aria-label="Ver preços e tributos da linha"
                          >
                            <mat-icon>payments</mat-icon>
                          </button>
                          <button
                            mat-icon-button
                            type="button"
                            (click)="openScheduleForLine(line.id)"
                            matTooltip="Ver cronograma físico e planejamento temporal (M07)"
                            aria-label="Ver cronograma físico da linha"
                          >
                            <mat-icon>schedule</mat-icon>
                          </button>
                          <button
                            mat-icon-button
                            type="button"
                            (click)="openHistogramForLine(line.id)"
                            matTooltip="Ver histograma de recursos e balanço de frota (M08)"
                            aria-label="Ver histograma de recursos da linha"
                          >
                            <mat-icon>bar_chart</mat-icon>
                          </button>
                        }
                        @if (isDraft()) {
                          <button
                            mat-icon-button
                            type="button"
                            (click)="editLine(idx)"
                            matTooltip="Editar linha"
                            aria-label="Editar linha"
                          >
                            <mat-icon>edit</mat-icon>
                          </button>
                          <button
                            mat-icon-button
                            type="button"
                            (click)="removeLine(idx)"
                            matTooltip="Remover linha"
                            aria-label="Remover linha"
                            class="danger-btn"
                          >
                            <mat-icon>delete</mat-icon>
                          </button>
                        } @else if (!line.id) {
                          <span class="text-muted">—</span>
                        }
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="lineColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: lineColumns"></tr>
                  </table>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ABA 2: MATRIZ DE RESPONSABILIDADE DE ESCOPO -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">assignment_turned_in</mat-icon>
              Matriz de Escopo ({{ currentRevision()?.scopeMatrixItems?.length ?? 0 }})
            </ng-template>

            <div class="tab-content">
              <div class="scope-header-desc">
                <div>
                  <h3 class="font-display">Matriz de Responsabilidade e Risco (4 Eixos)</h3>
                  <p class="section-subtitle">
                    Definição de fornecimento, REIDI (RN-04) e alocação de riscos cambial e de commodity (RN-08). Itens sob responsabilidade do Cliente entram com custo zero na proposta (RN-03).
                  </p>
                </div>
                @if (
                  isDraft() &&
                  (currentRevision()?.scopeMatrixItems?.length ?? 0) === 0
                ) {
                  <button
                    mat-flat-button
                    color="primary"
                    type="button"
                    (click)="loadBenchmarkScope()"
                  >
                    <mat-icon>auto_fix_high</mat-icon> Carregar itens canônicos
                  </button>
                }
              </div>

              <div class="table-scroll technical-border">
                <table class="technical-table scope-matrix-table">
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Item de Escopo</th>
                      <th>Categoria</th>
                      <th>Responsável (RN-03)</th>
                      <th>Faturamento Direto / REIDI (RN-04)</th>
                      <th>Risco Cambial</th>
                      <th>Risco Commodity</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (
                      item of scopeItems();
                      track item.itemCode;
                      let idx = $index
                    ) {
                      <tr
                        [class.client-item]="item.responsibleParty === 'CLIENT'"
                      >
                        <td class="mono font-bold">{{ item.itemCode }}</td>
                        <td>
                          <strong>{{ item.itemName }}</strong>
                          @if (item.responsibleParty === 'CLIENT') {
                            <span class="badge badge-neutral ml-1">(Cliente)</span>
                          }
                        </td>
                        <td>
                          <span class="badge badge-analysis">{{ item.category }}</span>
                        </td>
                        <td>
                          <select
                            class="native-select"
                            [disabled]="!isDraft()"
                            [value]="item.responsibleParty"
                            (change)="
                              updateScopeField(
                                idx,
                                'responsibleParty',
                                $any($event.target).value
                              )
                            "
                          >
                            <option value="CONTRACTOR">Contratada</option>
                            <option value="CLIENT">Cliente (Custo 0)</option>
                          </select>
                        </td>
                        <td class="center-col">
                          <label class="checkbox-label">
                            <input
                              type="checkbox"
                              [disabled]="!isDraft()"
                              [checked]="item.acceptsDirectBilling"
                              (change)="
                                updateScopeField(
                                  idx,
                                  'acceptsDirectBilling',
                                  $any($event.target).checked
                                )
                              "
                            />
                            <span class="badge" [class.badge-valid]="item.acceptsDirectBilling" [class.badge-neutral]="!item.acceptsDirectBilling">
                              {{ item.acceptsDirectBilling ? 'REIDI Ativo' : 'Não' }}
                            </span>
                          </label>
                        </td>
                        <td>
                          <select
                            class="native-select"
                            [disabled]="!isDraft()"
                            [value]="item.currencyRiskParty"
                            (change)="
                              updateScopeField(
                                idx,
                                'currencyRiskParty',
                                $any($event.target).value
                              )
                            "
                          >
                            <option value="CONTRACTOR">Contratada (A termo)</option>
                            <option value="CLIENT">Cliente (Spot)</option>
                          </select>
                        </td>
                        <td>
                          <select
                            class="native-select"
                            [disabled]="!isDraft()"
                            [value]="item.commodityRiskParty"
                            (change)="
                              updateScopeField(
                                idx,
                                'commodityRiskParty',
                                $any($event.target).value
                              )
                            "
                          >
                            <option value="CONTRACTOR">Contratada</option>
                            <option value="CLIENT">Cliente</option>
                          </select>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              @if (isDraft()) {
                <div class="save-bar">
                  <button
                    mat-flat-button
                    color="primary"
                    type="button"
                    (click)="saveRevisionChanges()"
                    [disabled]="saving()"
                  >
                    <mat-icon>{{ saving() ? 'hourglass_empty' : 'save' }}</mat-icon>
                    {{ saving() ? 'Salvando…' : 'Salvar alterações do escopo' }}
                  </button>
                </div>
              }
            </div>
          </mat-tab>

          <!-- ABA 3: ESTAQUEAMENTO DE TORRES (M04) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">straighten</mat-icon>
              Estaqueamento & Torres (M04)
            </ng-template>

            <div class="tab-content">
              @if ((currentRevision()?.transmissionLines?.length ?? 0) === 0) {
                <div class="empty-state technical-border">
                  <mat-icon>straighten</mat-icon>
                  <p>
                    Cadastre ao menos uma linha de transmissão nesta revisão
                    para gerenciar o estaqueamento.
                  </p>
                </div>
              } @else {
                <div class="staking-line-selector-bar technical-border">
                  <span class="label font-label-caps">Linha Selecionada:</span>
                  <div class="line-selector-pills">
                    @for (
                      line of currentRevision()?.transmissionLines ?? [];
                      track line.id
                    ) {
                      <button
                        type="button"
                        class="line-pill"
                        [class.active]="selectedStakingLineId() === line.id"
                        (click)="selectedStakingLineId.set(line.id!)"
                      >
                        <span class="mono font-bold">{{ line.code }}</span>
                        <span class="line-name-sub">{{ line.name }} ({{ line.refinedLengthKm }} km)</span>
                      </button>
                    }
                  </div>
                </div>

                @if (selectedStakingLineId()) {
                  <app-staking-table [lineId]="selectedStakingLineId()!" />
                }
              }
            </div>
          </mat-tab>

          <!-- ABA 4: FUNDAÇÕES E ESCAVAÇÕES (M05 / RN-12 / RN-13) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">foundation</mat-icon>
              Fundações & Escavações (M05)
            </ng-template>

            <div class="tab-content">
              @if ((currentRevision()?.transmissionLines?.length ?? 0) === 0) {
                <div class="empty-state technical-border">
                  <mat-icon>foundation</mat-icon>
                  <p>
                    Cadastre ao menos uma linha de transmissão nesta revisão
                    para visualizar os quantitativos de fundação.
                  </p>
                </div>
              } @else {
                <div class="staking-line-selector-bar technical-border">
                  <span class="label font-label-caps">Linha Selecionada:</span>
                  <div class="line-selector-pills">
                    @for (
                      line of currentRevision()?.transmissionLines ?? [];
                      track line.id
                    ) {
                      <button
                        type="button"
                        class="line-pill"
                        [class.active]="selectedFoundationLineId() === line.id"
                        (click)="selectedFoundationLineId.set(line.id!)"
                      >
                        <span class="mono font-bold">{{ line.code }}</span>
                        <span class="line-name-sub">{{ line.name }} ({{ line.refinedLengthKm }} km)</span>
                      </button>
                    }
                  </div>
                </div>

                @if (selectedFoundationLineId()) {
                  <app-foundation-quantities [lineId]="selectedFoundationLineId()!" />
                }
              }
            </div>
          </mat-tab>

          <!-- ABA 5: QUANTITATIVOS ELETROMECÂNICOS (M05) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">bolt</mat-icon>
              Eletromecânica (M05)
            </ng-template>

            <div class="tab-content">
              @if ((currentRevision()?.transmissionLines?.length ?? 0) === 0) {
                <div class="empty-state">
                  <mat-icon>info</mat-icon>
                  <p>Cadastre ao menos uma linha de transmissão para visualizar os quantitativos eletromecânicos de torres, cabos e acessórios.</p>
                </div>
              } @else {
                <div class="staking-line-selector-bar technical-border">
                  <span class="label font-label-caps">Linha Selecionada:</span>
                  <div class="line-selector-pills">
                    @for (
                      line of currentRevision()?.transmissionLines ?? [];
                      track line.id
                    ) {
                      <button
                        type="button"
                        class="line-pill"
                        [class.active]="selectedElectroLineId() === line.id"
                        (click)="selectedElectroLineId.set(line.id!)"
                      >
                        <span class="mono font-bold">{{ line.code }}</span>
                        <span class="line-name-sub">{{ line.name }} ({{ line.refinedLengthKm }} km)</span>
                      </button>
                    }
                  </div>
                </div>

                @if (selectedElectroLineId()) {
                  <app-electromechanical-quantities [lineId]="selectedElectroLineId()!" />
                }
              }
            </div>
          </mat-tab>

          <!-- ABA 6: PREÇOS, COMMODITIES & TRIBUTOS (M06) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">payments</mat-icon>
              Preços & Tributos (M06)
            </ng-template>

            <div class="tab-content">
              @if ((currentRevision()?.transmissionLines?.length ?? 0) === 0) {
                <div class="empty-state">
                  <mat-icon>info</mat-icon>
                  <p>Cadastre ao menos uma linha de transmissão para visualizar e calcular os preços de materiais e tributos.</p>
                </div>
              } @else {
                <div class="staking-line-selector-bar technical-border">
                  <span class="label font-label-caps">Linha Selecionada:</span>
                  <div class="line-selector-pills">
                    @for (
                      line of currentRevision()?.transmissionLines ?? [];
                      track line.id
                    ) {
                      <button
                        type="button"
                        class="line-pill"
                        [class.active]="selectedPricingLineId() === line.id"
                        (click)="selectedPricingLineId.set(line.id!)"
                      >
                        <span class="mono font-bold">{{ line.code }}</span>
                        <span class="line-name-sub">{{ line.name }} ({{ line.refinedLengthKm }} km)</span>
                      </button>
                    }
                  </div>
                </div>

                @if (selectedPricingLineId()) {
                  <app-material-pricing [lineId]="selectedPricingLineId()!" />
                }
              }
            </div>
          </mat-tab>

          <!-- ABA 7: CRONOGRAMA FÍSICO & CANTEIROS (M07) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">schedule</mat-icon>
              Cronograma Físico (M07)
            </ng-template>

            <div class="tab-content">
              @if ((currentRevision()?.transmissionLines?.length ?? 0) === 0) {
                <div class="empty-state">
                  <mat-icon>info</mat-icon>
                  <p>Cadastre ao menos uma linha de transmissão para visualizar o cronograma físico e canteiros.</p>
                </div>
              } @else {
                <div class="staking-line-selector-bar technical-border">
                  <span class="label font-label-caps">Linha Selecionada:</span>
                  <div class="line-selector-pills">
                    @for (
                      line of currentRevision()?.transmissionLines ?? [];
                      track line.id
                    ) {
                      <button
                        type="button"
                        class="line-pill"
                        [class.active]="selectedScheduleLineId() === line.id"
                        (click)="selectedScheduleLineId.set(line.id!)"
                      >
                        <span class="mono font-bold">{{ line.code }}</span>
                        <span class="line-name-sub">{{ line.name }} ({{ line.refinedLengthKm }} km)</span>
                      </button>
                    }
                  </div>
                </div>

                @if (selectedScheduleLineId()) {
                  <app-schedule-gantt [lineId]="selectedScheduleLineId()!" />
                  <app-camps-management [lineId]="selectedScheduleLineId()!" />
                }
              }
            </div>
          </mat-tab>

          <!-- ABA 8: HISTOGRAMA DE RECURSOS (M08) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">bar_chart</mat-icon>
              Histograma & Recursos (M08)
            </ng-template>

            <div class="tab-content">
              @if ((currentRevision()?.transmissionLines?.length ?? 0) === 0) {
                <div class="empty-state">
                  <mat-icon>info</mat-icon>
                  <p>Cadastre ao menos uma linha de transmissão para visualizar os histogramas de mão de obra e equipamentos.</p>
                </div>
              } @else {
                <div class="staking-line-selector-bar technical-border">
                  <span class="label font-label-caps">Linha Selecionada:</span>
                  <div class="line-selector-pills">
                    @for (
                      line of currentRevision()?.transmissionLines ?? [];
                      track line.id
                    ) {
                      <button
                        type="button"
                        class="line-pill"
                        [class.active]="selectedHistogramLineId() === line.id"
                        (click)="selectedHistogramLineId.set(line.id!)"
                      >
                        <span class="mono font-bold">{{ line.code }}</span>
                        <span class="line-name-sub">{{ line.name }} ({{ line.refinedLengthKm }} km)</span>
                      </button>
                    }
                  </div>
                </div>

                @if (selectedHistogramLineId()) {
                  <app-resource-histograms [lineId]="selectedHistogramLineId()!" />
                }
              }
            </div>
          </mat-tab>

          <!-- ABA 9: SERVIÇOS & FOLHAS CONTRATUAIS (M09) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">design_services</mat-icon>
              Serviços & CIP (M09)
            </ng-template>

            <div class="tab-content">
              @if (offer()) {
                <app-service-budget
                  [offerId]="offer()!.id"
                  [lines]="transmissionLineOptions()"
                />
              }
            </div>
          </mat-tab>

          <!-- ABA 10: RESULTADO ECONÔMICO & BDI (M10) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">monetization_on</mat-icon>
              Resultado & BDI (M10)
            </ng-template>

            <div class="tab-content">
              @if (offer()) {
                <app-economic-result
                  [offerId]="offer()!.id"
                  [lines]="transmissionLineOptions()"
                />
              }
            </div>
          </mat-tab>

          <!-- ABA 11: DESEMBOLSO & FLUXO DE CAIXA (M11) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">account_balance</mat-icon>
              Desembolso & Caixa (M11)
            </ng-template>

            <div class="tab-content">
              @if (offer()) {
                <app-cashflow
                  [offerId]="offer()!.id"
                  [lines]="transmissionLineOptions()"
                />
              }
            </div>
          </mat-tab>

          <!-- ABA 12: MATRIZ DE RISCOS (M12) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">warning_amber</mat-icon>
              Matriz de Riscos (M12)
            </ng-template>

            <div class="tab-content">
              @if (offer()) {
                <app-offer-risks
                  [offerId]="offer()!.id"
                  [lines]="transmissionLineOptions()"
                />
              }
            </div>
          </mat-tab>

          <!-- ABA 13: VERIFICAÇÕES DE INTEGRIDADE (M12) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">rule</mat-icon>
              Verificações & Integridade (M12)
            </ng-template>

            <div class="tab-content">
              @if (offer()) {
                <app-offer-checks
                  [offerId]="offer()!.id"
                  (navigateTo)="handleNavigateFromChecks($event)"
                />
              }
            </div>
          </mat-tab>

          <!-- ABA 14: PARÂMETROS E DATAS DA REVISÃO -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">event_note</mat-icon>
              Parâmetros e Datas da Revisão
            </ng-template>

            <div class="tab-content">
              <div class="params-header">
                <h3 class="font-display">Parâmetros Comerciais e Prazos de Edital</h3>
                <p class="section-subtitle">Premissas financeiras, CAPEX estimado ANEEL, RAP de referência e marcos temporais.</p>
              </div>

              <form
                [formGroup]="revParamsForm"
                class="params-grid technical-border p-4 bg-surface"
                (ngSubmit)="saveRevisionChanges()"
              >
                <mat-form-field
                  appearance="outline"
                  floatLabel="always"
                  class="col-6"
                >
                  <mat-label>Leilão / Edital *</mat-label>
                  <input
                    matInput
                    id="revAuctionName"
                    formControlName="auctionName"
                    [readonly]="!isDraft()"
                  />
                </mat-form-field>

                <mat-form-field
                  appearance="outline"
                  floatLabel="always"
                  class="col-6"
                >
                  <mat-label>Lote *</mat-label>
                  <input
                    matInput
                    id="revLotName"
                    formControlName="lotName"
                    [readonly]="!isDraft()"
                  />
                </mat-form-field>

                <mat-form-field
                  appearance="outline"
                  floatLabel="always"
                  class="col-3"
                >
                  <mat-label>Data da Oferta *</mat-label>
                  <input
                    matInput
                    id="revOfferDate"
                    formControlName="offerDate"
                    [readonly]="!isDraft()"
                  />
                </mat-form-field>

                <mat-form-field
                  appearance="outline"
                  floatLabel="always"
                  class="col-3"
                >
                  <mat-label>Data do Leilão</mat-label>
                  <input
                    matInput
                    id="revAuctionDate"
                    formControlName="auctionDate"
                    [readonly]="!isDraft()"
                  />
                </mat-form-field>

                <mat-form-field
                  appearance="outline"
                  floatLabel="always"
                  class="col-3"
                >
                  <mat-label>Início Cronograma</mat-label>
                  <input
                    matInput
                    id="revScheduleStartDate"
                    formControlName="scheduleStartDate"
                    [readonly]="!isDraft()"
                  />
                </mat-form-field>

                <mat-form-field
                  appearance="outline"
                  floatLabel="always"
                  class="col-3"
                >
                  <mat-label>Entrada em Operação</mat-label>
                  <input
                    matInput
                    id="revCommercialOperationDate"
                    formControlName="commercialOperationDate"
                    [readonly]="!isDraft()"
                  />
                </mat-form-field>

                @if (hasRevScheduleWarning()) {
                  <div class="col-12 alert-schedule" role="alert">
                    <mat-icon>warning</mat-icon>
                    <span>
                      <strong>Alerta de Cronograma (RN-02):</strong> Data de
                      início posterior à data prevista de entrada em operação do
                      edital.
                    </span>
                  </div>
                }

                <mat-form-field
                  appearance="outline"
                  floatLabel="always"
                  class="col-4"
                >
                  <mat-label>CAPEX Estimado ANEEL</mat-label>
                  <input
                    matInput
                    id="revEstimatedCapex"
                    formControlName="estimatedCapex"
                    [readonly]="!isDraft()"
                  />
                </mat-form-field>

                <mat-form-field
                  appearance="outline"
                  floatLabel="always"
                  class="col-4"
                >
                  <mat-label>RAP Máxima Edital</mat-label>
                  <input
                    matInput
                    id="revMaxRap"
                    formControlName="maxRap"
                    [readonly]="!isDraft()"
                  />
                </mat-form-field>

                <mat-form-field
                  appearance="outline"
                  floatLabel="always"
                  class="col-4"
                >
                  <mat-label>RAP Vencedora Estimada</mat-label>
                  <input
                    matInput
                    id="revWinningRap"
                    formControlName="winningRap"
                    [readonly]="!isDraft()"
                  />
                </mat-form-field>

                <mat-form-field
                  appearance="outline"
                  floatLabel="always"
                  class="col-12"
                >
                  <mat-label>Notas da Revisão</mat-label>
                  <textarea
                    matInput
                    id="revNotes"
                    formControlName="notes"
                    rows="3"
                    [readonly]="!isDraft()"
                  ></textarea>
                </mat-form-field>

                @if (isDraft()) {
                  <div class="col-12 actions-right">
                    <button
                      mat-flat-button
                      color="primary"
                      type="submit"
                      [disabled]="saving() || revParamsForm.invalid"
                    >
                      <mat-icon>{{ saving() ? 'hourglass_empty' : 'save' }}</mat-icon>
                      {{ saving() ? 'Salvando…' : 'Salvar parâmetros' }}
                    </button>
                  </div>
                }
              </form>
            </div>
          </mat-tab>

          <!-- ABA 15: TRILHA DE AUDITORIA IMUTÁVEL (M12, RF-65) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">history_edu</mat-icon>
              Trilha de Auditoria (RF-65)
            </ng-template>

            <div class="tab-content">
              @if (offer()) {
                <app-offer-audit [offerId]="offer()!.id.toString()" />
              }
            </div>
          </mat-tab>

          <!-- ABA 16: CENTRAL DE EXPORTAÇÕES CONTRATUAIS (M12, RF-47, RF-48, RF-50, RF-60, RNF-18) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">file_download</mat-icon>
              Central de Exportação (M12)
            </ng-template>

            <div class="tab-content">
              @if (offer()) {
                <app-offer-export
                  [offerId]="offer()!.id"
                  [offerName]="offer()!.name"
                />
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </section>
  `,
  styles: `
    .offer-detail-page {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .editorial-breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--solaris-on-surface-variant);
    }
    .editorial-breadcrumb a {
      color: var(--solaris-primary);
      text-decoration: none;
    }
    .editorial-breadcrumb .sep {
      color: var(--solaris-outline-variant);
    }
    .editorial-breadcrumb .current {
      color: var(--solaris-on-surface);
    }
    .offer-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .header-main {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .code-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .offer-code {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--solaris-primary);
    }
    .badge-cloned {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: var(--solaris-surface-low);
      color: var(--solaris-on-surface-variant);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      border: 1px solid var(--solaris-outline-variant);
    }
    .badge-cloned mat-icon {
      font-size: 0.875rem;
      width: 0.875rem;
      height: 0.875rem;
    }
    .page-title {
      font-size: 1.85rem;
      font-weight: 700;
      color: var(--solaris-on-surface);
      margin: 0;
      line-height: 1.2;
    }
    .client-subtitle {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--solaris-on-surface-variant);
      font-size: 0.875rem;
      margin: 0;
    }
    .client-subtitle mat-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
    }
    .sep-dot {
      color: var(--solaris-outline-variant);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .revision-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--solaris-surface-low);
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .revision-selector {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .revision-pills {
      display: flex;
      gap: 0.4rem;
    }
    .rev-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.85rem;
      border-radius: 6px;
      border: 1px solid var(--solaris-outline-variant);
      background: var(--solaris-surface);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    .rev-pill:hover {
      background: var(--solaris-surface-high);
      border-color: var(--solaris-primary);
    }
    .rev-pill.active {
      background: var(--solaris-primary);
      color: #ffffff;
      border-color: var(--solaris-primary);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .status-dot[data-status='DRAFT'] {
      background: #94a3b8;
    }
    .status-dot[data-status='FROZEN'] {
      background: #0284c7;
    }
    .status-dot[data-status='DELIVERED'] {
      background: #16a34a;
    }
    .revision-status-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .status-chip {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .status-chip[data-status='DRAFT'] {
      background: var(--solaris-surface-high);
      color: var(--solaris-on-surface);
      border: 1px solid var(--solaris-outline-variant);
    }
    .status-chip[data-status='FROZEN'] {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #7dd3fc;
    }
    .status-chip[data-status='DELIVERED'] {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .health-badge-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .health-badge-btn.healthy {
      background: #dcfce7;
      color: #15803d;
      border-color: #86efac;
    }
    .health-badge-btn.warning {
      background: #fef3c7;
      color: #92400e;
      border-color: #fde68a;
    }
    .health-badge-btn.critical {
      background: #fee2e2;
      color: #991b1b;
      border-color: #fca5a5;
    }
    .health-badge-btn:hover {
      filter: brightness(0.95);
    }
    .immutable-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      color: #0369a1;
      padding: 0.85rem 1.25rem;
      border-radius: 8px;
      font-size: 0.875rem;
    }
    .tab-icon {
      font-size: 1.1rem;
      width: 1.1rem;
      height: 1.1rem;
      margin-right: 0.4rem;
    }
    .tab-content {
      padding-top: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .lines-summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
      gap: 1rem;
    }
    .section-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .section-subtitle {
      font-size: 0.85rem;
      color: var(--solaris-on-surface-variant);
      margin: 0.25rem 0 0 0;
    }
    .line-edit-box {
      background: var(--solaris-surface-low);
      padding: 1.5rem;
      border-radius: 8px;
    }
    .line-edit-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .line-edit-header h4 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
    }
    .line-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 1rem;
    }
    .col-12 {
      grid-column: span 12;
    }
    .col-6 {
      grid-column: span 6;
    }
    .col-4 {
      grid-column: span 4;
    }
    .col-3 {
      grid-column: span 3;
    }
    .uf-allocation-panel {
      font-size: 0.85rem;
      color: var(--solaris-on-surface);
      display: flex;
      gap: 0.75rem;
      align-items: center;
      padding: 0.75rem;
      background: var(--solaris-surface);
      border: 1px solid var(--solaris-outline-variant);
      border-radius: 6px;
    }
    .line-uf-error {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--solaris-error);
      font-weight: 600;
      font-size: 0.85rem;
      padding: 0.5rem 0.75rem;
      background: #fef2f2;
      border-radius: 6px;
      border: 1px solid #fecaca;
    }
    .line-form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .scope-header-desc {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .scope-matrix-table tr.client-item {
      background: #f8fafc;
    }
    .native-select {
      padding: 0.4rem 0.6rem;
      border-radius: 4px;
      border: 1px solid var(--solaris-outline-variant);
      background: var(--solaris-surface);
      font-size: 0.85rem;
      font-family: inherit;
    }
    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .center-col {
      text-align: center;
    }
    .save-bar {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
    }
    .params-header {
      margin-bottom: 0.75rem;
    }
    .params-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 1rem;
      border-radius: 8px;
    }
    .alert-schedule {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 0.85rem 1rem;
      border-radius: 6px;
      font-size: 0.875rem;
    }
    .alert-schedule mat-icon {
      color: #b45309;
    }
    .actions-right {
      display: flex;
      justify-content: flex-end;
      margin-top: 1rem;
    }
    .danger-btn {
      color: var(--solaris-error);
    }
    .staking-line-selector-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.25rem;
      background: var(--solaris-surface-low);
      border-radius: 8px;
    }
    .line-selector-pills {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .line-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      border: 1px solid var(--solaris-outline-variant);
      background: var(--solaris-surface);
      cursor: pointer;
      transition: all 0.2s;
    }
    .line-pill.active {
      background: #e0f2fe;
      border-color: #0284c7;
      color: #0369a1;
    }
    .line-name-sub {
      font-size: 0.8rem;
      color: var(--solaris-on-surface-variant);
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
      color: var(--solaris-on-surface-variant);
    }
    .spin-icon {
      animation: spin 1.5s linear infinite;
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }
    @keyframes spin {
      100% {
        transform: rotate(360deg);
      }
    }
    .error-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: var(--solaris-error);
    }
    .p-4 {
      padding: 1rem;
    }
    .bg-surface {
      background: var(--solaris-surface);
    }
    .ml-1 {
      margin-left: 0.25rem;
    }
  `,
})
export class OfferDetailComponent {
  private readonly api = inject(OffersApi);
  private readonly checksApi = inject(ChecksApiService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly ufs = BRAZILIAN_UFS;
  readonly offer = signal<OfferDetail | null>(null);
  readonly offerHealth = signal<OfferHealthSummary | null>(null);
  readonly selectedRevisionNumber = signal<number>(0);
  readonly activeTabIndex = signal<number>(0);
  readonly selectedStakingLineId = signal<number | null>(null);
  readonly selectedFoundationLineId = signal<number | null>(null);
  readonly selectedElectroLineId = signal<number | null>(null);
  readonly selectedPricingLineId = signal<number | null>(null);
  readonly selectedScheduleLineId = signal<number | null>(null);
  readonly selectedHistogramLineId = signal<number | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');

  // Line inline form state
  readonly isEditingLine = signal(false);
  readonly editingLineIndex = signal<number>(-1);
  readonly lineUfError = signal<string | null>(null);

  // Scope items local signal for responsive binding
  readonly scopeItems = signal<ScopeMatrixItemPayload[]>([]);

  protected readonly lineColumns = [
    'code',
    'name',
    'nominalVoltageKv',
    'lengths',
    'circuits',
    'ufs',
    'actions',
  ];

  readonly currentRevision = computed<OfferRevisionItem | null>(() => {
    const off = this.offer();
    if (!off || !off.revisions) return null;
    return (
      off.revisions.find(
        (r) => r.revisionNumber === this.selectedRevisionNumber(),
      ) ??
      off.revisions[off.revisions.length - 1] ??
      null
    );
  });

  readonly isDraft = computed(() => this.currentRevision()?.status === 'DRAFT');
  readonly isFrozen = computed(
    () => this.currentRevision()?.status === 'FROZEN',
  );
  readonly isDelivered = computed(
    () => this.currentRevision()?.status === 'DELIVERED',
  );

  readonly totalRefinedKm = computed(() => {
    const lines = this.currentRevision()?.transmissionLines ?? [];
    const total = lines.reduce(
      (sum, l) => sum + (Number(l.refinedLengthKm) || 0),
      0,
    );
    return total.toFixed(3);
  });

  readonly totalReportKm = computed(() => {
    const lines = this.currentRevision()?.transmissionLines ?? [];
    const total = lines.reduce(
      (sum, l) => sum + (Number(l.reportLengthKm) || 0),
      0,
    );
    return total.toFixed(3);
  });

  readonly transmissionLineOptions = computed(() => {
    const lines = this.currentRevision()?.transmissionLines ?? [];
    return lines
      .filter((l) => l.id != null)
      .map((l) => ({ id: l.id!, name: `${l.code} - ${l.name}` }));
  });

  readonly lineForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    nominalVoltageKv: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(POSITIVE_DECIMAL_PATTERN),
        decimalScaleValidator(2),
      ],
    }),
    refinedLengthKm: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(POSITIVE_DECIMAL_PATTERN),
        decimalScaleValidator(3),
      ],
    }),
    reportLengthKm: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(POSITIVE_DECIMAL_PATTERN),
        decimalScaleValidator(3),
      ],
    }),
    circuitCount: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    bundleConductorCount: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    destinationStatePrimary: new FormControl('PR', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    destinationPercentagePrimary: new FormControl('100.00', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(POSITIVE_DECIMAL_PATTERN),
        decimalScaleValidator(2),
      ],
    }),
    destinationStateSecondary: new FormControl<string | null>(null),
    destinationPercentageSecondary: new FormControl<string | null>(null, [
      Validators.pattern(POSITIVE_DECIMAL_PATTERN),
      decimalScaleValidator(2),
    ]),
  });

  readonly revParamsForm = new FormGroup({
    auctionName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    lotName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    offerDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(DATE_PATTERN)],
    }),
    auctionDate: new FormControl('', [Validators.pattern(DATE_PATTERN)]),
    scheduleStartDate: new FormControl('', [Validators.pattern(DATE_PATTERN)]),
    commercialOperationDate: new FormControl('', [
      Validators.pattern(DATE_PATTERN),
    ]),
    estimatedCapex: new FormControl('', [
      Validators.pattern(POSITIVE_DECIMAL_PATTERN),
      decimalScaleValidator(2),
    ]),
    maxRap: new FormControl('', [
      Validators.pattern(POSITIVE_DECIMAL_PATTERN),
      decimalScaleValidator(2),
    ]),
    winningRap: new FormControl('', [
      Validators.pattern(POSITIVE_DECIMAL_PATTERN),
      decimalScaleValidator(2),
    ]),
    notes: new FormControl('', [Validators.maxLength(1000)]),
  });

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadOffer(Number(idParam));
    }
  }

  statusLabel(status: OfferRevisionStatus): string {
    return REVISION_STATUS_LABELS[status] ?? status;
  }

  selectRevision(revNum: number): void {
    this.selectedRevisionNumber.set(revNum);
    this.isEditingLine.set(false);
    this.syncRevisionToForm();
  }

  hasRevScheduleWarning(): boolean {
    const start = this.revParamsForm.controls.scheduleStartDate.value;
    const end = this.revParamsForm.controls.commercialOperationDate.value;
    return !!(start && end && start > end);
  }

  // --- Linhas de Transmissão ---
  openAddLineForm(): void {
    this.editingLineIndex.set(-1);
    this.lineUfError.set(null);
    this.lineForm.reset({
      code: `LT-${(this.currentRevision()?.transmissionLines?.length ?? 0) + 1}`,
      name: '',
      nominalVoltageKv: '500.00',
      refinedLengthKm: '100.000',
      reportLengthKm: '100.000',
      circuitCount: 1,
      bundleConductorCount: 1,
      destinationStatePrimary: 'PR',
      destinationPercentagePrimary: '100.00',
      destinationStateSecondary: null,
      destinationPercentageSecondary: null,
    });
    this.isEditingLine.set(true);
  }

  editLine(index: number): void {
    const line = this.currentRevision()?.transmissionLines?.[index];
    if (!line) return;
    this.editingLineIndex.set(index);
    this.lineUfError.set(null);
    this.lineForm.patchValue({
      code: line.code,
      name: line.name,
      nominalVoltageKv: line.nominalVoltageKv,
      refinedLengthKm: line.refinedLengthKm,
      reportLengthKm: line.reportLengthKm,
      circuitCount: line.circuitCount,
      bundleConductorCount: line.bundleConductorCount,
      destinationStatePrimary: line.destinationStatePrimary,
      destinationPercentagePrimary: line.destinationPercentagePrimary,
      destinationStateSecondary: line.destinationStateSecondary,
      destinationPercentageSecondary: line.destinationPercentageSecondary,
    });
    this.isEditingLine.set(true);
  }

  cancelLineEdit(): void {
    this.isEditingLine.set(false);
    this.lineUfError.set(null);
  }

  saveLine(): void {
    if (this.lineForm.invalid) {
      this.lineForm.markAllAsTouched();
      return;
    }

    const raw = this.lineForm.getRawValue();
    const p1 = Number(raw.destinationPercentagePrimary) || 0;
    const p2 = raw.destinationPercentageSecondary
      ? Number(raw.destinationPercentageSecondary) || 0
      : 0;
    const totalUf = Math.round((p1 + p2) * 100) / 100;

    if (totalUf !== 100) {
      this.lineUfError.set(
        `A soma dos percentuais das UFs deve ser exatamente 100,00% (atual: ${totalUf.toFixed(2)}%)`,
      );
      return;
    }

    this.lineUfError.set(null);
    const lineItem: TransmissionLineItem = {
      code: raw.code.trim(),
      name: raw.name.trim(),
      nominalVoltageKv: raw.nominalVoltageKv.trim(),
      refinedLengthKm: raw.refinedLengthKm.trim(),
      reportLengthKm: raw.reportLengthKm.trim(),
      circuitCount: raw.circuitCount,
      bundleConductorCount: raw.bundleConductorCount,
      destinationStatePrimary: raw.destinationStatePrimary.trim(),
      destinationPercentagePrimary: raw.destinationPercentagePrimary.trim(),
      destinationStateSecondary: orNull(raw.destinationStateSecondary),
      destinationPercentageSecondary: orNull(
        raw.destinationPercentageSecondary,
      ),
    };

    const currentLines = [...(this.currentRevision()?.transmissionLines ?? [])];
    const idx = this.editingLineIndex();
    if (idx === -1) {
      currentLines.push(lineItem);
    } else {
      currentLines[idx] = lineItem;
    }

    this.isEditingLine.set(false);
    this.persistRevision({ transmissionLines: currentLines });
  }

  removeLine(index: number): void {
    const currentLines = [...(this.currentRevision()?.transmissionLines ?? [])];
    currentLines.splice(index, 1);
    this.persistRevision({ transmissionLines: currentLines });
  }

  // --- Matriz de Escopo ---
  loadBenchmarkScope(): void {
    const items: ScopeMatrixItemPayload[] = CANONICAL_SCOPE_ITEMS.map((c) => ({
      itemCode: c.itemCode,
      itemName: c.itemName,
      category: c.category,
      responsibleParty: 'CONTRACTOR' as ScopeResponsibleParty,
      acceptsDirectBilling: false,
      currencyRiskParty: 'CONTRACTOR' as ScopeResponsibleParty,
      commodityRiskParty: 'CONTRACTOR' as ScopeResponsibleParty,
      notes: null,
    }));
    this.scopeItems.set(items);
    this.persistRevision({ scopeMatrixItems: items });
  }

  updateScopeField(
    index: number,
    field: keyof ScopeMatrixItemPayload,
    value: unknown,
  ): void {
    const list = [...this.scopeItems()];
    if (!list[index]) return;
    list[index] = { ...list[index], [field]: value };
    this.scopeItems.set(list);
  }

  saveRevisionChanges(): void {
    if (this.revParamsForm.invalid) {
      this.revParamsForm.markAllAsTouched();
      return;
    }
    const raw = this.revParamsForm.getRawValue();
    this.persistRevision({
      auctionName: raw.auctionName.trim(),
      lotName: raw.lotName.trim(),
      offerDate: raw.offerDate.trim(),
      auctionDate: orNull(raw.auctionDate),
      scheduleStartDate: orNull(raw.scheduleStartDate),
      commercialOperationDate: orNull(raw.commercialOperationDate),
      estimatedCapex: orNull(raw.estimatedCapex),
      maxRap: orNull(raw.maxRap),
      winningRap: orNull(raw.winningRap),
      notes: orNull(raw.notes),
      scopeMatrixItems: this.scopeItems(),
    });
  }

  // --- Transições de Revisão ---
  freezeRevision(): void {
    if (
      !confirm(
        'Tem certeza de que deseja fechar esta revisão? Ela se tornará imutável para auditoria.',
      )
    ) {
      return;
    }
    this.persistRevision({ status: 'FROZEN' });
  }

  markDelivered(): void {
    if (
      !confirm(
        'Deseja marcar esta revisão como formalmente entregue ao cliente?',
      )
    ) {
      return;
    }
    this.persistRevision({ status: 'DELIVERED' });
  }

  createNewRevision(): void {
    const off = this.offer();
    if (!off) return;
    const nextNum = off.revisions.length;
    const notes = prompt(
      `Criar nova revisão R${nextNum}. Informe as notas descritivas:`,
      `Revisão R${nextNum} iniciada a partir de R${this.selectedRevisionNumber()}`,
    );
    if (notes === null) return;

    this.saving.set(true);
    this.api
      .createNewRevision(off.id, {
        notes: notes.trim() || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.offer.set(updated);
          this.selectedRevisionNumber.set(nextNum);
          this.syncRevisionToForm();
          this.saving.set(false);
          this.snackBar.open(`Revisão R${nextNum} criada com sucesso!`, 'OK', {
            duration: 3000,
          });
        },
        error: (err) => {
          this.saving.set(false);
          const msg =
            err.error?.message || 'Não foi possível criar a nova revisão.';
          this.snackBar.open(msg, 'Fechar', { duration: 5000 });
        },
      });
  }

  cloneCurrentOffer(): void {
    const off = this.offer();
    if (!off) return;
    const newCode = prompt(
      'Informe o código da nova proposta:',
      `${off.code}-COPIA`,
    );
    if (!newCode || !newCode.trim()) return;

    const newName = prompt(
      'Informe o nome da nova proposta:',
      `${off.name} (Cópia)`,
    );
    if (!newName || !newName.trim()) return;

    this.saving.set(true);
    this.api
      .clone(off.id, {
        targetCode: newCode.trim(),
        targetName: newName.trim(),
      })
      .subscribe({
        next: (cloned) => {
          this.snackBar.open('Proposta clonada com sucesso!', 'OK', {
            duration: 4000,
          });
          this.router.navigate(['/offers', cloned.id]);
        },
        error: (err) => {
          this.saving.set(false);
          const msg =
            err.error?.message || 'Não foi possível clonar a proposta.';
          this.snackBar.open(msg, 'Fechar', { duration: 5000 });
        },
      });
  }

  private persistRevision(payload: UpdateOfferRevisionPayload): void {
    const off = this.offer();
    const rev = this.currentRevision();
    if (!off || !rev) return;

    this.saving.set(true);
    this.api.updateRevision(off.id, rev.revisionNumber, payload).subscribe({
      next: (updated) => {
        this.offer.set(updated);
        this.syncRevisionToForm();
        this.saving.set(false);
        this.snackBar.open('Revisão salva com sucesso!', 'OK', {
          duration: 3000,
        });
      },
      error: (err) => {
        this.saving.set(false);
        const msg =
          err.error?.message ||
          'Não foi possível salvar as alterações na revisão.';
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
      },
    });
  }

  private loadOffer(id: number): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getById(id).subscribe({
      next: (detail) => {
        this.offer.set(detail);
        const latestRev = detail.revisions[detail.revisions.length - 1];
        this.selectedRevisionNumber.set(
          latestRev ? latestRev.revisionNumber : 0,
        );
        this.syncRevisionToForm();
        this.loadOfferHealth(id);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(
          'Não foi possível carregar a proposta; verifique o ID e tente novamente',
        );
      },
    });
  }

  loadOfferHealth(id: number): void {
    this.checksApi.getHealthChecks(id).subscribe({
      next: (summary) => this.offerHealth.set(summary),
      error: () => {},
    });
  }

  handleNavigateFromChecks(target: CheckNavigationTarget): void {
    const tabMap: Record<string, number> = {
      lines: 0,
      scope: 1,
      staking: 2,
      foundations: 3,
      electro: 4,
      pricing: 5,
      tax: 5,
      schedule: 6,
      camps: 7,
      histogram: 8,
      services: 9,
      result: 10,
      cashflow: 11,
      risks: 12,
      checks: 13,
      params: 14,
    };
    const idx = tabMap[target.tab];
    if (idx !== undefined) {
      this.activeTabIndex.set(idx);
    }
    if (target.lineId) {
      const numId = Number(target.lineId);
      this.selectedStakingLineId.set(numId);
      this.selectedFoundationLineId.set(numId);
      this.selectedElectroLineId.set(numId);
      this.selectedPricingLineId.set(numId);
      this.selectedScheduleLineId.set(numId);
      this.selectedHistogramLineId.set(numId);
    }
  }

  private syncRevisionToForm(): void {
    const rev = this.currentRevision();
    if (!rev) return;
    this.revParamsForm.patchValue({
      auctionName: rev.auctionName,
      lotName: rev.lotName,
      offerDate: rev.offerDate,
      auctionDate: rev.auctionDate ?? '',
      scheduleStartDate: rev.scheduleStartDate ?? '',
      commercialOperationDate: rev.commercialOperationDate ?? '',
      estimatedCapex: rev.estimatedCapex ?? '',
      maxRap: rev.maxRap ?? '',
      winningRap: rev.winningRap ?? '',
      notes: rev.notes ?? '',
    });
    this.scopeItems.set(rev.scopeMatrixItems ?? []);

    // Atualizar linha selecionada para as abas de estaqueamento e fundações
    const lines = rev.transmissionLines ?? [];
    if (
      !this.selectedStakingLineId() ||
      !lines.some((l) => l.id === this.selectedStakingLineId())
    ) {
      this.selectedStakingLineId.set(lines[0]?.id ?? null);
    }
    if (
      !this.selectedFoundationLineId() ||
      !lines.some((l) => l.id === this.selectedFoundationLineId())
    ) {
      this.selectedFoundationLineId.set(lines[0]?.id ?? null);
    }
    if (
      !this.selectedElectroLineId() ||
      !lines.some((l) => l.id === this.selectedElectroLineId())
    ) {
      this.selectedElectroLineId.set(lines[0]?.id ?? null);
    }
    if (
      !this.selectedPricingLineId() ||
      !lines.some((l) => l.id === this.selectedPricingLineId())
    ) {
      this.selectedPricingLineId.set(lines[0]?.id ?? null);
    }
    if (
      !this.selectedScheduleLineId() ||
      !lines.some((l) => l.id === this.selectedScheduleLineId())
    ) {
      this.selectedScheduleLineId.set(lines[0]?.id ?? null);
    }
    if (
      !this.selectedHistogramLineId() ||
      !lines.some((l) => l.id === this.selectedHistogramLineId())
    ) {
      this.selectedHistogramLineId.set(lines[0]?.id ?? null);
    }
  }

  openStakingForLine(lineId?: number): void {
    if (lineId) {
      this.selectedStakingLineId.set(lineId);
      this.activeTabIndex.set(2);
    }
  }

  openFoundationsForLine(lineId?: number): void {
    if (lineId) {
      this.selectedFoundationLineId.set(lineId);
      this.activeTabIndex.set(3);
    }
  }

  openElectroForLine(lineId?: number): void {
    if (lineId) {
      this.selectedElectroLineId.set(lineId);
      this.activeTabIndex.set(4);
    }
  }

  openPricingForLine(lineId?: number): void {
    if (lineId) {
      this.selectedPricingLineId.set(lineId);
      this.activeTabIndex.set(5);
    }
  }

  openScheduleForLine(lineId?: number): void {
    if (lineId) {
      this.selectedScheduleLineId.set(lineId);
      this.activeTabIndex.set(6);
    }
  }

  openHistogramForLine(lineId?: number): void {
    if (lineId) {
      this.selectedHistogramLineId.set(lineId);
      this.activeTabIndex.set(7);
    }
  }

  openServices(): void {
    this.activeTabIndex.set(8);
  }

  openEconomicResult(): void {
    this.activeTabIndex.set(9);
  }

  openCashflow(): void {
    this.activeTabIndex.set(10);
  }
}
