import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HistoricoCaboCondutor } from '@lt-offers/domain';
import { CabosCondutoresApi } from './cabos-condutores-api.service';

@Component({
  selector: 'app-historico-cabo',
  imports: [RouterLink, DatePipe],
  template: `
    <section>
      <h2>Histórico de versões — {{ historico()?.codigo }}</h2>
      <a routerLink="/catalogos/cabos-condutores">Voltar à listagem</a>

      @if (historico(); as h) {
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
            @for (versao of h.versoes; track versao.id) {
              <tr>
                <td>
                  {{ versao.vigenciaInicio | date: 'dd/MM/yyyy' : 'UTC' }}
                </td>
                <td>{{ versao.descricao ?? '—' }}</td>
                <td>{{ versao.pesoTonKm ?? '—' }}</td>
                <td>{{ versao.bobinaM ?? '—' }}</td>
                <td>{{ versao.diametroMm ?? '—' }}</td>
                <td>{{ versao.utsKn ?? '—' }}</td>
                <td>{{ versao.criadoPor }}</td>
                <td>{{ versao.criadoEm | date: 'dd/MM/yyyy HH:mm' }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else if (erro()) {
        <p class="erro" role="alert">{{ erro() }}</p>
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
    .erro {
      color: #b91c1c;
    }
  `,
})
export class HistoricoCaboComponent {
  private readonly api = inject(CabosCondutoresApi);
  private readonly rota = inject(ActivatedRoute);

  readonly historico = signal<HistoricoCaboCondutor | null>(null);
  readonly erro = signal('');

  constructor() {
    const id = Number(this.rota.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.erro.set('Identificador inválido');
      return;
    }
    this.api.historico(id).subscribe({
      next: (h) => this.historico.set(h),
      error: () =>
        this.erro.set('Não foi possível carregar o histórico; tente novamente'),
    });
  }
}
