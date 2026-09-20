import { DecimalPipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ACCESS_DIFFICULTIES,
  ACCESS_DIFFICULTY_LABELS,
  AccessDifficulty,
  BatchAssignStakingPayload,
  FoundationTypeSummary,
  PaginatedStakingTowers,
  SoilTypeSummary,
  StakingPaginationQuery,
  StakingSummary,
  StakingTowerInput,
  StakingTowerItem,
  StakingValidationSummary,
} from '@lt-offers/domain';
import { FoundationTypesApi } from '../catalogs/foundation-types-api.service';
import { SoilTypesApi } from '../catalogs/soil-types-api.service';
import { PlsCaddImportDialogComponent } from './pls-cadd-import-dialog.component';
import { PreliminaryStakingFormComponent } from './preliminary-staking-form.component';
import { StakingApi } from './staking-api.service';
import { TowerFoundationSchematicComponent } from './tower-foundation-schematic.component';

@Component({
  selector: 'app-staking-table',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatTableModule,
    MatChipsModule,
    MatCheckboxModule,
    MatTooltipModule,
    DecimalPipe,
    PlsCaddImportDialogComponent,
    PreliminaryStakingFormComponent,
    TowerFoundationSchematicComponent,
  ],
  template: `
    <div class="staking-container">
      <!-- Summary / Metrics Bar -->
      <div class="metrics-grid">
        <div class="kpi-card">
          <span class="kpi-label">Total de Estruturas</span>
          <span class="kpi-value mono">{{ summary().totalTowers }}</span>
          <span class="kpi-subtext">Estaqueamento ativo</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Extensão de Estacas</span>
          <span class="kpi-value mono text-primary">
            {{ summary().minStationMeters }} m →
            {{ summary().maxStationMeters }} m
          </span>
          <span class="kpi-subtext">Vão total acumulado</span>
        </div>
        <div
          class="kpi-card"
          [class.has-issue]="summary().unassignedSoilCount > 0"
        >
          <span class="kpi-label">Solos Pendentes</span>
          <span
            class="kpi-value mono"
            [class.text-danger]="summary().unassignedSoilCount > 0"
          >
            {{ summary().unassignedSoilCount }}
          </span>
          <span class="kpi-subtext">{{
            summary().unassignedSoilCount > 0
              ? 'Requer sondagem/catálogo'
              : '100% atribuído'
          }}</span>
        </div>
        <div
          class="kpi-card"
          [class.has-issue]="summary().unassignedFoundationCount > 0"
        >
          <span class="kpi-label">Fundações Pendentes</span>
          <span
            class="kpi-value mono"
            [class.text-danger]="summary().unassignedFoundationCount > 0"
          >
            {{ summary().unassignedFoundationCount }}
          </span>
          <span class="kpi-subtext">{{
            summary().unassignedFoundationCount > 0
              ? 'Pendente dimensionamento'
              : '100% definido'
          }}</span>
        </div>
        <div
          class="kpi-card"
          [class.has-issue]="summary().invalidCombinationsCount > 0"
        >
          <span class="kpi-label">Inconsistências (RN-13)</span>
          <span
            class="kpi-value mono"
            [class.text-danger]="summary().invalidCombinationsCount > 0"
          >
            {{ summary().invalidCombinationsCount }}
          </span>
          <span class="kpi-subtext">{{
            summary().invalidCombinationsCount > 0
              ? 'Incompatibilidade estrutural'
              : 'Conformidade OK'
          }}</span>
        </div>
      </div>

      <!-- Integrity Warnings Banner -->
      @if (integritySummary()?.invalidCombinations?.length; as invCount) {
        @if (invCount > 0) {
          <div class="integrity-alert danger technical-border" role="alert">
            <mat-icon>gpp_bad</mat-icon>
            <div class="alert-content">
              <strong
                >Inconsistência de Engenharia Geotécnica / Estrutural
                (RN-13):</strong
              >
              <p>
                Existem {{ invCount }} torres com combinação de solo e fundação
                sem matriz de volume cadastrada no catálogo.
              </p>
              <ul class="inconsistent-list">
                @for (
                  item of integritySummary()!.invalidCombinations.slice(0, 3);
                  track item.towerNumber
                ) {
                  <li>
                    Torre <strong>{{ item.towerNumber }}</strong> (estaca
                    {{ item.stationMeters }} m): Solo
                    <code>{{ item.soilCode }}</code> × Fundação
                    <code>{{ item.foundationCode }}</code>
                  </li>
                }
                @if (invCount > 3) {
                  <li>
                    ...e mais {{ invCount - 3 }} estruturas inconsistentes.
                  </li>
                }
              </ul>
            </div>
          </div>
        }
      }

      @if (integritySummary()?.lengthDiscrepancyKm; as diff) {
        <div class="integrity-alert warning technical-border">
          <mat-icon>warning</mat-icon>
          <div class="alert-content">
            <strong>Divergência de Traçado Geométrico:</strong>
            <span>
              A extensão física da última estaca ({{
                integritySummary()!.totalStationLengthKm
              }}
              km) diverge em {{ diff }} km da extensão cadastrada para a linha
              ({{ integritySummary()!.lineRefinedLengthKm }} km).
            </span>
          </div>
        </div>
      }

      <!-- Action & Filter Bar -->
      <div class="actions-bar technical-border p-3 bg-surface">
        <div class="search-filter-group">
          <mat-form-field
            appearance="outline"
            class="density-compact search-input"
          >
            <mat-label>Buscar por torre</mat-label>
            <input
              matInput
              [(ngModel)]="searchQuery"
              (ngModelChange)="onFilterChanged()"
              placeholder="Ex: T01, 102A"
            />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            class="density-compact filter-select"
          >
            <mat-label>Tipo de Solo</mat-label>
            <mat-select
              [(ngModel)]="selectedSoilFilter"
              (selectionChange)="onFilterChanged()"
            >
              <mat-option [value]="undefined">Todos os Solos</mat-option>
              @for (s of soilTypes(); track s.id) {
                <mat-option [value]="s.id">{{ s.code }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            class="density-compact filter-select"
          >
            <mat-label>Fundação</mat-label>
            <mat-select
              [(ngModel)]="selectedFoundationFilter"
              (selectionChange)="onFilterChanged()"
            >
              <mat-option [value]="undefined">Todas as Fundações</mat-option>
              @for (f of foundationTypes(); track f.id) {
                <mat-option [value]="f.id">{{ f.code }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            class="density-compact filter-select"
          >
            <mat-label>Acesso</mat-label>
            <mat-select
              [(ngModel)]="selectedAccessFilter"
              (selectionChange)="onFilterChanged()"
            >
              <mat-option [value]="undefined">Todos os Acessos</mat-option>
              @for (acc of accessDifficulties; track acc) {
                <mat-option [value]="acc">{{ getAccessLabel(acc) }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <div class="action-buttons">
          <button
            mat-flat-button
            color="primary"
            type="button"
            (click)="openImportDialog()"
          >
            <mat-icon>upload_file</mat-icon> Importar PLS-CADD
          </button>
          <button
            mat-stroked-button
            type="button"
            (click)="togglePreliminaryMode()"
          >
            <mat-icon>tune</mat-icon>
            {{
              showPreliminary()
                ? 'Ocultar Distribuição'
                : 'Distribuição Paramétrica'
            }}
          </button>
          <button mat-stroked-button type="button" (click)="toggleSchematics()">
            <mat-icon>architecture</mat-icon>
            {{ showSchematics() ? 'Ocultar Esquemas' : 'Esquemas Técnicos' }}
          </button>
          <button
            mat-stroked-button
            type="button"
            (click)="openBatchAssignModal()"
            [disabled]="totalCount() === 0"
          >
            <mat-icon>layers</mat-icon> Atribuição em Lote
          </button>
          <button
            mat-stroked-button
            type="button"
            (click)="openAddTowerModal()"
          >
            <mat-icon>add</mat-icon> Nova Torre
          </button>
        </div>
      </div>

      <!-- Schematics Section -->
      @if (showSchematics()) {
        <div class="schematics-section">
          <div class="section-title-wrap">
            <h4 class="font-display">
              Esquemas Estruturais & Gabaritos de Locação
            </h4>
            <span class="font-label-caps badge badge-primary"
              >Padrão OFERTA CAD</span
            >
          </div>
          <app-tower-foundation-schematic />
        </div>
      }

      <!-- Preliminary Form Toggle Section -->
      @if (showPreliminary()) {
        <app-preliminary-staking-form
          [lineId]="lineId"
          (saved)="onPreliminarySaved()"
        />
        <mat-divider />
      }

      <!-- Main Staking Towers Table -->
      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando torres" />
      }

      <div class="table-card technical-border">
        <div class="table-wrapper">
          <table
            mat-table
            [dataSource]="towers()"
            class="technical-table staking-data-table"
          >
            <!-- Torre -->
            <ng-container matColumnDef="towerNumber">
              <th mat-header-cell *matHeaderCellDef>Torre</th>
              <td mat-cell *matCellDef="let t" class="mono font-bold">
                {{ t.towerNumber }}
              </td>
            </ng-container>

            <!-- Estaca -->
            <ng-container matColumnDef="stationMeters">
              <th mat-header-cell *matHeaderCellDef>Estaca (m)</th>
              <td mat-cell *matCellDef="let t" class="mono">
                {{ t.stationMeters | number: '1.2-2' }}
              </td>
            </ng-container>

            <!-- Extensão Pé -->
            <ng-container matColumnDef="bodyExtensionMeters">
              <th mat-header-cell *matHeaderCellDef>Extensão Pé (m)</th>
              <td mat-cell *matCellDef="let t" class="mono">
                {{ t.bodyExtensionMeters | number: '1.2-2' }}
              </td>
            </ng-container>

            <!-- Deflexão -->
            <ng-container matColumnDef="deflectionAngleDeg">
              <th mat-header-cell *matHeaderCellDef>Deflexão (°)</th>
              <td mat-cell *matCellDef="let t" class="mono">
                {{ t.deflectionAngleDeg | number: '1.2-2' }}
              </td>
            </ng-container>

            <!-- Offset -->
            <ng-container matColumnDef="lateralOffsetMeters">
              <th mat-header-cell *matHeaderCellDef>Offset (m)</th>
              <td mat-cell *matCellDef="let t" class="mono">
                {{ t.lateralOffsetMeters | number: '1.2-2' }}
              </td>
            </ng-container>

            <!-- Cota -->
            <ng-container matColumnDef="elevationMeters">
              <th mat-header-cell *matHeaderCellDef>Cota (m)</th>
              <td mat-cell *matCellDef="let t" class="mono">
                {{
                  t.elevationMeters
                    ? (t.elevationMeters | number: '1.2-2')
                    : '—'
                }}
              </td>
            </ng-container>

            <!-- Tipo Torre -->
            <ng-container matColumnDef="towerType">
              <th mat-header-cell *matHeaderCellDef>Tipo Torre</th>
              <td mat-cell *matCellDef="let t">
                @if (t.towerType) {
                  <span class="badge badge-primary mono">{{
                    t.towerType.code
                  }}</span>
                } @else {
                  <span class="text-muted">—</span>
                }
              </td>
            </ng-container>

            <!-- Tipo Solo -->
            <ng-container matColumnDef="soilType">
              <th mat-header-cell *matHeaderCellDef>Solo</th>
              <td mat-cell *matCellDef="let t">
                @if (t.soilType) {
                  <span class="badge badge-valid mono">{{
                    t.soilType.code
                  }}</span>
                } @else {
                  <span class="badge badge-error">Não atribuído</span>
                }
              </td>
            </ng-container>

            <!-- Fundação -->
            <ng-container matColumnDef="foundationType">
              <th mat-header-cell *matHeaderCellDef>Fundação</th>
              <td mat-cell *matCellDef="let t">
                @if (t.foundationType) {
                  <span class="badge badge-primary mono">{{
                    t.foundationType.code
                  }}</span>
                } @else {
                  <span class="badge badge-error">Não atribuído</span>
                }
              </td>
            </ng-container>

            <!-- Acesso -->
            <ng-container matColumnDef="accessDifficulty">
              <th mat-header-cell *matHeaderCellDef>Acesso</th>
              <td mat-cell *matCellDef="let t">
                <span
                  class="badge"
                  [class.badge-warning]="t.accessDifficulty === 'DIFFICULT'"
                  [class.badge-analysis]="t.accessDifficulty === 'CROSSING'"
                  [class.badge-neutral]="
                    t.accessDifficulty !== 'DIFFICULT' &&
                    t.accessDifficulty !== 'CROSSING'
                  "
                >
                  {{ getAccessLabel(t.accessDifficulty) }}
                </span>
              </td>
            </ng-container>

            <!-- Ações -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="text-right">
                Ações
              </th>
              <td mat-cell *matCellDef="let t" class="text-right">
                <button
                  mat-icon-button
                  (click)="openEditTowerModal(t)"
                  matTooltip="Editar estrutura"
                >
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  color="warn"
                  (click)="deleteTower(t)"
                  matTooltip="Excluir estrutura"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr
              mat-row
              *matRowDef="let t; columns: columns"
              [class.unassigned-row]="!t.soilTypeId || !t.foundationTypeId"
            ></tr>
          </table>

          @if (!loading() && towers().length === 0) {
            <div class="empty-state">
              <mat-icon class="empty-icon">view_list</mat-icon>
              <p>Nenhuma estrutura encontrada com os filtros selecionados.</p>
              <button
                mat-flat-button
                color="primary"
                type="button"
                (click)="openImportDialog()"
              >
                Importar arquivo PLS-CADD
              </button>
            </div>
          }
        </div>

        <!-- Pagination Controls -->
        <div class="pagination-bar">
          <div class="page-size-selector">
            <span class="label">Itens por página:</span>
            <select
              [ngModel]="pageSize()"
              (ngModelChange)="onPageSizeChanged($event)"
              class="density-compact page-select"
            >
              <option [value]="25">25</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
              <option [value]="250">250</option>
            </select>
          </div>

          <div class="pagination-info mono">
            Página {{ page() }} de {{ totalPages() }} ({{ totalCount() }}
            estruturas no total)
          </div>

          <div class="pagination-buttons">
            <button
              mat-icon-button
              [disabled]="page() <= 1"
              (click)="goToPage(1)"
              matTooltip="Primeira página"
            >
              <mat-icon>first_page</mat-icon>
            </button>
            <button
              mat-icon-button
              [disabled]="page() <= 1"
              (click)="goToPage(page() - 1)"
              matTooltip="Página anterior"
            >
              <mat-icon>chevron_left</mat-icon>
            </button>
            <button
              mat-icon-button
              [disabled]="page() >= totalPages()"
              (click)="goToPage(page() + 1)"
              matTooltip="Próxima página"
            >
              <mat-icon>chevron_right</mat-icon>
            </button>
            <button
              mat-icon-button
              [disabled]="page() >= totalPages()"
              (click)="goToPage(totalPages())"
              matTooltip="Última página"
            >
              <mat-icon>last_page</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Modals / Dialogs -->
      @if (showImportDialog()) {
        <app-pls-cadd-import-dialog
          [lineId]="lineId"
          (dismissed)="showImportDialog.set(false)"
          (importCompleted)="onImportCompleted()"
        />
      }

      <!-- Batch Assign Modal -->
      @if (showBatchAssignModal()) {
        <div
          class="dialog-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="batch-assign-title"
          tabindex="-1"
          (keyup.escape)="showBatchAssignModal.set(false)"
        >
          <div class="dialog-card modal-sm">
            <div class="dialog-header">
              <div class="title-wrap">
                <mat-icon class="header-icon">layers</mat-icon>
                <div>
                  <h3 id="batch-assign-title">Atribuição em Lote</h3>
                  <p class="subtitle">
                    Aplique solo, fundação ou acesso a trechos da linha (RF-19).
                  </p>
                </div>
              </div>
              <button
                mat-icon-button
                type="button"
                (click)="showBatchAssignModal.set(false)"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <mat-divider />
            <div class="dialog-body form-grid">
              <div class="form-row-2">
                <mat-form-field appearance="outline" class="density-compact">
                  <mat-label>Estaca Inicial (m)</mat-label>
                  <input
                    matInput
                    type="number"
                    [(ngModel)]="batchStartStation"
                    placeholder="Ex: 0"
                  />
                </mat-form-field>
                <mat-form-field appearance="outline" class="density-compact">
                  <mat-label>Estaca Final (m)</mat-label>
                  <input
                    matInput
                    type="number"
                    [(ngModel)]="batchEndStation"
                    placeholder="Ex: 15000"
                  />
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="density-compact">
                <mat-label>Atribuir Tipo de Solo</mat-label>
                <mat-select [(ngModel)]="batchSoilTypeId">
                  <mat-option [value]="undefined">Não alterar</mat-option>
                  @for (s of soilTypes(); track s.id) {
                    <mat-option [value]="s.id">{{ s.code }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="density-compact">
                <mat-label>Atribuir Tipo de Fundação</mat-label>
                <mat-select [(ngModel)]="batchFoundationTypeId">
                  <mat-option [value]="undefined">Não alterar</mat-option>
                  @for (f of foundationTypes(); track f.id) {
                    <mat-option [value]="f.id">{{ f.code }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="density-compact">
                <mat-label>Atribuir Dificuldade de Acesso</mat-label>
                <mat-select [(ngModel)]="batchAccessDifficulty">
                  <mat-option [value]="undefined">Não alterar</mat-option>
                  @for (acc of accessDifficulties; track acc) {
                    <mat-option [value]="acc">{{
                      getAccessLabel(acc)
                    }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <mat-divider />
            <div class="dialog-footer">
              <button
                mat-button
                type="button"
                (click)="showBatchAssignModal.set(false)"
              >
                Cancelar
              </button>
              <button
                mat-flat-button
                color="primary"
                type="button"
                (click)="applyBatchAssign()"
                [disabled]="applyingBatch()"
              >
                <mat-icon>{{
                  applyingBatch() ? 'hourglass_empty' : 'check'
                }}</mat-icon>
                <span>{{
                  applyingBatch() ? 'Aplicando...' : 'Aplicar Atribuição'
                }}</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Single Tower Edit Modal -->
      @if (editingTower(); as t) {
        <div
          class="dialog-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-tower-title"
          tabindex="-1"
          (keyup.escape)="editingTower.set(null)"
        >
          <div class="dialog-card modal-sm">
            <div class="dialog-header">
              <div class="title-wrap">
                <mat-icon class="header-icon">edit</mat-icon>
                <div>
                  <h3 id="edit-tower-title">
                    Editar Estrutura {{ t.towerNumber }}
                  </h3>
                  <p class="subtitle">
                    Ajuste os parâmetros geométricos e catálogos da torre.
                  </p>
                </div>
              </div>
              <button
                mat-icon-button
                type="button"
                (click)="editingTower.set(null)"
              >
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <mat-divider />
            <div class="dialog-body form-grid">
              <div class="form-row-2">
                <mat-form-field appearance="outline" class="density-compact">
                  <mat-label>Identificador da Torre</mat-label>
                  <input matInput [(ngModel)]="towerFormNumber" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="density-compact">
                  <mat-label>Estaca (m)</mat-label>
                  <input
                    matInput
                    type="number"
                    step="0.1"
                    [(ngModel)]="towerFormStation"
                  />
                </mat-form-field>
              </div>

              <div class="form-row-3">
                <mat-form-field appearance="outline" class="density-compact">
                  <mat-label>Extensão Pé (m)</mat-label>
                  <input
                    matInput
                    type="number"
                    step="0.5"
                    [(ngModel)]="towerFormBodyExt"
                  />
                </mat-form-field>
                <mat-form-field appearance="outline" class="density-compact">
                  <mat-label>Deflexão (°)</mat-label>
                  <input
                    matInput
                    type="number"
                    step="0.1"
                    [(ngModel)]="towerFormDeflection"
                  />
                </mat-form-field>
                <mat-form-field appearance="outline" class="density-compact">
                  <mat-label>Offset (m)</mat-label>
                  <input
                    matInput
                    type="number"
                    step="0.1"
                    [(ngModel)]="towerFormOffset"
                  />
                </mat-form-field>
              </div>

              <div class="form-row-2">
                <mat-form-field appearance="outline" class="density-compact">
                  <mat-label>Tipo de Solo</mat-label>
                  <mat-select [(ngModel)]="towerFormSoilId">
                    <mat-option [value]="null">Não definido</mat-option>
                    @for (s of soilTypes(); track s.id) {
                      <mat-option [value]="s.id">{{ s.code }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="density-compact">
                  <mat-label>Tipo de Fundação</mat-label>
                  <mat-select [(ngModel)]="towerFormFoundationId">
                    <mat-option [value]="null">Não definido</mat-option>
                    @for (f of foundationTypes(); track f.id) {
                      <mat-option [value]="f.id">{{ f.code }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="form-row-2">
                <mat-form-field appearance="outline" class="density-compact">
                  <mat-label>Dificuldade de Acesso</mat-label>
                  <mat-select [(ngModel)]="towerFormAccess">
                    @for (acc of accessDifficulties; track acc) {
                      <mat-option [value]="acc">{{
                        getAccessLabel(acc)
                      }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="density-compact">
                  <mat-label>Notas</mat-label>
                  <input
                    matInput
                    [(ngModel)]="towerFormNotes"
                    placeholder="Observações de campo"
                  />
                </mat-form-field>
              </div>
            </div>
            <mat-divider />
            <div class="dialog-footer">
              <button mat-button type="button" (click)="editingTower.set(null)">
                Cancelar
              </button>
              <button
                mat-flat-button
                color="primary"
                type="button"
                (click)="saveTowerEdit()"
                [disabled]="savingTower()"
              >
                <mat-icon>{{
                  savingTower() ? 'hourglass_empty' : 'check'
                }}</mat-icon>
                <span>{{
                  savingTower() ? 'Salvando...' : 'Salvar Alterações'
                }}</span>
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .staking-container {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.75rem;
      }
      .text-danger {
        color: var(--solaris-error);
      }
      .integrity-alert {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.85rem 1.1rem;
        border-radius: 8px;
        font-size: 0.88rem;
      }
      .integrity-alert.danger {
        background: #fee2e2;
        color: #991b1b;
        border-color: #fca5a5;
      }
      .integrity-alert.warning {
        background: #fef3c7;
        color: #92400e;
        border-color: #fcd34d;
      }
      .alert-content {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .inconsistent-list {
        margin: 0.35rem 0 0;
        padding-left: 1.25rem;
        font-size: 0.82rem;
      }
      .actions-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
        border-radius: 8px;
      }
      .search-filter-group {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .search-input {
        width: 180px;
        margin-bottom: -1.25rem;
      }
      .filter-select {
        width: 140px;
        margin-bottom: -1.25rem;
      }
      .action-buttons {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .schematics-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1.25rem;
        background: var(--solaris-surface-low);
        border: 1px solid var(--solaris-outline-variant);
        border-radius: 8px;
      }
      .section-title-wrap {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .section-title-wrap h4 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
      }
      .table-card {
        background: var(--solaris-surface);
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .table-wrapper {
        overflow-x: auto;
      }
      .staking-data-table {
        width: 100%;
      }
      .unassigned-row {
        background: #fffbfb;
      }
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 3rem 1rem;
        color: var(--solaris-on-surface-variant);
      }
      .empty-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
      .pagination-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1.25rem;
        border-top: 1px solid var(--solaris-outline-variant);
        background: var(--solaris-surface-low);
        font-size: 0.85rem;
      }
      .page-size-selector {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      .page-select {
        border: 1px solid var(--solaris-outline-variant);
        border-radius: 4px;
        padding: 2px 6px;
        font-size: 0.85rem;
        background: var(--solaris-surface);
      }
      .pagination-buttons {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
      .dialog-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
      }
      .dialog-card {
        background: #ffffff;
        border-radius: 8px;
        width: 100%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        overflow: hidden;
      }
      .dialog-card.modal-sm {
        max-width: 540px;
      }
      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
      }
      .title-wrap {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .header-icon {
        color: var(--solaris-primary);
        font-size: 26px;
        width: 26px;
        height: 26px;
      }
      .dialog-body {
        padding: 1.25rem 1.5rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .form-row-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      .form-row-3 {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 0.75rem;
      }
      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
      }
      .text-right {
        text-align: right;
      }
      .text-muted {
        color: var(--solaris-on-surface-variant);
      }
      .p-3 {
        padding: 0.75rem;
      }
      .bg-surface {
        background: var(--solaris-surface);
      }
    `,
  ],
})
export class StakingTableComponent implements OnInit {
  private readonly stakingApi = inject(StakingApi);
  private readonly soilTypesApi = inject(SoilTypesApi);
  private readonly foundationTypesApi = inject(FoundationTypesApi);
  private readonly snackBar = inject(MatSnackBar);

  @Input({ required: true }) lineId!: number;
  @Output() countChanged = new EventEmitter<number>();

  readonly columns = [
    'towerNumber',
    'stationMeters',
    'bodyExtensionMeters',
    'deflectionAngleDeg',
    'lateralOffsetMeters',
    'elevationMeters',
    'towerType',
    'soilType',
    'foundationType',
    'accessDifficulty',
    'actions',
  ];

  readonly accessDifficulties = ACCESS_DIFFICULTIES;
  readonly accessLabels = ACCESS_DIFFICULTY_LABELS;

  getAccessLabel(
    difficulty: string | AccessDifficulty | null | undefined,
  ): string {
    if (!difficulty) return 'Normal';
    return (
      (this.accessLabels as Record<string, string>)[difficulty] || difficulty
    );
  }

  readonly loading = signal<boolean>(true);
  readonly towers = signal<StakingTowerItem[]>([]);
  readonly totalCount = signal<number>(0);
  readonly page = signal<number>(1);
  readonly pageSize = signal<number>(50);
  readonly totalPages = signal<number>(1);

  readonly summary = signal<StakingSummary>({
    totalTowers: 0,
    minStationMeters: '0.00',
    maxStationMeters: '0.00',
    unassignedSoilCount: 0,
    unassignedFoundationCount: 0,
    invalidCombinationsCount: 0,
  });

  readonly integritySummary = signal<StakingValidationSummary | null>(null);

  // Catalogs
  readonly soilTypes = signal<SoilTypeSummary[]>([]);
  readonly foundationTypes = signal<FoundationTypeSummary[]>([]);

  // Filters
  searchQuery = '';
  selectedSoilFilter: number | undefined = undefined;
  selectedFoundationFilter: number | undefined = undefined;
  selectedAccessFilter: AccessDifficulty | undefined = undefined;

  // View toggles & Modals
  readonly showImportDialog = signal<boolean>(false);
  readonly showPreliminary = signal<boolean>(false);
  readonly showSchematics = signal<boolean>(false);
  readonly showBatchAssignModal = signal<boolean>(false);
  readonly applyingBatch = signal<boolean>(false);

  // Batch form
  batchStartStation: number | undefined = undefined;
  batchEndStation: number | undefined = undefined;
  batchSoilTypeId: number | undefined = undefined;
  batchFoundationTypeId: number | undefined = undefined;
  batchAccessDifficulty: AccessDifficulty | undefined = undefined;

  // Single edit form
  readonly editingTower = signal<StakingTowerItem | null>(null);
  readonly savingTower = signal<boolean>(false);
  towerFormNumber = '';
  towerFormStation = 0;
  towerFormBodyExt = 0;
  towerFormDeflection = 0;
  towerFormOffset = 0;
  towerFormSoilId: number | null = null;
  towerFormFoundationId: number | null = null;
  towerFormAccess: AccessDifficulty = 'NORMAL';
  towerFormNotes = '';

  ngOnInit(): void {
    this.loadCatalogs();
    this.loadTowers();
    this.loadIntegritySummary();
  }

  loadCatalogs(): void {
    this.soilTypesApi.list().subscribe({
      next: (s) => this.soilTypes.set(s),
    });
    this.foundationTypesApi.list().subscribe({
      next: (f) => this.foundationTypes.set(f),
    });
  }

  loadTowers(): void {
    this.loading.set(true);

    const query: StakingPaginationQuery = {
      page: this.page(),
      pageSize: this.pageSize(),
      search: this.searchQuery,
      soilTypeId: this.selectedSoilFilter,
      foundationTypeId: this.selectedFoundationFilter,
      accessDifficulty: this.selectedAccessFilter,
      sortBy: 'stationMeters',
      sortDirection: 'asc',
    };

    this.stakingApi.getPaginated(this.lineId, query).subscribe({
      next: (res: PaginatedStakingTowers) => {
        this.towers.set(res.items);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.summary.set(res.summary);
        this.countChanged.emit(res.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  loadIntegritySummary(): void {
    this.stakingApi.getIntegritySummary(this.lineId).subscribe({
      next: (res) => this.integritySummary.set(res),
    });
  }

  onFilterChanged(): void {
    this.page.set(1);
    this.loadTowers();
  }

  onPageSizeChanged(newSize: number): void {
    this.pageSize.set(Number(newSize));
    this.page.set(1);
    this.loadTowers();
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.page.set(p);
      this.loadTowers();
    }
  }

  openImportDialog(): void {
    this.showImportDialog.set(true);
  }

  onImportCompleted(): void {
    this.loadTowers();
    this.loadIntegritySummary();
  }

  togglePreliminaryMode(): void {
    this.showPreliminary.update((v) => !v);
  }

  toggleSchematics(): void {
    this.showSchematics.update((v) => !v);
  }

  onPreliminarySaved(): void {
    this.loadTowers();
    this.loadIntegritySummary();
  }

  openBatchAssignModal(): void {
    this.batchStartStation = undefined;
    this.batchEndStation = undefined;
    this.batchSoilTypeId = undefined;
    this.batchFoundationTypeId = undefined;
    this.batchAccessDifficulty = undefined;
    this.showBatchAssignModal.set(true);
  }

  applyBatchAssign(): void {
    this.applyingBatch.set(true);

    const payload: BatchAssignStakingPayload = {
      startStationMeters: this.batchStartStation,
      endStationMeters: this.batchEndStation,
      assignSoilTypeId: this.batchSoilTypeId,
      assignFoundationTypeId: this.batchFoundationTypeId,
      assignAccessDifficulty: this.batchAccessDifficulty,
    };

    this.stakingApi.batchAssign(this.lineId, payload).subscribe({
      next: (res) => {
        this.applyingBatch.set(false);
        this.showBatchAssignModal.set(false);
        this.snackBar.open(
          `Atribuição em lote aplicada a ${res.updatedCount} estruturas com sucesso!`,
          'Fechar',
          { duration: 4000 },
        );
        this.loadTowers();
        this.loadIntegritySummary();
      },
      error: (err) => {
        this.applyingBatch.set(false);
        this.snackBar.open(
          err?.error?.message || 'Erro ao aplicar atribuição em lote.',
          'Fechar',
          { duration: 5000 },
        );
      },
    });
  }

  openAddTowerModal(): void {
    const nextStation =
      this.towers().length > 0
        ? parseFloat(this.summary().maxStationMeters) + 400
        : 0;

    this.editingTower.set({
      id: 0,
      transmissionLineId: this.lineId,
      towerNumber: `T${this.totalCount() + 1}`,
      stationMeters: nextStation.toFixed(2),
      bodyExtensionMeters: '0.00',
      deflectionAngleDeg: '0.00',
      lateralOffsetMeters: '0.00',
      accessDifficulty: 'NORMAL',
    });

    this.towerFormNumber = `T${this.totalCount() + 1}`;
    this.towerFormStation = nextStation;
    this.towerFormBodyExt = 0;
    this.towerFormDeflection = 0;
    this.towerFormOffset = 0;
    this.towerFormSoilId = null;
    this.towerFormFoundationId = null;
    this.towerFormAccess = 'NORMAL';
    this.towerFormNotes = '';
  }

  openEditTowerModal(t: StakingTowerItem): void {
    this.editingTower.set(t);
    this.towerFormNumber = t.towerNumber;
    this.towerFormStation = parseFloat(t.stationMeters) || 0;
    this.towerFormBodyExt = parseFloat(t.bodyExtensionMeters) || 0;
    this.towerFormDeflection = parseFloat(t.deflectionAngleDeg) || 0;
    this.towerFormOffset = parseFloat(t.lateralOffsetMeters) || 0;
    this.towerFormSoilId = t.soilTypeId ?? null;
    this.towerFormFoundationId = t.foundationTypeId ?? null;
    this.towerFormAccess = t.accessDifficulty || 'NORMAL';
    this.towerFormNotes = t.notes || '';
  }

  saveTowerEdit(): void {
    const t = this.editingTower();
    if (!t) return;

    this.savingTower.set(true);

    const input: StakingTowerInput = {
      towerNumber: this.towerFormNumber.trim(),
      stationMeters: this.towerFormStation,
      bodyExtensionMeters: this.towerFormBodyExt,
      deflectionAngleDeg: this.towerFormDeflection,
      lateralOffsetMeters: this.towerFormOffset,
      soilTypeId: this.towerFormSoilId,
      foundationTypeId: this.towerFormFoundationId,
      accessDifficulty: this.towerFormAccess,
      notes: this.towerFormNotes.trim() || null,
    };

    const action$ =
      t.id > 0
        ? this.stakingApi.updateTower(this.lineId, t.id, input)
        : this.stakingApi.createTower(this.lineId, input);

    action$.subscribe({
      next: () => {
        this.savingTower.set(false);
        this.editingTower.set(null);
        this.snackBar.open(
          `Estrutura ${input.towerNumber} salva com sucesso!`,
          'Fechar',
          { duration: 4000 },
        );
        this.loadTowers();
        this.loadIntegritySummary();
      },
      error: (err) => {
        this.savingTower.set(false);
        this.snackBar.open(
          err?.error?.message || 'Erro ao salvar estrutura.',
          'Fechar',
          { duration: 5000 },
        );
      },
    });
  }

  deleteTower(t: StakingTowerItem): void {
    if (confirm(`Deseja realmente remover a torre ${t.towerNumber}?`)) {
      this.stakingApi.deleteTower(this.lineId, t.id).subscribe({
        next: () => {
          this.snackBar.open(
            `Torre ${t.towerNumber} removida com sucesso.`,
            'Fechar',
            { duration: 4000 },
          );
          this.loadTowers();
          this.loadIntegritySummary();
        },
        error: (err) => {
          this.snackBar.open(
            err?.error?.message || 'Erro ao remover torre.',
            'Fechar',
            { duration: 5000 },
          );
        },
      });
    }
  }
}
