import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GroundWireSummary, GroundWireType } from '@lt-offers/domain';
import {
  GROUND_WIRE_TYPE_LABELS,
  typeSpecificSummary,
} from './ground-wire-labels';
import { GroundWiresApi } from './ground-wires-api.service';

@Component({
  selector: 'app-ground-wire-list',
  imports: [RouterLink],
  template: `
    <section>
      <h2>Catálogo de cabos de guarda</h2>

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
        <label for="type">Tipo</label>
        <select
          id="type"
          name="type"
          [value]="typeFilter()"
          (change)="filterByType(typeField.value)"
          #typeField
        >
          <option value="">Todos</option>
          <option value="STEEL">Aço</option>
          <option value="OPGW">OPGW</option>
        </select>
        <button type="submit">Buscar</button>
        <a routerLink="new">Novo cabo de guarda</a>
      </form>

      @if (loading()) {
        <p>Carregando…</p>
      } @else if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      } @else if (items().length === 0) {
        <p>Nenhum cabo de guarda encontrado.</p>
      } @else {
        <table>
          <caption>
            Versões vigentes na data atual
          </caption>
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Tipo</th>
              <th scope="col">Descrição</th>
              <th scope="col">Peso (ton/km)</th>
              <th scope="col">Bobina (m)</th>
              <th scope="col">Diâmetro (mm)</th>
              <th scope="col">UTS (kN)</th>
              <th scope="col">Atributos do tipo</th>
              <th scope="col">Pendências</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr>
                <td>{{ item.code }}</td>
                <td>{{ typeLabel(item.type) }}</td>
                <td>{{ item.effectiveVersion?.description ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.weightTonPerKm ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.reelLengthM ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.diameterMm ?? '—' }}</td>
                <td>{{ item.effectiveVersion?.utsKn ?? '—' }}</td>
                <td>{{ specifics(item) }}</td>
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
export class GroundWireListComponent {
  private readonly api = inject(GroundWiresApi);

  readonly term = signal('');
  readonly typeFilter = signal<'' | GroundWireType>('');
  readonly items = signal<GroundWireSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.reload();
  }

  search(event: Event): void {
    event.preventDefault();
    this.reload();
  }

  filterByType(value: string): void {
    this.typeFilter.set(value as '' | GroundWireType);
    this.reload();
  }

  typeLabel(type: GroundWireType): string {
    return GROUND_WIRE_TYPE_LABELS[type];
  }

  specifics(item: GroundWireSummary): string {
    return typeSpecificSummary(item);
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.api
      .list(this.term() || undefined, this.typeFilter() || undefined)
      .subscribe({
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
