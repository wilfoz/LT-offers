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
    <section>
      <div class="header-row">
        <div>
          <h2>Gestão de Ofertas e Propostas</h2>
          <p class="subtitle">
            Controle de parâmetros de leilão, revisões, linhas de transmissão e matriz de escopo
          </p>
        </div>
        <a matButton="filled" routerLink="new" class="new-offer-btn">
          <mat-icon>add</mat-icon> Nova proposta
        </a>
      </div>

      <form role="search" (submit)="search($event)">
        <mat-form-field
          appearance="outline"
          floatLabel="always"
          subscriptSizing="dynamic"
          class="search-field"
        >
          <mat-label>Buscar por código, nome, cliente, leilão ou lote</mat-label>
          <input
            matInput
            id="search"
            name="search"
            type="search"
            [value]="term()"
            (input)="term.set(searchField.value)"
            #searchField
          />
        </mat-form-field>
        <button matButton="outlined" type="submit">Buscar</button>
      </form>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Carregando" />
        <p>Carregando ofertas…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">request_quote</mat-icon>
          <p>Nenhuma oferta encontrada.</p>
          <a matButton="filled" routerLink="new">Cadastrar primeira proposta</a>
        </div>
      } @else {
        <div class="table-scroll">
          <table mat-table [dataSource]="items()" class="dense">
            <caption>
              Propostas cadastradas e revisões ativas
            </caption>

            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef scope="col">Código</th>
              <td mat-cell *matCellDef="let item" class="mono">
                <a [routerLink]="[item.id]" class="offer-link font-bold">
                  {{ item.code }}
                </a>
              </td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef scope="col">Nome da proposta</th>
              <td mat-cell *matCellDef="let item">
                <strong>{{ item.name }}</strong>
              </td>
            </ng-container>

            <ng-container matColumnDef="clientName">
              <th mat-header-cell *matHeaderCellDef scope="col">Cliente / Concessionária</th>
              <td mat-cell *matCellDef="let item">
                {{ item.clientName }}
              </td>
            </ng-container>

            <ng-container matColumnDef="auctionLot">
              <th mat-header-cell *matHeaderCellDef scope="col">Leilão / Lote</th>
              <td mat-cell *matCellDef="let item">
                {{ item.auctionName }} • {{ item.lotName }}
              </td>
            </ng-container>

            <ng-container matColumnDef="revision">
              <th mat-header-cell *matHeaderCellDef scope="col">Revisão</th>
              <td mat-cell *matCellDef="let item">
                <span class="rev-badge mono">R{{ item.currentRevisionNumber }}</span>
                <span
                  class="status-chip"
                  [attr.data-status]="item.currentRevisionStatus"
                >
                  {{ statusLabel(item.currentRevisionStatus) }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="linesKm">
              <th mat-header-cell *matHeaderCellDef scope="col">Linhas / Extensão</th>
              <td mat-cell *matCellDef="let item" class="mono">
                {{ item.lineCount }} LT ({{ item.totalLengthKm }} km)
              </td>
            </ng-container>

            <ng-container matColumnDef="issues">
              <th mat-header-cell *matHeaderCellDef scope="col">Pendências</th>
              <td mat-cell *matCellDef="let item">
                @if (item.hasPendingIssues) {
                  <span
                    class="pending-badge"
                    matTooltip="Possui pendências: sem linhas cadastradas ou rateio territorial incompleto"
                  >
                    <mat-icon class="pending-icon">warning</mat-icon> Incompleta
                  </span>
                } @else {
                  <span class="ok-badge">
                    <mat-icon class="ok-icon">check_circle</mat-icon> Válida
                  </span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef scope="col">Ações</th>
              <td mat-cell *matCellDef="let item" class="actions-cell">
                <a
                  matButton="outlined"
                  [routerLink]="[item.id]"
                  matTooltip="Ver detalhes e parametrização da proposta"
                >
                  Abrir
                </a>
                <button
                  matButton="outlined"
                  type="button"
                  (click)="cloneOffer(item)"
                  matTooltip="Duplicar proposta com histórico rastreável"
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
      }
    </section>
  `,
  styles: `
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
      gap: 1rem;
    }
    .subtitle {
      color: var(--mat-sys-on-surface-variant);
      margin-top: -0.25rem;
      font: var(--mat-sys-body-medium);
    }
    .new-offer-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    form[role='search'] {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
      margin-block: 1rem;
    }
    .search-field {
      flex: 1;
      min-width: 18rem;
    }
    table {
      width: 100%;
    }
    caption {
      caption-side: top;
      text-align: left;
      padding-block: 0.5rem;
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-medium);
    }
    .offer-link {
      color: var(--mat-sys-primary);
      text-decoration: none;
      font-weight: 600;
    }
    .offer-link:hover {
      text-decoration: underline;
    }
    .rev-badge {
      display: inline-block;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      background: var(--mat-sys-surface-container-high);
      font-weight: bold;
      margin-right: 0.35rem;
    }
    .status-chip {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .status-chip[data-status='DRAFT'] {
      background: var(--mat-sys-surface-container);
      color: var(--mat-sys-on-surface-variant);
      border: 1px solid var(--mat-sys-outline-variant);
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
    .pending-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: #b45309;
      background: #fef3c7;
      border: 1px solid #fde68a;
      padding: 0.15rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .pending-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
      color: #b45309;
    }
    .ok-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: #15803d;
      font-size: 0.75rem;
    }
    .ok-icon {
      font-size: 1rem;
      width: 1rem;
      height: 1rem;
      color: #15803d;
    }
    .actions-cell {
      display: flex;
      gap: 0.4rem;
      align-items: center;
    }
    .danger-btn {
      color: var(--mat-sys-error);
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
        this.snackBar.open(`Proposta ${item.code} excluída com sucesso.`, 'OK', {
          duration: 3000,
        });
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
