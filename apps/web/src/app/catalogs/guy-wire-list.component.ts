import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GuyWireSummary } from '@lt-offers/domain';
import { GuyWiresApi } from './guy-wires-api.service';

@Component({
  selector: 'app-guy-wire-list',
  imports: [RouterLink],
  template: `
    <section>
      <h2>Catálogo de cabos de tirante</h2>

      <form role="search" (submit)="search($event)">
        <label for="search">Buscar por código ou descrição</label>
        <input
          id="search"
          name="search"
          type="search"
          [value]="term()"
          (input)="term.set(searchField.value)"
          #searchField
        />
        <button type="submit">Buscar</button>
        <a routerLink="new">Novo cabo de tirante</a>
      </form>

      @if (loading()) {
        <p>Carregando…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <p>Nenhum cabo de tirante encontrado.</p>
      } @else {
        <table>
          <caption>
            Versões vigentes na data atual
          </caption>
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Descrição</th>
              <th scope="col">Peso (ton/km)</th>
              <th scope="col">Bobina (m)</th>
              <th scope="col">Diâmetro (mm)</th>
              <th scope="col">UTS (kN)</th>
              <th scope="col">Classe de galvanização</th>
              <th scope="col">Grau de resistência</th>
              <th scope="col">Fios</th>
              <th scope="col">Pendências</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr>
                <td>{{ item.code }}</td>
                <td>{{ item.effectiveVersion?.description ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.weightTonPerKm ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.reelLengthM ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.diameterMm ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.utsKn ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.galvanizationClass ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.strengthGrade ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.wireCount ?? '—' }}</td>
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
export class GuyWireListComponent {
  private readonly api = inject(GuyWiresApi);

  readonly term = signal('');
  readonly items = signal<GuyWireSummary[]>([]);
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
