import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TowerTypeHistory } from '@lt-offers/domain';
import { TOWER_FUNCTION_LABELS } from './tower-function-labels';
import { TowerTypesApi } from './tower-types-api.service';

@Component({
  selector: 'app-tower-type-history',
  imports: [RouterLink, DatePipe],
  template: `
    <section>
      <h2>
        Histórico de versões — {{ history()?.code }}
        @if (history(); as h) {
          <small>({{ functionLabels[h.function] }})</small>
        }
      </h2>
      <a [routerLink]="['/catalogs/structure-series', seriesId()]">
        Voltar à série
      </a>

      @if (history(); as h) {
        <p>Da vigência mais recente para a mais antiga; versões são imutáveis</p>
        @for (version of h.versions; track version.id) {
          <article>
            <h3>
              Vigente desde
              {{ version.effectiveFrom | date: 'dd/MM/yyyy' : 'UTC' }}
            </h3>
            <p>
              Estais: <strong>{{ version.guyCount ?? '—' }}</strong> · Autor:
              {{ version.createdBy }} · Criada em
              {{ version.createdAt | date: 'dd/MM/yyyy HH:mm' }}
            </p>
            @if (version.weights.length === 0) {
              <p class="pending">Sem pontos na tabela peso × altura</p>
            } @else {
              <table>
                <thead>
                  <tr>
                    <th scope="col">Altura (m)</th>
                    <th scope="col">Peso (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (point of version.weights; track point.heightM) {
                    <tr>
                      <td>{{ point.heightM }}</td>
                      <td>{{ point.weightKg }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </article>
        }
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else {
        <p>Carregando…</p>
      }
    </section>
  `,
  styles: `
    article {
      border: 1px solid #ddd;
      padding: 0.75rem;
      margin-top: 1rem;
    }
    article h3 {
      margin-top: 0;
    }
    table {
      border-collapse: collapse;
      min-width: 18rem;
    }
    th,
    td {
      text-align: left;
      padding: 0.3rem 0.6rem;
      border-bottom: 1px solid #ddd;
    }
    .pending {
      color: #b45309;
    }
    .error {
      color: #b91c1c;
    }
  `,
})
export class TowerTypeHistoryComponent {
  private readonly api = inject(TowerTypesApi);
  private readonly route = inject(ActivatedRoute);

  readonly functionLabels = TOWER_FUNCTION_LABELS;

  readonly seriesId = signal<number | null>(null);
  readonly history = signal<TowerTypeHistory | null>(null);
  readonly error = signal('');

  constructor() {
    const paramMap = this.route.snapshot.paramMap;
    const seriesId = Number(paramMap.get('seriesId'));
    const id = Number(paramMap.get('id'));
    if (
      !Number.isInteger(seriesId) ||
      seriesId <= 0 ||
      !Number.isInteger(id) ||
      id <= 0
    ) {
      this.error.set('Identificador inválido');
      return;
    }
    this.seriesId.set(seriesId);
    this.api.history(seriesId, id).subscribe({
      next: (h) => this.history.set(h),
      error: () =>
        this.error.set(
          'Não foi possível carregar o histórico; tente novamente',
        ),
    });
  }
}
