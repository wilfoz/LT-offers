import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StructureSeriesSummary } from '@lt-offers/domain';
import { StructureSeriesApi } from './structure-series-api.service';

@Component({
  selector: 'app-structure-series-list',
  imports: [RouterLink],
  template: `
    <section>
      <h2>Catálogo de séries de estruturas</h2>

      <form role="search" (submit)="search($event)">
        <label for="search">Buscar por nome ou projetista</label>
        <input
          id="search"
          name="search"
          type="search"
          [value]="term()"
          (input)="term.set(searchField.value)"
          #searchField
        />
        <button type="submit">Buscar</button>
        <a routerLink="new">Nova série</a>
      </form>

      @if (loading()) {
        <p>Carregando…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <p>Nenhuma série de estrutura encontrada.</p>
      } @else {
        <table>
          <caption>
            Versões vigentes na data atual
          </caption>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Projetista</th>
              <th scope="col">Tensão (kV)</th>
              <th scope="col">Circuitos</th>
              <th scope="col">Cabos por fase</th>
              <th scope="col">Vento de projeto (m/s)</th>
              <th scope="col">Tipo de isolador</th>
              <th scope="col">SIL (MW)</th>
              <th scope="col">Tipos de torre</th>
              <th scope="col">Pendências</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr>
                <td>{{ item.name }}</td>
                <td>{{ item.effectiveVersion?.designer ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.voltageKv ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.circuitCount ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.cablesPerPhase ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.designWindSpeedMs ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.insulatorType ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.silMw ?? '—' }}</td>
                <td>{{ item.towerTypeCount }}</td>
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
                  <a [routerLink]="[item.id]">Tipos de torre</a>
                  <a [routerLink]="[item.id, 'edit']">Editar</a>
                  <a [routerLink]="[item.id, 'history']">Histórico</a>
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
    table {
      border-collapse: collapse;
      width: 100%;
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
    form {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-block: 1rem;
    }
  `,
})
export class StructureSeriesListComponent {
  private readonly api = inject(StructureSeriesApi);

  readonly term = signal('');
  readonly items = signal<StructureSeriesSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.reload();
  }

  search(event: Event): void {
    event.preventDefault();
    this.reload();
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
          'Não foi possível carregar o catálogo; verifique a conexão e tente novamente',
        );
      },
    });
  }
}
