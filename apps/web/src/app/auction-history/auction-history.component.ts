import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuctionResultImportItem, AuctionResultItem } from '@lt-offers/domain';
import { formatMoney, formatPercent } from '../shared/format-utils';
import {
  AuctionHistoryApi,
  AuctionResultsFilter,
} from './auction-history-api.service';

/**
 * Histórico oficial de leilões de transmissão da ANEEL (RF-11, RNF-04):
 * consulta do snapshot local com busca e filtros; a sincronização com o
 * datastore aberto é manual e preserva o snapshot em caso de falha.
 */
@Component({
  selector: 'app-auction-history',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTableModule,
    MatTooltipModule,
  ],
  template: `
    <section class="auction-history-page">
      <div class="page-sub-header">
        <div>
          <h2 class="font-display-lg page-title">Histórico de Leilões ANEEL</h2>
          <p class="page-subtitle">
            Resultado oficial dos leilões de transmissão (snapshot local do
            dataset aberto da ANEEL).
          </p>
          @if (lastImport(); as imp) {
            <p
              class="import-meta font-numeric-tabular"
              data-testid="last-import"
            >
              Última importação:
              {{ imp.importedAt | date: 'dd/MM/yyyy HH:mm' }} —
              {{ imp.rowCount }} lotes — fonte: {{ imp.source }}
            </p>
          }
        </div>
        <button
          mat-flat-button
          color="primary"
          type="button"
          (click)="syncNow()"
          [disabled]="syncing()"
        >
          <mat-icon>{{ syncing() ? 'sync' : 'cloud_download' }}</mat-icon>
          {{ syncing() ? 'Sincronizando…' : 'Sincronizar com a ANEEL' }}
        </button>
      </div>

      <form [formGroup]="filterForm" class="filters-bar" (ngSubmit)="reload()">
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Busca (empreendimento ou vencedor)</mat-label>
          <input matInput id="search" formControlName="search" />
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Leilão (NNN/AAAA)</mat-label>
          <input
            matInput
            id="auctionNumber"
            formControlName="auctionNumber"
            placeholder="Ex: 002/2024"
          />
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>UF</mat-label>
          <input matInput id="uf" formControlName="uf" maxlength="2" />
        </mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Ano</mat-label>
          <input matInput id="year" formControlName="year" maxlength="4" />
        </mat-form-field>
        <button mat-stroked-button type="submit" [disabled]="loading()">
          <mat-icon>filter_alt</mat-icon> Filtrar
        </button>
      </form>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
      } @else if (results().length === 0) {
        <div class="empty-state" data-testid="empty-state">
          <mat-icon>gavel</mat-icon>
          @if (lastImport() === null) {
            <p>
              Nenhuma importação registrada. Use "Sincronizar com a ANEEL" para
              trazer o histórico oficial de leilões.
            </p>
          } @else {
            <p>Nenhum lote encontrado com os filtros informados.</p>
          }
        </div>
      } @else {
        <div class="table-scroll">
          <table mat-table [dataSource]="results()" class="dense">
            <ng-container matColumnDef="auction">
              <th mat-header-cell *matHeaderCellDef>Leilão</th>
              <td mat-cell *matCellDef="let row" class="font-numeric-tabular">
                {{ row.auctionNumber }}
              </td>
            </ng-container>
            <ng-container matColumnDef="lot">
              <th mat-header-cell *matHeaderCellDef>Lote</th>
              <td mat-cell *matCellDef="let row" class="font-numeric-tabular">
                {{ row.lotNumber }}
              </td>
            </ng-container>
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Data</th>
              <td mat-cell *matCellDef="let row" class="font-numeric-tabular">
                {{
                  row.auctionDate
                    ? (row.auctionDate | date: 'dd/MM/yyyy' : 'UTC')
                    : 'não informado'
                }}
              </td>
            </ng-container>
            <ng-container matColumnDef="project">
              <th mat-header-cell *matHeaderCellDef>Empreendimento</th>
              <td mat-cell *matCellDef="let row">{{ row.projectName }}</td>
            </ng-container>
            <ng-container matColumnDef="uf">
              <th mat-header-cell *matHeaderCellDef>UF</th>
              <td mat-cell *matCellDef="let row">
                {{ row.mainUf ?? 'não informado' }}
              </td>
            </ng-container>
            <ng-container matColumnDef="maxRap">
              <th mat-header-cell *matHeaderCellDef>RAP máxima (R$)</th>
              <td mat-cell *matCellDef="let row" class="font-numeric-tabular">
                {{ formatMoney(row.maxRap) }}
              </td>
            </ng-container>
            <ng-container matColumnDef="winner">
              <th mat-header-cell *matHeaderCellDef>Vencedor</th>
              <td mat-cell *matCellDef="let row">
                @if (row.winnerName === null) {
                  <span class="badge badge-error">deserto</span>
                } @else {
                  {{ row.winnerName }}
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="winningRap">
              <th mat-header-cell *matHeaderCellDef>RAP vencedora (R$)</th>
              <td mat-cell *matCellDef="let row" class="font-numeric-tabular">
                {{ formatMoney(row.winningRap) }}
              </td>
            </ng-container>
            <ng-container matColumnDef="discount">
              <th mat-header-cell *matHeaderCellDef>Deságio</th>
              <td mat-cell *matCellDef="let row" class="font-numeric-tabular">
                {{ formatPercent(row.discountPercent) }}
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        </div>
        <p class="result-count">{{ results().length }} lote(s) no resultado</p>
      }
    </section>
  `,
  styles: `
    .auction-history-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .page-sub-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--solaris-outline-variant);

      @media (max-width: 768px) {
        flex-direction: column;
      }
    }
    .page-title {
      margin: 0;
    }
    .page-subtitle {
      font-size: 13px;
      color: var(--solaris-on-surface-variant);
      margin: 4px 0 0;
    }
    .import-meta {
      font-size: 12px;
      color: var(--solaris-on-surface-variant);
      margin: 6px 0 0;
      word-break: break-all;
    }
    .filters-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;

      mat-form-field {
        min-width: 140px;
        flex: 1;
      }

      mat-form-field:first-child {
        flex: 2;
        min-width: 220px;
      }
    }
    .result-count {
      font-size: 12px;
      color: var(--solaris-on-surface-variant);
    }
  `,
})
export class AuctionHistoryComponent {
  private readonly api = inject(AuctionHistoryApi);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly syncing = signal(false);
  readonly results = signal<AuctionResultItem[]>([]);
  readonly lastImport = signal<AuctionResultImportItem | null>(null);

  readonly columns = [
    'auction',
    'lot',
    'date',
    'project',
    'uf',
    'maxRap',
    'winner',
    'winningRap',
    'discount',
  ];

  readonly filterForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    auctionNumber: new FormControl('', { nonNullable: true }),
    uf: new FormControl('', { nonNullable: true }),
    year: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    const raw = this.filterForm.getRawValue();
    const filter: AuctionResultsFilter = {
      search: raw.search,
      auctionNumber: raw.auctionNumber,
      uf: raw.uf,
      year: raw.year,
    };
    this.loading.set(true);
    this.api.list(filter).subscribe({
      next: (listing) => {
        this.results.set(listing.results);
        this.lastImport.set(listing.lastImport);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err.error?.message ||
          'Não foi possível carregar o histórico de leilões.';
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
      },
    });
  }

  syncNow(): void {
    if (
      !confirm(
        'Sincronizar o histórico com o dataset oficial da ANEEL? O snapshot atual será substituído.',
      )
    ) {
      return;
    }
    this.syncing.set(true);
    this.api.sync().subscribe({
      next: (imported) => {
        this.syncing.set(false);
        this.snackBar.open(
          `Histórico sincronizado: ${imported.rowCount} lotes importados.`,
          'OK',
          { duration: 4000 },
        );
        this.reload();
      },
      error: (err) => {
        this.syncing.set(false);
        const msg =
          err.error?.message ||
          'Não foi possível sincronizar com a ANEEL. O snapshot local permanece inalterado.';
        this.snackBar.open(msg, 'Fechar', { duration: 6000 });
      },
    });
  }

  // Formatadores pt-BR compartilhados (extraídos na regra das três — M13).
  readonly formatMoney = formatMoney;
  readonly formatPercent = formatPercent;
}
