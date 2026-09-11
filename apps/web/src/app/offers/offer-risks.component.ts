import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  RiskAssessmentSummary,
  RiskCategory,
  RiskItem,
  RiskTreatment,
} from '@lt-offers/domain';
import { RisksApiService } from './risks-api.service';

@Component({
  selector: 'app-offer-risks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="risks-container">
      <!-- Header -->
      <div class="header-section">
        <div>
          <div class="subtitle-badge">Fase F6.1 · Módulo M12 (RF-61, RF-55)</div>
          <h2 class="title">Matriz de Riscos & Contingências da Proposta</h2>
          <p class="description">
            Identificação e quantificação de incertezas de projeto, cálculo de severidade ponderada e alimentação direta das contingências do BDI.
          </p>
        </div>

        <div class="header-actions">
          <div class="scope-toggle">
            <button
              type="button"
              class="toggle-btn"
              [class.active]="viewScope() === 'CONSOLIDATED'"
              (click)="setScope('CONSOLIDATED')"
            >
              Consolidado do Lote
            </button>
            @for (l of lines; track l.id) {
              <button
                type="button"
                class="toggle-btn"
                [class.active]="viewScope() === 'LINE' && selectedLineId() === l.id"
                (click)="setLine(l.id)"
              >
                {{ l.name || 'LT ' + l.id }}
              </button>
            }
          </div>

          <button
            type="button"
            class="btn btn-primary"
            (click)="openAddModal()"
          >
            + Novo Risco
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      @if (assessment(); as summary) {
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-label">Impacto Bruto Estimado</span>
            <span class="kpi-value">R$ {{ formatCurrency(summary.totalEstimatedImpact) }}</span>
            <span class="kpi-subtext">Cenário com 100% de materialização</span>
          </div>

          <div class="kpi-card highlight">
            <span class="kpi-label">Severidade Ponderada Total</span>
            <span class="kpi-value highlight-text">R$ {{ formatCurrency(summary.totalWeightedSeverity) }}</span>
            <span class="kpi-subtext">Σ (Impacto × Probabilidade)</span>
          </div>

          <div class="kpi-card success">
            <span class="kpi-label">Contingência Transferida ao BDI</span>
            <span class="kpi-value success-text">R$ {{ formatCurrency(summary.bdiContingencyAmount) }}</span>
            <span class="kpi-subtext">Alimenta taxa de contingência em K</span>
          </div>

          <div class="kpi-card neutral">
            <span class="kpi-label">Risco Comercial Assumido</span>
            <span class="kpi-value">R$ {{ formatCurrency(summary.commercialAssumptionAmount) }}</span>
            <span class="kpi-subtext">Absorvido na margem sem onerar edital</span>
          </div>
        </div>

        <!-- Category Breakdown Badges -->
        <div class="category-breakdown">
          <span class="breakdown-title">Distribuição por Categoria:</span>
          <div class="badges-row">
            @for (cat of summary.categoryBreakdown; track cat.category) {
              @if (cat.count > 0) {
                <div class="cat-pill" [attr.data-cat]="cat.category">
                  <strong>{{ getCategoryLabel(cat.category) }}</strong>: {{ cat.count }} item(ns) · R$ {{ formatCurrency(cat.totalWeightedSeverity) }}
                </div>
              }
            }
          </div>
        </div>

        <!-- Risks Table -->
        <div class="table-card">
          <div class="card-header">
            <h3>Registro Analítico de Incertezas e Riscos ({{ summary.items.length }})</h3>
          </div>

          <div class="table-responsive">
            <table class="risks-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Descrição & Situação na Proposta</th>
                  <th>Mitigação / Ação Adotada</th>
                  <th class="text-right">Impacto (R$)</th>
                  <th class="text-center">Prob. (%)</th>
                  <th class="text-right">Severidade (R$)</th>
                  <th>Tratamento</th>
                  <th class="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                @for (item of summary.items; track item.id) {
                  <tr>
                    <td>
                      <span class="badge-cat" [attr.data-cat]="item.category">
                        {{ getCategoryLabel(item.category) }}
                      </span>
                    </td>
                    <td>
                      <div class="item-desc"><strong>{{ item.description }}</strong></div>
                      @if (item.situation) {
                        <div class="item-situation">{{ item.situation }}</div>
                      }
                    </td>
                    <td>
                      <div class="item-mitigation">{{ item.mitigationAction || '—' }}</div>
                    </td>
                    <td class="text-right num">
                      R$ {{ formatCurrency(item.estimatedImpact) }}
                    </td>
                    <td class="text-center num">
                      {{ item.probabilityPercent }}%
                    </td>
                    <td class="text-right num highlight-cell">
                      <strong>R$ {{ formatCurrency(item.weightedSeverity) }}</strong>
                    </td>
                    <td>
                      <span
                        class="treatment-badge"
                        [class.bdi]="item.treatment === 'CONTINGENCY_BDI'"
                        [class.commercial]="item.treatment === 'COMMERCIAL_ASSUMPTION'"
                      >
                        {{ item.treatment === 'CONTINGENCY_BDI' ? 'Contingência BDI' : 'Premissa Comercial' }}
                      </span>
                    </td>
                    <td class="text-center">
                      <div class="action-btns">
                        <button
                          type="button"
                          class="btn-icon"
                          title="Editar"
                          (click)="editRisk(item)"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          class="btn-icon delete"
                          title="Excluir"
                          (click)="deleteRisk(item.id)"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="empty-state">
                      Nenhum risco registrado nesta seleção. Clique em "+ Novo Risco" para adicionar.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Modal de Cadastro / Edição -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingId() ? 'Editar Risco' : 'Cadastrar Novo Risco' }}</h3>
              <button type="button" class="btn-close" (click)="closeModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-row">
                <div class="form-group col-6">
                  <label>Categoria de Risco *</label>
                  <select [(ngModel)]="formCategory" class="form-control">
                    <option value="LAND_EASEMENT">Fundiário / Servidão</option>
                    <option value="ENVIRONMENTAL">Ambiental / Licenciamento</option>
                    <option value="SCHEDULE_TIMELINE">Prazo / Cronograma</option>
                    <option value="WEATHER_RAIN">Clima / Chuva</option>
                    <option value="GEOTECHNICAL_SOIL">Geotécnico / Solo</option>
                    <option value="ENGINEERING_INTERFACE">Engenharia / Interface</option>
                    <option value="THIRD_PARTY_MARKET">Terceiros / Mercado</option>
                    <option value="OTHER">Outros</option>
                  </select>
                </div>

                <div class="form-group col-6">
                  <label>Linha de Transmissão</label>
                  <select [(ngModel)]="formLineId" class="form-control">
                    <option [value]="undefined">Lote Geral (Todas as Linhas)</option>
                    @for (l of lines; track l.id) {
                      <option [value]="String(l.id)">{{ l.name || 'LT ' + l.id }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Descrição do Risco *</label>
                <input
                  type="text"
                  [(ngModel)]="formDescription"
                  class="form-control"
                  placeholder="Ex.: Aumento de rocha dura na travessia da serra"
                />
              </div>

              <div class="form-group">
                <label>Situação / Contexto na Proposta</label>
                <textarea
                  [(ngModel)]="formSituation"
                  class="form-control"
                  rows="2"
                  placeholder="Ex.: Sondagens preliminares com espaçamento superior a 2 km..."
                ></textarea>
              </div>

              <div class="form-group">
                <label>Ação de Mitigação Adotada</label>
                <textarea
                  [(ngModel)]="formMitigation"
                  class="form-control"
                  rows="2"
                  placeholder="Ex.: Mobilizar perfuratriz rotativa adicional e prever turno estendido..."
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group col-4">
                  <label>Impacto Estimado (R$) *</label>
                  <input
                    type="number"
                    step="1000"
                    [(ngModel)]="formImpact"
                    class="form-control"
                    placeholder="0.00"
                  />
                </div>

                <div class="form-group col-4">
                  <label>Probabilidade (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    [(ngModel)]="formProbability"
                    class="form-control"
                    placeholder="30"
                  />
                </div>

                <div class="form-group col-4">
                  <label>Severidade Calculada</label>
                  <div class="calc-preview">
                    R$ {{ formatCurrency(calcPreviewSeverity()) }}
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Tratamento na Formação de Preço *</label>
                <div class="radio-group">
                  <label class="radio-label">
                    <input
                      type="radio"
                      name="treatment"
                      value="CONTINGENCY_BDI"
                      [(ngModel)]="formTreatment"
                    />
                    <strong>Contingência BDI:</strong> Adiciona o valor ponderado à linha de contingência da proposta.
                  </label>
                  <label class="radio-label">
                    <input
                      type="radio"
                      name="treatment"
                      value="COMMERCIAL_ASSUMPTION"
                      [(ngModel)]="formTreatment"
                    />
                    <strong>Premissa Comercial:</strong> Incerteza monitorada assumida na margem sem onerar o edital.
                  </label>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
              <button
                type="button"
                class="btn btn-primary"
                [disabled]="!formDescription || !formImpact"
                (click)="saveCurrentRisk()"
              >
                Salvar Risco
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .risks-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1rem 0;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 1rem;
    }
    .subtitle-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #3b82f6;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }
    .title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }
    .description {
      color: #64748b;
      margin: 0.25rem 0 0;
      font-size: 0.9rem;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .scope-toggle {
      display: flex;
      background: #f1f5f9;
      padding: 0.25rem;
      border-radius: 6px;
    }
    .toggle-btn {
      border: none;
      background: transparent;
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #64748b;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .toggle-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    .kpi-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .kpi-card.highlight {
      border-color: #93c5fd;
      background: #eff6ff;
    }
    .kpi-card.success {
      border-color: #86efac;
      background: #f0fdf4;
    }
    .kpi-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .kpi-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-value.highlight-text { color: #1d4ed8; }
    .kpi-value.success-text { color: #15803d; }
    .kpi-subtext {
      font-size: 0.75rem;
      color: #94a3b8;
    }
    .category-breakdown {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0.6rem 1rem;
      font-size: 0.85rem;
    }
    .breakdown-title {
      font-weight: 600;
      color: #475569;
    }
    .badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .cat-pill {
      background: #e2e8f0;
      color: #334155;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }
    .table-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .card-header {
      padding: 0.8rem 1rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .card-header h3 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: #1e293b;
    }
    .risks-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .risks-table th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      padding: 0.6rem 0.8rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    .risks-table td {
      padding: 0.6rem 0.8rem;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    .num { font-variant-numeric: tabular-nums; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .highlight-cell { color: #1d4ed8; }
    .item-desc { color: #0f172a; font-weight: 600; }
    .item-situation { font-size: 0.75rem; color: #64748b; margin-top: 0.15rem; }
    .item-mitigation { font-size: 0.8rem; color: #334155; }
    .badge-cat {
      display: inline-block;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      background: #e2e8f0;
      color: #334155;
    }
    .badge-cat[data-cat="LAND_EASEMENT"] { background: #fef3c7; color: #92400e; }
    .badge-cat[data-cat="ENVIRONMENTAL"] { background: #dcfce7; color: #166534; }
    .badge-cat[data-cat="GEOTECHNICAL_SOIL"] { background: #ffedd5; color: #9a3412; }
    .badge-cat[data-cat="SCHEDULE_TIMELINE"] { background: #fee2e2; color: #991b1b; }
    .badge-cat[data-cat="WEATHER_RAIN"] { background: #e0e7ff; color: #3730a3; }
    .badge-cat[data-cat="THIRD_PARTY_MARKET"] { background: #f3e8ff; color: #6b21a8; }
    .treatment-badge {
      display: inline-block;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .treatment-badge.bdi { background: #dbeafe; color: #1e40af; }
    .treatment-badge.commercial { background: #f1f5f9; color: #475569; }
    .action-btns { display: flex; justify-content: center; gap: 0.4rem; }
    .btn-icon {
      border: 1px solid #cbd5e1;
      background: #ffffff;
      border-radius: 4px;
      padding: 0.25rem 0.45rem;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .btn-icon.delete:hover { background: #fee2e2; border-color: #fca5a5; color: #b91c1c; }
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
    }
    .btn-primary { background: #2563eb; color: #ffffff; }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-secondary { background: #e2e8f0; color: #334155; }
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 8px;
      width: 600px;
      max-width: 95vw;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; }
    .btn-close { border: none; background: transparent; font-size: 1.1rem; cursor: pointer; color: #94a3b8; }
    .modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.25rem; }
    .form-group label { font-size: 0.8rem; font-weight: 600; color: #475569; }
    .form-row { display: flex; gap: 0.75rem; }
    .col-6 { flex: 1; }
    .col-4 { flex: 1; }
    .form-control {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.45rem 0.65rem;
      font-size: 0.85rem;
      outline: none;
    }
    .form-control:focus { border-color: #3b82f6; }
    .calc-preview {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.45rem 0.65rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: #1d4ed8;
      text-align: right;
    }
    .radio-group { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.25rem; }
    .radio-label { font-size: 0.85rem; color: #334155; display: flex; align-items: flex-start; gap: 0.4rem; cursor: pointer; }
    .modal-footer {
      padding: 0.85rem 1.25rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
      background: #f8fafc;
    }
    .empty-state { text-align: center; color: #94a3b8; padding: 2rem !important; }
  `]
})
export class OfferRisksComponent implements OnInit {
  @Input({ required: true }) offerId!: number;
  @Input() lines: Array<{ id: number; name: string }> = [];

  private risksApi = inject(RisksApiService);

  viewScope = signal<'CONSOLIDATED' | 'LINE'>('CONSOLIDATED');
  selectedLineId = signal<number | undefined>(undefined);
  assessment = signal<RiskAssessmentSummary | null>(null);

  showModal = signal(false);
  editingId = signal<string | null>(null);

  formCategory: RiskCategory = 'LAND_EASEMENT';
  formLineId?: string;
  formDescription = '';
  formSituation = '';
  formMitigation = '';
  formImpact = '';
  formProbability = '30';
  formTreatment: RiskTreatment = 'CONTINGENCY_BDI';

  String = String;

  ngOnInit(): void {
    this.loadRisks();
  }

  loadRisks(): void {
    const lineIdStr = this.viewScope() === 'LINE' && this.selectedLineId()
      ? String(this.selectedLineId())
      : undefined;

    this.risksApi.getRisks(this.offerId, lineIdStr).subscribe((res) => {
      this.assessment.set(res);
    });
  }

  setScope(scope: 'CONSOLIDATED' | 'LINE'): void {
    this.viewScope.set(scope);
    if (scope === 'CONSOLIDATED') {
      this.selectedLineId.set(undefined);
    }
    this.loadRisks();
  }

  setLine(lineId: number): void {
    this.viewScope.set('LINE');
    this.selectedLineId.set(lineId);
    this.loadRisks();
  }

  getCategoryLabel(category: RiskCategory): string {
    const labels: Record<RiskCategory, string> = {
      LAND_EASEMENT: 'Fundiário / Servidão',
      ENVIRONMENTAL: 'Ambiental / Licenciamento',
      SCHEDULE_TIMELINE: 'Prazo / Cronograma',
      WEATHER_RAIN: 'Clima / Chuva',
      GEOTECHNICAL_SOIL: 'Geotécnico / Solo',
      ENGINEERING_INTERFACE: 'Engenharia / Interface',
      THIRD_PARTY_MARKET: 'Terceiros / Mercado',
      OTHER: 'Outros',
    };
    return labels[category] || category;
  }

  calcPreviewSeverity(): string {
    const imp = Number(this.formImpact || 0);
    const prob = Number(this.formProbability || 0);
    return ((imp * prob) / 100).toFixed(2);
  }

  openAddModal(): void {
    this.editingId.set(null);
    this.formCategory = 'LAND_EASEMENT';
    this.formLineId = this.selectedLineId() ? String(this.selectedLineId()) : undefined;
    this.formDescription = '';
    this.formSituation = '';
    this.formMitigation = '';
    this.formImpact = '';
    this.formProbability = '30';
    this.formTreatment = 'CONTINGENCY_BDI';
    this.showModal.set(true);
  }

  editRisk(item: RiskItem): void {
    this.editingId.set(item.id);
    this.formCategory = item.category;
    this.formLineId = item.lineId;
    this.formDescription = item.description;
    this.formSituation = item.situation;
    this.formMitigation = item.mitigationAction;
    this.formImpact = item.estimatedImpact;
    this.formProbability = item.probabilityPercent;
    this.formTreatment = item.treatment;
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
  }

  saveCurrentRisk(): void {
    const payload: Partial<RiskItem> = {
      id: this.editingId() || undefined,
      lineId: this.formLineId,
      category: this.formCategory,
      description: this.formDescription,
      situation: this.formSituation,
      mitigationAction: this.formMitigation,
      estimatedImpact: this.formImpact,
      probabilityPercent: this.formProbability,
      treatment: this.formTreatment,
    };

    this.risksApi.saveRisk(this.offerId, payload).subscribe((res) => {
      this.assessment.set(res);
      this.closeModal();
    });
  }

  deleteRisk(riskId: string): void {
    const lineIdStr = this.viewScope() === 'LINE' && this.selectedLineId()
      ? String(this.selectedLineId())
      : undefined;

    this.risksApi.deleteRisk(this.offerId, riskId, lineIdStr).subscribe((res) => {
      this.assessment.set(res);
    });
  }

  formatCurrency(val: string | number | undefined): string {
    if (!val) return '0,00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return num.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
