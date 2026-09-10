import { DecimalPipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  PlsCaddCommitPayload,
  PlsCaddImportParsedRow,
  PlsCaddImportPreview,
} from '@lt-offers/domain';
import { StakingApi } from './staking-api.service';

@Component({
  selector: 'app-pls-cadd-import-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatTableModule,
    MatChipsModule,
    MatCheckboxModule,
    MatTooltipModule,
    DecimalPipe,
  ],
  template: `
    <div
      class="dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pls-import-title"
      tabindex="-1"
      (keyup.escape)="onClose()"
    >
      <div class="dialog-card">
        <!-- Header -->
        <div class="dialog-header">
          <div class="title-wrap">
            <mat-icon class="header-icon">upload_file</mat-icon>
            <div>
              <h3 id="pls-import-title">Importar Estaqueamento PLS-CADD</h3>
              <p class="subtitle">
                Carregue arquivos .csv ou .xlsx exportados do software PLS-CADD
                (RF-18, RF-22).
              </p>
            </div>
          </div>
          <button
            mat-icon-button
            type="button"
            (click)="onClose()"
            aria-label="Fechar modal"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <mat-divider />

        <!-- Body Content -->
        <div class="dialog-body">
          <!-- File selection -->
          <div class="file-dropzone" [class.has-file]="!!selectedFile()">
            <input
              type="file"
              #fileInput
              id="pls-cadd-file-input"
              accept=".csv,.xlsx,.xls"
              (change)="onFileSelected($event)"
              style="display: none"
            />
            <div class="dropzone-content">
              <mat-icon class="dropzone-icon">cloud_upload</mat-icon>
              @if (!selectedFile()) {
                <p class="dropzone-text">
                  Arraste a planilha PLS-CADD aqui ou clique para selecionar
                </p>
                <span class="dropzone-hint"
                  >Formatos suportados: CSV, XLSX, XLS</span
                >
              } @else {
                <p class="dropzone-text file-name mono">
                  {{ selectedFile()!.name }} ({{
                    formatFileSize(selectedFile()!.size)
                  }})
                </p>
                <span class="dropzone-hint"
                  >Clique em "Trocar Arquivo" para escolher outro</span
                >
              }
              <button
                type="button"
                mat-stroked-button
                (click)="fileInput.click()"
                [disabled]="loadingPreview() || committing()"
              >
                <mat-icon>folder_open</mat-icon>
                {{ selectedFile() ? 'Trocar Arquivo' : 'Selecionar Arquivo' }}
              </button>
            </div>
          </div>

          @if (loadingPreview()) {
            <mat-progress-bar
              mode="indeterminate"
              aria-label="Processando arquivo"
            />
            <p class="loading-label">
              Analisando e validando planilha do PLS-CADD...
            </p>
          }

          @if (previewError()) {
            <div class="error-banner" role="alert">
              <mat-icon>error</mat-icon>
              <span>{{ previewError() }}</span>
            </div>
          }

          <!-- Preview Report -->
          @if (preview(); as p) {
            <div class="preview-section">
              <div class="metrics-grid">
                <div class="metric-card">
                  <span class="metric-label">Total de Estruturas</span>
                  <span class="metric-val mono">{{ p.totalRows }}</span>
                </div>
                <div class="metric-card">
                  <span class="metric-label">Linhas Válidas</span>
                  <span class="metric-val text-success mono">{{
                    p.validRowsCount
                  }}</span>
                </div>
                <div class="metric-card">
                  <span class="metric-label">Novas / Mantidas</span>
                  <span class="metric-val mono"
                    >{{ p.newTowersCount }} / {{ p.existingTowersCount }}</span
                  >
                </div>
                <div class="metric-card">
                  <span class="metric-label">Classificações Preservadas</span>
                  <span class="metric-val text-primary mono">{{
                    p.preservedAttributesCount
                  }}</span>
                </div>
                <div class="metric-card">
                  <span class="metric-label">Extensão Total</span>
                  <span class="metric-val mono">{{ p.totalLengthKm }} km</span>
                </div>
              </div>

              @if (p.lineLengthDifferenceKm) {
                <div class="alert-box warning">
                  <mat-icon>warning</mat-icon>
                  <span>
                    Divergência de traçado: A extensão do estaqueamento difere
                    em
                    <strong>{{ p.lineLengthDifferenceKm }} km</strong> da
                    extensão da linha cadastrada.
                  </span>
                </div>
              }

              @if (p.invalidRowsCount > 0) {
                <div class="alert-box danger">
                  <mat-icon>error_outline</mat-icon>
                  <span>
                    Foram encontradas
                    <strong>{{ p.invalidRowsCount }} linhas com erro</strong> no
                    arquivo. Verifique os detalhes na tabela abaixo.
                  </span>
                </div>
              }

              <!-- Table Preview (first 100 rows) -->
              <div class="table-container">
                <table
                  mat-table
                  [dataSource]="p.rows.slice(0, 100)"
                  class="preview-table"
                >
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let row">
                      @if (row.isValid) {
                        <span class="status-chip success">Válida</span>
                      } @else {
                        <span
                          class="status-chip error"
                          [matTooltip]="row.errors.join('; ')"
                        >
                          Inválida ({{ row.errors.length }})
                        </span>
                      }
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="towerNumber">
                    <th mat-header-cell *matHeaderCellDef>Torre</th>
                    <td mat-cell *matCellDef="let row" class="mono font-bold">
                      {{ row.towerNumber }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="stationMeters">
                    <th mat-header-cell *matHeaderCellDef>Estaca (m)</th>
                    <td mat-cell *matCellDef="let row" class="mono">
                      {{ row.stationMeters | number: '1.2-2' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="bodyExtensionMeters">
                    <th mat-header-cell *matHeaderCellDef>Extensão Pé (m)</th>
                    <td mat-cell *matCellDef="let row" class="mono">
                      {{ row.bodyExtensionMeters | number: '1.2-2' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="deflectionAngleDeg">
                    <th mat-header-cell *matHeaderCellDef>Deflexão (°)</th>
                    <td mat-cell *matCellDef="let row" class="mono">
                      {{ row.deflectionAngleDeg | number: '1.2-2' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="towerTypeCode">
                    <th mat-header-cell *matHeaderCellDef>Tipo Torre</th>
                    <td mat-cell *matCellDef="let row" class="mono">
                      {{ row.towerTypeCode || '—' }}
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr
                    mat-row
                    *matRowDef="let row; columns: displayedColumns"
                    [class.row-error]="!row.isValid"
                  ></tr>
                </table>
              </div>

              <div class="options-box">
                <mat-checkbox [(ngModel)]="preserveAssignments" color="primary">
                  Preservar atribuições existentes de solo, fundação e notas nas
                  torres mantidas (RF-22)
                </mat-checkbox>
              </div>
            </div>
          }
        </div>

        <mat-divider />

        <!-- Footer Actions -->
        <div class="dialog-footer">
          <button
            mat-button
            type="button"
            (click)="onClose()"
            [disabled]="committing()"
          >
            Cancelar
          </button>
          <button
            mat-flat-button
            color="primary"
            type="button"
            (click)="commitImport()"
            [disabled]="!canCommit() || committing()"
          >
            <mat-icon>{{
              committing() ? 'hourglass_empty' : 'check'
            }}</mat-icon>
            <span>{{
              committing()
                ? 'Gravando estaqueamento...'
                : 'Confirmar e Gravar Estaqueamento'
            }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
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
        background: var(--mat-sys-surface, #ffffff);
        color: var(--mat-sys-on-surface, #1e293b);
        border-radius: 8px;
        width: 100%;
        max-width: 860px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        overflow: hidden;
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
        color: var(--mat-sys-primary, #0284c7);
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      h3 {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 600;
      }
      .subtitle {
        margin: 0.2rem 0 0;
        font-size: 0.85rem;
        color: var(--mat-sys-on-surface-variant, #64748b);
      }
      .dialog-body {
        padding: 1.25rem 1.5rem;
        overflow-y: auto;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .file-dropzone {
        border: 2px dashed var(--mat-sys-outline-variant, #cbd5e1);
        border-radius: 6px;
        padding: 1.5rem;
        text-align: center;
        background: var(--mat-sys-surface-container-lowest, #f8fafc);
        transition:
          border-color 0.2s,
          background 0.2s;
      }
      .file-dropzone.has-file {
        border-color: var(--mat-sys-primary, #0284c7);
        background: #f0f9ff;
      }
      .dropzone-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }
      .dropzone-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: var(--mat-sys-on-surface-variant, #64748b);
      }
      .dropzone-text {
        margin: 0;
        font-weight: 500;
        font-size: 0.95rem;
      }
      .file-name {
        color: #0369a1;
      }
      .dropzone-hint {
        font-size: 0.8rem;
        color: var(--mat-sys-on-surface-variant, #64748b);
      }
      .loading-label {
        margin: 0.5rem 0 0;
        font-size: 0.85rem;
        text-align: center;
        color: var(--mat-sys-on-surface-variant, #64748b);
      }
      .error-banner {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: #fee2e2;
        color: #b91c1c;
        border-radius: 6px;
        font-size: 0.88rem;
      }
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 0.75rem;
      }
      .metric-card {
        background: var(--mat-sys-surface-container-low, #f1f5f9);
        border-radius: 6px;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .metric-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--mat-sys-on-surface-variant, #64748b);
      }
      .metric-val {
        font-size: 1.15rem;
        font-weight: 600;
      }
      .text-success {
        color: #15803d;
      }
      .text-primary {
        color: #0369a1;
      }
      .alert-box {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 0.9rem;
        border-radius: 6px;
        font-size: 0.85rem;
      }
      .alert-box.warning {
        background: #fef3c7;
        color: #92400e;
      }
      .alert-box.danger {
        background: #fee2e2;
        color: #991b1b;
      }
      .table-container {
        max-height: 240px;
        overflow-y: auto;
        border: 1px solid var(--mat-sys-outline-variant, #e2e8f0);
        border-radius: 6px;
      }
      .preview-table {
        width: 100%;
      }
      .row-error {
        background: #fff1f2;
      }
      .status-chip {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        text-transform: uppercase;
      }
      .status-chip.success {
        background: #dcfce7;
        color: #15803d;
      }
      .status-chip.error {
        background: #fee2e2;
        color: #b91c1c;
      }
      .options-box {
        margin-top: 0.5rem;
      }
      .dialog-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem;
      }
      .mono {
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      .font-bold {
        font-weight: 600;
      }
    `,
  ],
})
export class PlsCaddImportDialogComponent {
  private readonly stakingApi = inject(StakingApi);
  private readonly snackBar = inject(MatSnackBar);

  @Input({ required: true }) lineId!: number;
  @Output() dismissed = new EventEmitter<void>();
  @Output() importCompleted = new EventEmitter<{
    importedCount: number;
    updatedCount: number;
    preservedCount: number;
  }>();

  readonly displayedColumns = [
    'status',
    'towerNumber',
    'stationMeters',
    'bodyExtensionMeters',
    'deflectionAngleDeg',
    'towerTypeCode',
  ];

  readonly selectedFile = signal<File | null>(null);
  readonly loadingPreview = signal<boolean>(false);
  readonly previewError = signal<string | null>(null);
  readonly preview = signal<PlsCaddImportPreview | null>(null);
  readonly committing = signal<boolean>(false);

  preserveAssignments = true;

  onClose(): void {
    if (!this.committing()) {
      this.dismissed.emit();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile.set(file);
      this.loadPreview(file);
    }
  }

  loadPreview(file: File): void {
    this.loadingPreview.set(true);
    this.previewError.set(null);
    this.preview.set(null);

    this.stakingApi.previewImport(this.lineId, file).subscribe({
      next: (preview) => {
        this.loadingPreview.set(false);
        this.preview.set(preview);
      },
      error: (err) => {
        this.loadingPreview.set(false);
        this.previewError.set(
          err?.error?.message ||
            'Falha ao analisar arquivo PLS-CADD. Verifique o formato e tente novamente.',
        );
      },
    });
  }

  canCommit(): boolean {
    const p = this.preview();
    return !!p && p.validRowsCount > 0 && p.invalidRowsCount === 0;
  }

  commitImport(): void {
    const p = this.preview();
    if (!p || !this.canCommit()) return;

    this.committing.set(true);

    const payload: PlsCaddCommitPayload = {
      fileName: p.fileName,
      preserveExistingAssignments: this.preserveAssignments,
      rows: p.rows.map((r: PlsCaddImportParsedRow) => ({
        towerNumber: r.towerNumber,
        stationMeters: r.stationMeters,
        bodyExtensionMeters: r.bodyExtensionMeters,
        deflectionAngleDeg: r.deflectionAngleDeg,
        lateralOffsetMeters: r.lateralOffsetMeters,
        utmEast: r.utmEast,
        utmNorth: r.utmNorth,
        elevationMeters: r.elevationMeters,
        towerTypeCode: r.towerTypeCode,
        soilTypeCode: r.soilTypeCode,
        foundationTypeCode: r.foundationTypeCode,
      })),
    };

    this.stakingApi.commitImport(this.lineId, payload).subscribe({
      next: (res) => {
        this.committing.set(false);
        this.snackBar.open(
          `Estaqueamento gravado com sucesso: ${res.importedCount} inseridas, ${res.updatedCount} atualizadas (${res.preservedCount} classificações preservadas).`,
          'Fechar',
          { duration: 5000 },
        );
        this.importCompleted.emit(res);
        this.dismissed.emit();
      },
      error: (err) => {
        this.committing.set(false);
        this.snackBar.open(
          err?.error?.message || 'Erro ao gravar estaqueamento.',
          'Fechar',
          { duration: 5000 },
        );
      },
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
