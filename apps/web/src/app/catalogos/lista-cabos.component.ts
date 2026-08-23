import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CaboCondutorResumo } from '@lt-offers/dominio';
import { CabosCondutoresApi } from './cabos-condutores-api.service';

@Component({
  selector: 'app-lista-cabos',
  imports: [RouterLink],
  template: `
    <section>
      <h2>Catálogo de cabos condutores</h2>

      <form role="search" (submit)="buscar($event)">
        <label for="busca">Buscar por código ou descrição</label>
        <input
          id="busca"
          name="busca"
          type="search"
          [value]="termo()"
          (input)="termo.set(campoBusca.value)"
          #campoBusca
        />
        <button type="submit">Buscar</button>
        <a routerLink="novo">Novo cabo condutor</a>
      </form>

      @if (carregando()) {
        <p>Carregando…</p>
      } @else if (erro()) {
        <p class="erro" role="alert">{{ erro() }}</p>
      } @else if (itens().length === 0) {
        <p>Nenhum cabo condutor encontrado.</p>
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
              <th scope="col">Pendências</th>
              <th scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (item of itens(); track item.id) {
              <tr>
                <td>{{ item.codigo }}</td>
                <td>{{ item.versaoVigente?.descricao ?? '—' }}</td>
                <td>{{ item.versaoVigente?.pesoTonKm ?? '—' }}</td>
                <td>{{ item.versaoVigente?.bobinaM ?? '—' }}</td>
                <td>{{ item.versaoVigente?.diametroMm ?? '—' }}</td>
                <td>{{ item.versaoVigente?.utsKn ?? '—' }}</td>
                <td>
                  @if (!item.versaoVigente) {
                    <strong class="pendencia">Sem versão vigente</strong>
                  } @else if (item.camposPendentes.length > 0) {
                    <strong class="pendencia">
                      Pendente: {{ item.camposPendentes.join(', ') }}
                    </strong>
                  } @else {
                    <span>Completo</span>
                  }
                </td>
                <td>
                  <a [routerLink]="[item.id, 'editar']">Editar</a>
                  <a [routerLink]="[item.id, 'historico']">Histórico</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>
  `,
  styles: `
    .pendencia {
      color: #b45309;
    }
    .erro {
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
export class ListaCabosComponent {
  private readonly api = inject(CabosCondutoresApi);

  readonly termo = signal('');
  readonly itens = signal<CaboCondutorResumo[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal('');

  constructor() {
    this.recarregar();
  }

  buscar(evento: Event): void {
    evento.preventDefault();
    this.recarregar();
  }

  private recarregar(): void {
    this.carregando.set(true);
    this.erro.set('');
    this.api.listar(this.termo() || undefined).subscribe({
      next: (itens) => {
        this.itens.set(itens);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set(
          'Não foi possível carregar o catálogo; verifique a conexão e tente novamente',
        );
      },
    });
  }
}
