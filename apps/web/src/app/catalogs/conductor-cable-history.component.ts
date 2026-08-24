import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConductorCableHistory } from '@lt-offers/domain';
import { ConductorCablesApi } from './conductor-cables-api.service';

@Component({
  selector: 'app-conductor-cable-history',
  imports: [RouterLink, DatePipe],
  template: `
    <section>
      <h2>Histórico de versões — {{ history()?.code }}</h2>
      <a routerLink="/catalogs/conductor-cables">Voltar à listagem</a>

      @if (history(); as h) {
        <table>
          <caption>
            Da vigência mais recente para a mais antiga; versões são imutáveis
          </caption>
          <thead>
            <tr>
              <th scope="col">Início de vigência</th>
              <th scope="col">Descrição</th>
              <th scope="col">Peso (ton/km)</th>
              <th scope="col">Bobina (m)</th>
              <th scope="col">Diâmetro (mm)</th>
              <th scope="col">UTS (kN)</th>
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
                <td>{{ version.description ?? '—' }}</td>
                <td>{{ version.weightTonPerKm ?? '—' }}</td>
                <td>{{ version.reelLengthM ?? '—' }}</td>
                <td>{{ version.diameterMm ?? '—' }}</td>
                <td>{{ version.utsKn ?? '—' }}</td>
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
export class ConductorCableHistoryComponent {
  private readonly api = inject(ConductorCablesApi);
  private readonly route = inject(ActivatedRoute);

  readonly history = signal<ConductorCableHistory | null>(null);
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
