import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  StructureSeriesSummary,
  TowerTypeSummary,
  TowerTypeVersion,
} from '@lt-offers/domain';
import { StructureSeriesApi } from './structure-series-api.service';
import { TOWER_FUNCTION_LABELS } from './tower-function-labels';
import { TowerTypesApi } from './tower-types-api.service';

@Component({
  selector: 'app-structure-series-detail',
  imports: [RouterLink],
  template: `
    <section>
      <h2>Série de estrutura — {{ series()?.name ?? title() }}</h2>
      <nav>
        <a routerLink="/catalogs/structure-series">Voltar à listagem</a>
        @if (seriesId(); as id) {
          <a [routerLink]="['/catalogs/structure-series', id, 'edit']">
            Editar série
          </a>
          <a [routerLink]="['/catalogs/structure-series', id, 'history']">
            Histórico da série
          </a>
        }
      </nav>

      @if (seriesError()) {
        <p class="error" role="alert">{{ seriesError() }}</p>
      } @else if (series(); as s) {
        <dl>
          <div>
            <dt>Projetista</dt>
            <dd>{{ s.effectiveVersion?.designer ?? '—' }}</dd>
          </div>
          <div>
            <dt>Tensão (kV)</dt>
            <dd>{{ s.effectiveVersion?.voltageKv ?? '—' }}</dd>
          </div>
          <div>
            <dt>Circuitos</dt>
            <dd>{{ s.effectiveVersion?.circuitCount ?? '—' }}</dd>
          </div>
          <div>
            <dt>Cabos por fase</dt>
            <dd>{{ s.effectiveVersion?.cablesPerPhase ?? '—' }}</dd>
          </div>
          <div>
            <dt>Vento de projeto (m/s)</dt>
            <dd>{{ s.effectiveVersion?.designWindSpeedMs ?? '—' }}</dd>
          </div>
          <div>
            <dt>Tipo de isolador</dt>
            <dd>{{ s.effectiveVersion?.insulatorType ?? '—' }}</dd>
          </div>
          <div>
            <dt>SIL (MW)</dt>
            <dd>{{ s.effectiveVersion?.silMw ?? '—' }}</dd>
          </div>
        </dl>
        @if (s.pendingFields.length > 0) {
          <p class="pending">
            Pendente: {{ s.pendingFields.join(', ') }}
          </p>
        }
      } @else {
        <p>Carregando…</p>
      }

      <h3>Tipos de torre</h3>
      @if (seriesId(); as id) {
        <a
          [routerLink]="['/catalogs/structure-series', id, 'tower-types', 'new']"
        >
          Novo tipo de torre
        </a>
      }

      @if (typesLoading()) {
        <p>Carregando…</p>
      } @else if (typesError()) {
        <p class="error" role="alert">{{ typesError() }}</p>
      } @else if (types().length === 0) {
        <p>Nenhum tipo de torre cadastrado nesta série.</p>
      } @else {
        <table>
          <caption>
            Versões vigentes na data atual
          </caption>
          <thead>
            <tr>
              <th scope="col">Sigla</th>
              <th scope="col">Função</th>
              <th scope="col">Estais</th>
              <th scope="col">Tabela peso × altura</th>
              <th scope="col">Pendências</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (item of types(); track item.id) {
              <tr>
                <td>{{ item.code }}</td>
                <td>{{ functionLabels[item.function] }}</td>
                <td>{{ item.effectiveVersion?.guyCount ?? '—' }}</td>
                <td>{{ weightsSummary(item.effectiveVersion) }}</td>
                <td>
                  @if (!item.effectiveVersion) {
                    <strong class="pending">Sem versão vigente</strong>
                  } @else if (item.pendingFields.length > 0) {
                    <strong class="pending">
                      Pendente: {{ item.pendingFields.join(', ') }}
                    </strong>
                  } @else {
                    <span>Completo</span>
                  }
                </td>
                <td>
                  <a
                    [routerLink]="[
                      '/catalogs/structure-series',
                      seriesId(),
                      'tower-types',
                      item.id,
                      'edit',
                    ]"
                  >
                    Editar
                  </a>
                  <a
                    [routerLink]="[
                      '/catalogs/structure-series',
                      seriesId(),
                      'tower-types',
                      item.id,
                      'history',
                    ]"
                  >
                    Histórico
                  </a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: `
    .pending {
      color: #b45309;
    }
    .error {
      color: #b91c1c;
    }
    nav a + a {
      margin-left: 0.6rem;
    }
    dl {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
      gap: 0.5rem;
      margin-block: 1rem;
    }
    dt {
      font-weight: 600;
    }
    dd {
      margin: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 0.5rem;
    }
    th,
    td {
      text-align: left;
      padding: 0.4rem 0.6rem;
      border-bottom: 1px solid #ddd;
    }
    td a + a {
      margin-left: 0.6rem;
    }
  `,
})
export class StructureSeriesDetailComponent {
  private readonly seriesApi = inject(StructureSeriesApi);
  private readonly towerTypesApi = inject(TowerTypesApi);
  private readonly route = inject(ActivatedRoute);

  readonly functionLabels = TOWER_FUNCTION_LABELS;

  readonly seriesId = signal<number | null>(null);
  readonly title = signal('');
  readonly series = signal<StructureSeriesSummary | null>(null);
  readonly seriesError = signal('');
  readonly types = signal<TowerTypeSummary[]>([]);
  readonly typesLoading = signal(true);
  readonly typesError = signal('');

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.seriesError.set('Identificador inválido');
      this.typesLoading.set(false);
      return;
    }
    this.seriesId.set(id);
    this.title.set(`série #${id}`);

    this.seriesApi.get(id).subscribe({
      next: (s) => this.series.set(s),
      error: (error) =>
        this.seriesError.set(
          error?.error?.message ??
            'Não foi possível carregar os dados da série; tente novamente',
        ),
    });

    this.towerTypesApi.list(id).subscribe({
      next: (types) => {
        this.types.set(types);
        this.typesLoading.set(false);
      },
      error: () => {
        this.typesLoading.set(false);
        this.typesError.set(
          'Não foi possível carregar os tipos de torre; tente novamente',
        );
      },
    });
  }

  /** Resumo da tabela vigente: quantidade de pontos e faixa de alturas. */
  weightsSummary(version: TowerTypeVersion | null | undefined): string {
    if (!version || version.weights.length === 0) {
      return '—';
    }
    const heights = version.weights.map((w) => w.heightM);
    if (heights.length === 1) {
      return `1 altura (${heights[0]} m)`;
    }
    return `${heights.length} alturas (${heights[0]}–${heights[heights.length - 1]} m)`;
  }
}
