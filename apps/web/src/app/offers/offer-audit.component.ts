import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  AuditEvent,
  AuditResource,
  AuditAction,
  UserRole,
} from '@lt-offers/domain';
import { AuditApiService } from './audit-api.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-offer-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="audit-container">
      <mat-card class="header-card">
        <div class="header-title-row">
          <div class="title-with-icon">
            <mat-icon class="title-icon">history_edu</mat-icon>
            <div>
              <h2>Trilha de Auditoria Imutável (RF-65, RNF-12)</h2>
              <p class="subtitle">
                Registro cronológico e auditável de todas as mutações em dados
                técnicos, premissas comerciais e revisões desta proposta.
              </p>
            </div>
          </div>
          <div class="header-actions">
            <button mat-stroked-button color="primary" (click)="loadEvents()">
              <mat-icon>refresh</mat-icon> Atualizar Trilha
            </button>
          </div>
        </div>

        <!-- Barra de Filtros -->
        <div class="filters-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar por autor, descrição ou campo</mat-label>
            <input
              matInput
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Ex.: margem, cabo, Carlos..."
            />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="select-field">
            <mat-label>Módulo / Recurso</mat-label>
            <mat-select
              [ngModel]="selectedResource()"
              (ngModelChange)="selectedResource.set($event)"
            >
              <mat-option value="ALL">Todos os Módulos</mat-option>
              <mat-option value="OFFER">Oferta Geral</mat-option>
              <mat-option value="REVISION">Revisões</mat-option>
              <mat-option value="STAKING">Estaqueamento</mat-option>
              <mat-option value="PRICING">Suprimentos & Preços</mat-option>
              <mat-option value="SCHEDULE">Cronograma & Prazos</mat-option>
              <mat-option value="ECONOMIC_RESULT">Resultado & BDI</mat-option>
              <mat-option value="RISKS">Matriz de Riscos</mat-option>
              <mat-option value="CATALOG">Catálogos</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="select-field">
            <mat-label>Papel / Perfil</mat-label>
            <mat-select
              [ngModel]="selectedRole()"
              (ngModelChange)="selectedRole.set($event)"
            >
              <mat-option value="ALL">Todos os Perfis</mat-option>
              <mat-option value="ENGINEERING">Engenharia</mat-option>
              <mat-option value="PROCUREMENT">Suprimentos</mat-option>
              <mat-option value="PLANNING">Planejamento</mat-option>
              <mat-option value="COMMERCIAL">Comercial</mat-option>
              <mat-option value="ADMIN">Administrador</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      @if (loading()) {
        <mat-progress-bar
          mode="indeterminate"
          class="loading-bar"
        ></mat-progress-bar>
      }

      <!-- Tabela de Eventos de Auditoria -->
      <mat-card class="table-card">
        <table mat-table [dataSource]="filteredEvents()" class="audit-table">
          <!-- Data/Hora Coluna -->
          <ng-container matColumnDef="timestamp">
            <th mat-header-cell *matHeaderCellDef>Data/Hora (UTC)</th>
            <td mat-cell *matCellDef="let evt" class="timestamp-cell">
              <div class="timestamp-box">
                <span class="date">{{
                  evt.timestamp | date: 'dd/MM/yyyy HH:mm:ss' : 'UTC'
                }}</span>
                <span class="utc-badge">UTC</span>
              </div>
            </td>
          </ng-container>

          <!-- Autor e Papel Coluna -->
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>Autor</th>
            <td mat-cell *matCellDef="let evt" class="user-cell">
              <div class="user-box">
                <span class="user-name">{{ evt.userName }}</span>
                <span class="role-chip" [class]="evt.userRole.toLowerCase()">
                  {{ evt.userRole }}
                </span>
              </div>
            </td>
          </ng-container>

          <!-- Recurso Coluna -->
          <ng-container matColumnDef="resource">
            <th mat-header-cell *matHeaderCellDef>Módulo / Recurso</th>
            <td mat-cell *matCellDef="let evt">
              <span class="resource-badge">{{ evt.resource }}</span>
            </td>
          </ng-container>

          <!-- Ação Coluna -->
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef>Ação</th>
            <td mat-cell *matCellDef="let evt">
              <span class="action-chip" [class]="evt.action.toLowerCase()">
                {{ evt.action }}
              </span>
            </td>
          </ng-container>

          <!-- Descrição e Diffs Coluna -->
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>
              Descrição & Modificações Registradas
            </th>
            <td mat-cell *matCellDef="let evt" class="description-cell">
              <p class="event-desc">{{ evt.description }}</p>
              @if (evt.diffs && evt.diffs.length > 0) {
                <div class="diffs-list">
                  @for (d of evt.diffs; track d.field) {
                    <div class="diff-tag">
                      <span class="diff-field">{{ d.field }}:</span>
                      @if (
                        d.previousValue !== undefined &&
                        d.previousValue !== null
                      ) {
                        <span class="prev-val">{{ d.previousValue }}</span>
                        <mat-icon class="arrow-icon">arrow_forward</mat-icon>
                      }
                      <span class="new-val">{{ d.newValue }}</span>
                    </div>
                  }
                </div>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

          <tr class="mat-row no-data-row" *matNoDataRow>
            <td class="mat-cell" [attr.colspan]="displayedColumns.length">
              <div class="empty-state">
                <mat-icon>search_off</mat-icon>
                <p>
                  Nenhum registro de auditoria encontrado com os filtros
                  selecionados.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .audit-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 16px;
      }
      .header-card {
        padding: 20px;
      }
      .header-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .title-with-icon {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .title-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: #1e88e5;
      }
      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
      }
      .subtitle {
        margin: 4px 0 0 0;
        font-size: 0.875rem;
        color: #64748b;
      }
      .filters-bar {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        margin-top: 8px;
      }
      .search-field {
        flex: 2;
        min-width: 250px;
      }
      .select-field {
        flex: 1;
        min-width: 180px;
      }
      .loading-bar {
        margin-top: -8px;
      }
      .table-card {
        overflow: hidden;
        padding: 0;
      }
      .audit-table {
        width: 100%;
      }
      .timestamp-box {
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: monospace;
        font-size: 0.85rem;
      }
      .utc-badge {
        background: #e2e8f0;
        color: #475569;
        font-size: 0.65rem;
        padding: 2px 4px;
        border-radius: 4px;
        font-weight: 700;
      }
      .user-box {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .user-name {
        font-weight: 600;
        font-size: 0.875rem;
      }
      .role-chip {
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 4px;
        width: fit-content;
        font-weight: 600;
        text-transform: uppercase;
      }
      .role-chip.engineering {
        background: #e0f2fe;
        color: #0369a1;
      }
      .role-chip.procurement {
        background: #fef3c7;
        color: #b45309;
      }
      .role-chip.planning {
        background: #f3e8ff;
        color: #7e22ce;
      }
      .role-chip.commercial {
        background: #dcfce7;
        color: #15803d;
      }
      .role-chip.admin {
        background: #fee2e2;
        color: #b91c1c;
      }

      .resource-badge {
        background: #f1f5f9;
        color: #334155;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      .action-chip {
        font-size: 0.75rem;
        padding: 3px 8px;
        border-radius: 12px;
        font-weight: 700;
      }
      .action-chip.create {
        background: #dcfce7;
        color: #166534;
      }
      .action-chip.update {
        background: #e0f2fe;
        color: #075985;
      }
      .action-chip.delete {
        background: #fee2e2;
        color: #991b1b;
      }
      .action-chip.freeze {
        background: #f3e8ff;
        color: #6b21a8;
      }
      .action-chip.clone {
        background: #ffedd5;
        color: #9a3412;
      }
      .action-chip.simulate {
        background: #fef9c3;
        color: #854d0e;
      }

      .description-cell {
        padding: 12px 16px;
      }
      .event-desc {
        margin: 0 0 6px 0;
        font-size: 0.875rem;
        color: #1e293b;
      }
      .diffs-list {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .diff-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-family: monospace;
      }
      .diff-field {
        font-weight: 600;
        color: #334155;
      }
      .prev-val {
        color: #dc2626;
        text-decoration: line-through;
      }
      .new-val {
        color: #16a34a;
        font-weight: 600;
      }
      .arrow-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        color: #94a3b8;
      }
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: #64748b;
        gap: 8px;
      }
      .empty-state mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
      }
    `,
  ],
})
export class OfferAuditComponent implements OnInit {
  @Input() offerId?: string;

  private readonly auditApi = inject(AuditApiService);
  readonly authService = inject(AuthService);

  readonly displayedColumns = [
    'timestamp',
    'user',
    'resource',
    'action',
    'description',
  ];

  readonly events = signal<AuditEvent[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly searchQuery = signal('');
  readonly selectedResource = signal('ALL');
  readonly selectedRole = signal('ALL');

  readonly filteredEvents = computed(() => {
    let list = this.events();
    const query = this.searchQuery().trim().toLowerCase();
    const res = this.selectedResource();
    const role = this.selectedRole();

    if (res !== 'ALL') {
      list = list.filter((e) => e.resource === res);
    }

    if (role !== 'ALL') {
      list = list.filter((e) => e.userRole === role);
    }

    if (query) {
      list = list.filter(
        (e) =>
          e.userName.toLowerCase().includes(query) ||
          e.description.toLowerCase().includes(query) ||
          e.resource.toLowerCase().includes(query) ||
          e.action.toLowerCase().includes(query) ||
          (e.diffs &&
            e.diffs.some(
              (d) =>
                d.field.toLowerCase().includes(query) ||
                String(d.newValue).toLowerCase().includes(query),
            )),
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading.set(true);
    this.error.set(null);

    this.auditApi.getEvents({ offerId: this.offerId }).subscribe({
      next: (data) => {
        this.events.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Falha ao carregar trilha de auditoria.');
        this.loading.set(false);
      },
    });
  }
}
