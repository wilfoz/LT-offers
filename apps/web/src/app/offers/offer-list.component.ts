import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { OfferRevisionStatus, OfferSummary } from '@lt-offers/domain';
import { OffersApi } from './offers-api.service';

export const REVISION_STATUS_LABELS: Record<OfferRevisionStatus, string> = {
  DRAFT: 'Rascunho',
  FROZEN: 'Fechada',
  DELIVERED: 'Entregue',
  WON: 'Vencedora (Ganha)',
  IN_EXECUTION: 'Em Execução',
};

@Component({
  selector: 'app-offer-list',
  imports: [
    RouterLink,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  template: `
    <section class="offer-list-page">
      <!-- Subheader -->
      <div class="page-sub-header">
        <div class="header-left">
          <nav class="breadcrumb-nav">
            <span>Início</span>
            <mat-icon class="breadcrumb-sep">chevron_right</mat-icon>
            <span class="breadcrumb-current">Gestão de Ofertas</span>
          </nav>
          <h2 class="font-display-lg page-title">
            Gestão de Ofertas e Propostas
          </h2>
          <p class="page-subtitle">
            Controle de parâmetros de leilão, revisões, linhas de transmissão e
            matriz de escopo
          </p>
        </div>

        <div class="header-actions">
          <a
            matButton="filled"
            routerLink="new"
            class="btn-primary-gradient new-offer-btn"
          >
            <mat-icon>add</mat-icon>
            <span>Nova Proposta</span>
          </a>
        </div>
      </div>

      <!-- KPIs Bar -->
      <div class="kpis-bar">
        <div class="kpi-mini-card">
          <span class="kpi-mini-label">Total de Propostas</span>
          <span class="kpi-mini-val font-numeric-tabular">{{
            items().length
          }}</span>
        </div>
        <div class="kpi-mini-card">
          <span class="kpi-mini-label">Extensão Total</span>
          <span class="kpi-mini-val font-numeric-tabular"
            >{{ totalExtension() }} km</span
          >
        </div>
        <div class="kpi-mini-card">
          <span class="kpi-mini-label">Propostas Válidas</span>
          <span class="kpi-mini-val font-numeric-tabular text-success">{{
            validCount()
          }}</span>
        </div>
        <div class="kpi-mini-card">
          <span class="kpi-mini-label">Com Pendências</span>
          <span class="kpi-mini-val font-numeric-tabular text-pending">{{
            pendingCount()
          }}</span>
        </div>
      </div>

      <!-- Search Toolbar -->
      <div class="search-toolbar-card technical-border">
        <form role="search" (submit)="search($event)" class="search-form">
          <div class="search-input-wrapper">
            <mat-icon class="search-icon">search</mat-icon>
            <input
              id="search"
              name="search"
              type="search"
              placeholder="Buscar por código, nome, cliente, leilão ou lote..."
              [value]="term()"
              (input)="term.set(searchField.value)"
              #searchField
            />
          </div>
          <button type="submit" class="btn-secondary-outline btn-search">
            <span>Filtrar</span>
          </button>
        </form>
      </div>

      @if (loading()) {
        <mat-progress-bar
          mode="indeterminate"
          aria-label="Carregando"
          class="my-4"
        />
        <p class="loading-text">Carregando ofertas…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <div class="empty-state panel-card technical-border">
          <mat-icon aria-hidden="true">request_quote</mat-icon>
          <p class="font-bold">Nenhuma oferta encontrada.</p>
          <a matButton="filled" routerLink="new" class="btn-primary-gradient">
            Cadastrar primeira proposta
          </a>
        </div>
      } @else {
        <div class="panel-card technical-border overflow-hidden">
          <div class="table-scroll">
            <table mat-table [dataSource]="items()" class="technical-table">
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef scope="col">Código</th>
                <td
                  mat-cell
                  *matCellDef="let item"
                  class="font-numeric-tabular"
                >
                  <a [routerLink]="[item.id]" class="offer-code-link font-bold">
                    {{ item.code }}
                  </a>
                </td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef scope="col">
                  Nome da proposta
                </th>
                <td mat-cell *matCellDef="let item">
                  <strong>{{ item.name }}</strong>
                </td>
              </ng-container>

              <ng-container matColumnDef="clientName">
                <th mat-header-cell *matHeaderCellDef scope="col">
                  Cliente / Concessionária
                </th>
                <td mat-cell *matCellDef="let item">
                  {{ item.clientName }}
                </td>
              </ng-container>

              <ng-container matColumnDef="auctionLot">
                <th mat-header-cell *matHeaderCellDef scope="col">
                  Leilão / Lote
                </th>
                <td
                  mat-cell
                  *matCellDef="let item"
                  class="font-numeric-tabular"
                >
                  {{ item.auctionName }} • {{ item.lotName }}
                </td>
              </ng-container>

              <ng-container matColumnDef="revision">
                <th mat-header-cell *matHeaderCellDef scope="col">Revisão</th>
                <td mat-cell *matCellDef="let item">
                  <span class="rev-badge font-numeric-tabular"
                    >R{{ item.currentRevisionNumber }}</span
                  >
                  <span
                    class="status-chip"
                    [attr.data-status]="item.currentRevisionStatus"
                  >
                    {{ statusLabel(item.currentRevisionStatus) }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="linesKm">
                <th mat-header-cell *matHeaderCellDef scope="col">
                  Linhas / Extensão
                </th>
                <td
                  mat-cell
                  *matCellDef="let item"
                  class="font-numeric-tabular"
                >
                  {{ item.lineCount }} LT ({{ item.totalLengthKm }} km)
                </td>
              </ng-container>

              <ng-container matColumnDef="issues">
                <th mat-header-cell *matHeaderCellDef scope="col">
                  Pendências
                </th>
                <td mat-cell *matCellDef="let item">
                  @if (item.hasPendingIssues) {
                    <span
                      class="badge badge-pending"
                      matTooltip="Possui pendências: sem linhas cadastradas ou rateio territorial incompleto"
                    >
                      <mat-icon class="badge-icon">warning</mat-icon> Incompleta
                    </span>
                  } @else {
                    <span class="badge badge-valid">
                      <mat-icon class="badge-icon">check_circle</mat-icon>
                      Válida
                    </span>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th
                  mat-header-cell
                  *matHeaderCellDef
                  scope="col"
                  style="text-align: right;"
                >
                  Ações
                </th>
                <td
                  mat-cell
                  *matCellDef="let item"
                  class="actions-cell"
                  style="text-align: right;"
                >
                  <a
                    matButton="outlined"
                    [routerLink]="[item.id]"
                    matTooltip="Ver detalhes e parametrização da proposta"
                    class="btn-action"
                  >
                    Abrir
                  </a>
                  <button
                    matButton="outlined"
                    type="button"
                    (click)="cloneOffer(item)"
                    matTooltip="Duplicar proposta com histórico rastreável"
                    class="btn-action"
                  >
                    Clonar
                  </button>
                  <button
                    matIconButton
                    type="button"
                    (click)="deleteOffer(item)"
                    aria-label="Excluir proposta"
                    matTooltip="Excluir proposta"
                    class="danger-btn"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </div>
        </div>
      }
    </section>
  `,
  styles: `
    .offer-list-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-sub-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--solaris-outline-variant);

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 16px;
      }
    }

    .breadcrumb-nav {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: var(--solaris-on-surface-variant);
      margin-bottom: 4px;

      .breadcrumb-sep {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .breadcrumb-current {
        font-weight: 700;
        color: var(--solaris-primary);
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

    .kpis-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      @media (max-width: 900px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 500px) {
        grid-template-columns: 1fr;
      }
    }

    .kpi-mini-card {
      background: var(--solaris-surface-container-lowest);
      border: 1px solid var(--solaris-outline-variant);
      border-radius: 6px;
      padding: 10px 16px;
      display: flex;
      flex-direction: column;

      .kpi-mini-label {
        font-family: 'Public Sans', sans-serif;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--solaris-on-surface-variant);
      }

      .kpi-mini-val {
        font-size: 20px;
        font-weight: 800;
        color: var(--solaris-on-surface);
        margin-top: 2px;
      }
    }

    .search-toolbar-card {
      background: var(--solaris-surface-container-lowest);
      border-radius: 6px;
      padding: 10px 16px;
    }

    .search-form {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .search-input-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--solaris-surface-container-low);
      border: 1px solid var(--solaris-outline-variant);
      border-radius: 4px;
      padding: 6px 12px;

      .search-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--solaris-on-surface-variant);
      }

      input {
        border: none;
        background: transparent;
        outline: none;
        font-size: 13px;
        width: 100%;
        color: var(--solaris-on-surface);
      }
    }

    .btn-search {
      padding: 6px 16px;
    }

    .offer-code-link {
      color: var(--solaris-primary);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .rev-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--solaris-surface-container-high);
      font-weight: 700;
      font-size: 11px;
      margin-right: 6px;
    }

    .status-chip {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      font-family: 'Public Sans', sans-serif;
      text-transform: uppercase;
    }

    .status-chip[data-status='DRAFT'] {
      background: var(--solaris-surface-container);
      color: var(--solaris-on-surface-variant);
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

    .status-chip[data-status='WON'] {
      background: #fef9c3;
      color: #854d0e;
      border: 1px solid #fde047;
    }

    .status-chip[data-status='IN_EXECUTION'] {
      background: #ede9fe;
      color: #6b21a8;
      border: 1px solid #c4b5fd;
    }

    .badge-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
    }

    .actions-cell {
      display: flex;
      gap: 6px;
      align-items: center;
      justify-content: flex-end;
    }

    .btn-action {
      font-size: 12px;
      height: 32px;
    }

    .danger-btn {
      color: var(--solaris-error);
    }
  `,
})
export class OfferListComponent {
  private readonly api = inject(OffersApi);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly columns = [
    'code',
    'name',
    'clientName',
    'auctionLot',
    'revision',
    'linesKm',
    'issues',
    'actions',
  ];

  readonly term = signal('');
  readonly items = signal<OfferSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.reload();
  }

  search(event: Event): void {
    event.preventDefault();
    this.reload();
  }

  totalExtension(): number {
    const sum = this.items().reduce(
      (acc, curr) => acc + (Number(curr.totalLengthKm) || 0),
      0,
    );
    return Math.round(sum * 10) / 10;
  }

  validCount(): number {
    return this.items().filter((i) => !i.hasPendingIssues).length;
  }

  pendingCount(): number {
    return this.items().filter((i) => i.hasPendingIssues).length;
  }

  statusLabel(status: OfferRevisionStatus): string {
    return REVISION_STATUS_LABELS[status] ?? status;
  }

  cloneOffer(item: OfferSummary): void {
    const newCode = prompt(
      `Informe o código da nova proposta clonada a partir de "${item.code}":`,
      `${item.code}-COPIA`,
    );
    if (!newCode || !newCode.trim()) return;

    const newName = prompt(
      'Informe o nome da nova proposta:',
      `${item.name} (Cópia)`,
    );
    if (!newName || !newName.trim()) return;

    this.loading.set(true);
    this.api
      .clone(item.id, {
        targetCode: newCode.trim(),
        targetName: newName.trim(),
      })
      .subscribe({
        next: (created) => {
          this.snackBar.open(
            `Proposta ${created.code} clonada com sucesso!`,
            'OK',
            { duration: 4000 },
          );
          this.router.navigate(['/offers', created.id]);
        },
        error: (err) => {
          this.loading.set(false);
          const msg =
            err.error?.message ||
            'Não foi possível clonar a proposta. Verifique se o código já existe.';
          this.snackBar.open(msg, 'Fechar', { duration: 5000 });
        },
      });
  }

  deleteOffer(item: OfferSummary): void {
    if (
      !confirm(
        `Tem certeza de que deseja excluir a proposta "${item.code} - ${item.name}" e todas as suas revisões? Esta ação é irreversível.`,
      )
    ) {
      return;
    }

    this.loading.set(true);
    this.api.delete(item.id).subscribe({
      next: () => {
        this.snackBar.open(
          `Proposta ${item.code} excluída com sucesso.`,
          'OK',
          {
            duration: 3000,
          },
        );
        this.reload();
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err.error?.message ||
          'Não foi possível excluir a proposta. Tente novamente.';
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
      },
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.list(this.term() || undefined).subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(
          'Não foi possível carregar as propostas; verifique a conexão e tente novamente',
        );
      },
    });
  }
}
