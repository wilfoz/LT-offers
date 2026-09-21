import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampCostSummary } from '@lt-offers/domain';
import { ScheduleApiService } from './schedule-api.service';

@Component({
  selector: 'app-camps-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="camps-container">
      <div class="header-section">
        <div>
          <div class="subtitle-badge">Fase F4 · Módulo M07 (RF-41)</div>
          <h2 class="title">Canteiros de Obra e Alojamentos</h2>
          <p class="description">
            Dimensionamento orçamentário do Canteiro Central e Canteiros
            Avançados, custos de terraplenagem/implantação, infraestrutura
            modular, quadro de pessoal indireto de apoio e desmobilização.
          </p>
        </div>

        <button
          type="button"
          class="btn btn-primary"
          [disabled]="loading()"
          (click)="loadCamps()"
        >
          <span class="icon">🔄</span>
          Atualizar Canteiros
        </button>
      </div>

      @if (loading()) {
        <div class="loading-panel">
          <div class="spinner"></div>
          <span>Carregando dimensionamento de canteiros...</span>
        </div>
      }

      @if (errorMessage()) {
        <div class="error-panel">
          <span>⚠️ {{ errorMessage() }}</span>
        </div>
      }

      @if (!loading() && campsSummary()) {
        <!-- KPIs -->
        <div class="kpis-grid">
          <div class="kpi-card">
            <div class="kpi-label">Custo Total de Canteiros</div>
            <div class="kpi-value highlight">
              {{ formatCurrency(campsSummary()?.totalCampsCost) }}
            </div>
            <div class="kpi-subtext">Implantação + Operação + Desmob.</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Implantação & Módulos</div>
            <div class="kpi-value">
              {{ formatCurrency(campsSummary()?.totalImplementationCost) }}
            </div>
            <div class="kpi-subtext">Infraestrutura inicial</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Operação & Manutenção</div>
            <div class="kpi-value">
              {{ formatCurrency(campsSummary()?.totalOperatingCost) }}
            </div>
            <div class="kpi-subtext">Aluguéis + Pessoal de Apoio</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Desmobilização</div>
            <div class="kpi-value">
              {{ formatCurrency(campsSummary()?.totalDemobilizationCost) }}
            </div>
            <div class="kpi-subtext">Encerramento de bases</div>
          </div>
        </div>

        <!-- Cards de Canteiros -->
        <div class="camps-list">
          @for (camp of campsSummary()?.camps; track camp.id) {
            <div class="camp-card">
              <div class="camp-header">
                <div class="camp-title-group">
                  <span
                    class="camp-type-badge"
                    [class.type-central]="camp.type === 'CENTRAL'"
                  >
                    {{
                      camp.type === 'CENTRAL'
                        ? 'Canteiro Central'
                        : 'Canteiro Avançado'
                    }}
                  </span>
                  <h3 class="camp-name">{{ camp.name }}</h3>
                  <span class="camp-location"
                    >Estaca / Local: Km {{ camp.locationKm || '0' }} · Período:
                    M{{ camp.startMonth }}..M{{ camp.endMonth }} ({{
                      camp.durationMonths
                    }}
                    meses)</span
                  >
                </div>
                <div class="camp-total-cost">
                  <div class="cost-label">Custo Total do Canteiro</div>
                  <div class="cost-value">
                    {{ formatCurrency(camp.totalCampCost) }}
                  </div>
                </div>
              </div>

              <div class="camp-details-grid">
                <div class="detail-box">
                  <div class="box-label">Implantação</div>
                  <div class="box-value">
                    {{ formatCurrency(camp.implementationCost) }}
                  </div>
                </div>
                <div class="detail-box">
                  <div class="box-label">Custo Fixo Mensal</div>
                  <div class="box-value">
                    {{ formatCurrency(camp.fixedMonthlyCost) }}/mês
                  </div>
                </div>
                <div class="detail-box">
                  <div class="box-label">Pessoal Mensal</div>
                  <div class="box-value">
                    {{ formatCurrency(camp.totalPersonnelMonthlyCost) }}/mês
                  </div>
                </div>
                <div class="detail-box">
                  <div class="box-label">Desmobilização</div>
                  <div class="box-value">
                    {{ formatCurrency(camp.demobilizationCost) }}
                  </div>
                </div>
              </div>

              <!-- Quadro de Pessoal do Canteiro -->
              @if (camp.personnel && camp.personnel.length > 0) {
                <div class="personnel-section">
                  <h4 class="personnel-title">
                    Quadro de Pessoal Indireto do Canteiro ({{
                      camp.personnel.length
                    }}
                    cargos)
                  </h4>
                  <table class="personnel-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Função / Cargo</th>
                        <th>Qtd.</th>
                        <th>Custo Unitário Mensal</th>
                        <th>Total Mensal</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (p of camp.personnel; track p.laborRoleId) {
                        <tr>
                          <td class="font-mono">{{ p.laborRoleCode }}</td>
                          <td>{{ p.laborRoleName }}</td>
                          <td class="text-center font-bold">
                            {{ p.quantity }}
                          </td>
                          <td class="text-right">
                            {{ formatCurrency(p.monthlyUnitCost) }}
                          </td>
                          <td class="text-right font-bold">
                            {{ formatCurrency(p.totalMonthlyCost) }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }
        </div>

        <!-- 3. Painel Analítico de Indiretos Gerais de Projeto (Inspirado na sheet Indirectos) -->
        <div class="indirects-card">
          <div class="indirects-header">
            <div>
              <h3 class="indirects-title">
                Equipe de Gestão e Indiretos de Obra (Aba Indirectos)
              </h3>
              <p class="indirects-subtitle">
                Relação analítica do staff administrativo de campo cruzado com benefícios e apoio operacional (veículo 4x4, telefonia, TI, EPI, exames e viagens).
              </p>
            </div>
            <span class="badge-indirects font-mono">
              Total Mensal Indiretos: {{ formatCurrency(totalMonthlyIndirects) }}
            </span>
          </div>

          <div class="table-scroll">
            <table class="personnel-table multi-tier-personnel">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cargo / Função</th>
                  <th class="text-center">Qtd</th>
                  <th>Veículo Alocado</th>
                  <th>Telefonia / TI</th>
                  <th class="text-right">EPI Mensal</th>
                  <th class="text-right">Exames / Viagens</th>
                  <th class="text-right">Salário + Encargos</th>
                  <th class="text-right">Total Mensal</th>
                </tr>
              </thead>
              <tbody>
                @for (staff of indirectStaff; track staff.id) {
                  <tr>
                    <td><span class="code-badge font-mono">{{ staff.roleCode }}</span></td>
                    <td><strong>{{ staff.roleName }}</strong></td>
                    <td class="text-center font-bold font-mono">{{ staff.headcount }}</td>
                    <td><span class="vehicle-badge">{{ staff.vehicleType || '—' }}</span></td>
                    <td><span class="phone-badge">{{ staff.phoneTier || 'BÁSICO' }}</span></td>
                    <td class="text-right font-mono">{{ formatCurrency(staff.epiMonthlyBrl) }}</td>
                    <td class="text-right font-mono">{{ formatCurrency(staff.examsBrl + staff.travelMonthlyBrl) }}</td>
                    <td class="text-right font-mono font-medium">{{ formatCurrency(staff.salaryMonthlyBrl) }}</td>
                    <td class="text-right font-mono font-bold text-emerald-800">
                      {{ formatCurrency(staff.totalMonthlyBrl) }}
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="footer-total-row">
                  <td colspan="2" class="font-bold">TOTAL EQUIPE INDIRETA / MÊS:</td>
                  <td class="text-center font-bold font-mono">{{ totalIndirectHeadcount }}</td>
                  <td colspan="5" class="text-right font-bold">CUSTO MENSAL CONSOLIDADO:</td>
                  <td class="text-right font-mono font-bold text-emerald-800 font-lg">
                    {{ formatCurrency(totalMonthlyIndirects) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      }
    </div>

  `,
  styles: [
    `
      .camps-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.5rem;
        background: #f8fafc;
        font-family:
          -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .header-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        background: #ffffff;
        padding: 1.5rem;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }

      .subtitle-badge {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #b45309;
        background: #fef3c7;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        margin-bottom: 0.5rem;
      }

      .title {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
        font-weight: 700;
        color: #0f172a;
      }

      .description {
        margin: 0;
        font-size: 0.875rem;
        color: #64748b;
        max-width: 850px;
        line-height: 1.5;
      }

      .btn-primary {
        background: #0284c7;
        color: #ffffff;
        padding: 0.625rem 1.25rem;
        font-size: 0.875rem;
        font-weight: 600;
        border-radius: 8px;
        border: none;
        cursor: pointer;
      }

      .kpis-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
      }

      .kpi-card {
        background: #ffffff;
        padding: 1.25rem;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }

      .kpi-label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: #64748b;
        margin-bottom: 0.5rem;
      }

      .kpi-value {
        font-size: 1.5rem;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 0.25rem;
      }

      .kpi-value.highlight {
        color: #b45309;
      }
      .kpi-subtext {
        font-size: 0.75rem;
        color: #94a3b8;
      }

      .camps-list {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .camp-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.5rem;
      }

      .camp-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.25rem;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 1rem;
      }

      .camp-type-badge {
        display: inline-block;
        font-size: 0.6875rem;
        font-weight: 700;
        text-transform: uppercase;
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        background: #e2e8f0;
        color: #475569;
        margin-bottom: 0.25rem;
      }

      .camp-type-badge.type-central {
        background: #fef3c7;
        color: #b45309;
      }

      .camp-name {
        margin: 0.25rem 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: #0f172a;
      }

      .camp-location {
        font-size: 0.8125rem;
        color: #64748b;
      }

      .camp-total-cost {
        text-align: right;
      }

      .cost-label {
        font-size: 0.75rem;
        color: #64748b;
      }

      .cost-value {
        font-size: 1.375rem;
        font-weight: 800;
        color: #0284c7;
      }

      .camp-details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 1rem;
        margin-bottom: 1.25rem;
      }

      .detail-box {
        background: #f8fafc;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
      }

      .box-label {
        font-size: 0.6875rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
      }

      .box-value {
        font-size: 1rem;
        font-weight: 700;
        color: #0f172a;
        margin-top: 0.25rem;
      }

      .personnel-section {
        margin-top: 1rem;
      }

      .personnel-title {
        margin: 0 0 0.5rem 0;
        font-size: 0.875rem;
        font-weight: 700;
        color: #475569;
      }

      .personnel-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.8125rem;
      }

      .personnel-table th,
      .personnel-table td {
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .personnel-table th {
        background: #f8fafc;
        text-align: left;
        font-weight: 700;
        color: #475569;
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
    `,
  ],
})
export class CampsManagementComponent implements OnInit {
  @Input({ required: true }) lineId!: number;

  private readonly scheduleApi = inject(ScheduleApiService);

  loading = signal(true);
  errorMessage = signal<string | null>(null);
  campsSummary = signal<CampCostSummary | null>(null);

  readonly indirectStaff: import('@lt-offers/domain').ProjectIndirectStaffItem[] = [
    {
      id: 'IND-01',
      roleCode: 'DIR-01',
      roleName: 'Gerente de Contratos / Diretor de Obra',
      category: 'MANAGEMENT',
      headcount: 1,
      vehicleType: 'VEÍCULO TIPO DUSTER 4X4',
      phoneTier: 'FROTA GAMA ALTA',
      laptopAssigned: true,
      epiMonthlyBrl: 350,
      examsBrl: 600,
      travelMonthlyBrl: 3200,
      salaryMonthlyBrl: 38000,
      totalMonthlyBrl: 42150,
    },
    {
      id: 'IND-02',
      roleCode: 'DIR-02',
      roleName: 'Engenheiro Residente Geral',
      category: 'MANAGEMENT',
      headcount: 1,
      vehicleType: 'VEÍCULO TIPO DUSTER 4X4',
      phoneTier: 'FROTA GAMA ALTA',
      laptopAssigned: true,
      epiMonthlyBrl: 350,
      examsBrl: 600,
      travelMonthlyBrl: 2400,
      salaryMonthlyBrl: 28000,
      totalMonthlyBrl: 31350,
    },
    {
      id: 'IND-03',
      roleCode: 'DIR-03',
      roleName: 'Engenheiro de Planejamento e Controle',
      category: 'MANAGEMENT',
      headcount: 1,
      vehicleType: 'VEÍCULO LEVE SEDAN',
      phoneTier: 'FROTA GAMA MÉDIA',
      laptopAssigned: true,
      epiMonthlyBrl: 250,
      examsBrl: 600,
      travelMonthlyBrl: 1800,
      salaryMonthlyBrl: 22000,
      totalMonthlyBrl: 24650,
    },
    {
      id: 'IND-04',
      roleCode: 'DIR-04',
      roleName: 'Engenheiro Eletromecânico de Campo',
      category: 'SUPERVISION',
      headcount: 2,
      vehicleType: 'PICK-UP 4X4 CABINE DUPLA',
      phoneTier: 'FROTA GAMA MÉDIA',
      laptopAssigned: true,
      epiMonthlyBrl: 500,
      examsBrl: 1200,
      travelMonthlyBrl: 2800,
      salaryMonthlyBrl: 36000,
      totalMonthlyBrl: 40500,
    },
    {
      id: 'IND-05',
      roleCode: 'DIR-05',
      roleName: 'Topógrafo Chefe de Obras',
      category: 'SUPERVISION',
      headcount: 2,
      vehicleType: 'PICK-UP 4X4 CABINE DUPLA',
      phoneTier: 'FROTA GAMA MÉDIA',
      laptopAssigned: true,
      epiMonthlyBrl: 600,
      examsBrl: 1200,
      travelMonthlyBrl: 1600,
      salaryMonthlyBrl: 24000,
      totalMonthlyBrl: 27400,
    },
    {
      id: 'IND-06',
      roleCode: 'DIR-06',
      roleName: 'Técnico em Segurança do Trabalho (TST)',
      category: 'SAFETY_ENVIRONMENT',
      headcount: 3,
      vehicleType: 'VEÍCULO TIPO DUSTER 4X4',
      phoneTier: 'FROTA GAMA MÉDIA',
      laptopAssigned: true,
      epiMonthlyBrl: 900,
      examsBrl: 1800,
      travelMonthlyBrl: 1200,
      salaryMonthlyBrl: 21000,
      totalMonthlyBrl: 24900,
    },
  ];

  get totalIndirectHeadcount(): number {
    return this.indirectStaff.reduce((acc, s) => acc + s.headcount, 0);
  }

  get totalMonthlyIndirects(): number {
    return this.indirectStaff.reduce((acc, s) => acc + s.totalMonthlyBrl, 0);
  }

  ngOnInit(): void {
    if (this.lineId) {
      this.loadCamps();
    }
  }

  loadCamps(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.scheduleApi.getLineCamps(this.lineId).subscribe({
      next: (data) => {
        this.campsSummary.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message || 'Falha ao carregar canteiros da linha.',
        );
        this.loading.set(false);
      },
    });
  }

  formatCurrency(val?: string | number): string {
    if (val === undefined || val === null) return 'R$ 0,00';
    const num = typeof val === 'number' ? val : parseFloat(val);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}

