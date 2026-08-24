import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StructureSeriesHistory } from '@lt-offers/domain';
import { StructureSeriesApi } from './structure-series-api.service';

@Component({
  selector: 'app-structure-series-history',
  imports: [RouterLink, DatePipe],
  template: `
    <section>
      <h2>Histórico de versões — {{ history()?.name }}</h2>
      <a routerLink="/catalogs/structure-series">Voltar à listagem</a>

      @if (history(); as h) {
        <table>
          <caption>
            Da vigência mais recente para a mais antiga; versões são imutáveis
          </caption>
          <thead>
            <tr>
              <th scope="col">Início de vigência</th>
              <th scope="col">Projetista</th>
              <th scope="col">Tensão (kV)</th>
              <th scope="col">Circuitos</th>
              <th scope="col">Cabos por fase</th>
              <th scope="col">Vento de projeto (m/s)</th>
              <th scope="col">Tipo de isolador</th>
              <th scope="col">SIL (MW)</th>
              <th scope="col">Autor</th>
              <th scope="col">Criada em</th>
            </tr>
          </thead>
          <tbody>
            @for (version of h.versions; track version.id) {
              <tr>
                <td>
                  {{ version.effectiveFrom | date: 'dd/MM/yyyy' : 'UTC' }}
                </td>
                <td>{{ version.designer ?? '—' }}</td>
                <td>{{ version.voltageKv ?? '—' }}</td>
                <td>{{ version.circuitCount ?? '—' }}</td>
                <td>{{ version.cablesPerPhase ?? '—' }}</td>
                <td>{{ version.designWindSpeedMs ?? '—' }}</td>
                <td>{{ version.insulatorType ?? '—' }}</td>
                <td>{{ version.silMw ?? '—' }}</td>
                <td>{{ version.createdBy }}</td>
                <td>{{ version.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else {
        <p>Carregando…</p>
      }
    </section>
  `,
  styles: `
    table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 1rem;
    }
    th,
    td {
      text-align: left;
      padding: 0.4rem 0.6rem;
      border-bottom: 1px solid #ddd;
    }
    .error {
      color: #b91c1c;
    }
  `,
})
export class StructureSeriesHistoryComponent {
  private readonly api = inject(StructureSeriesApi);
  private readonly route = inject(ActivatedRoute);

  readonly history = signal<StructureSeriesHistory | null>(null);
  readonly error = signal('');

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('Identificador inválido');
      return;
    }
    this.api.history(id).subscribe({
      next: (h) => this.history.set(h),
      error: () =>
        this.error.set(
          'Não foi possível carregar o histórico; tente novamente',
        ),
    });
  }
}
