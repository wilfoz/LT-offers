import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  CaboCondutorResumo,
  DadosNovaVersaoCaboCondutor,
  DadosNovoCaboCondutor,
  HistoricoCaboCondutor,
} from '@lt-offers/domain';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CabosCondutoresApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/catalogos/cabos-condutores';

  listar(busca?: string): Observable<CaboCondutorResumo[]> {
    const params = busca ? new HttpParams().set('busca', busca) : undefined;
    return this.http.get<CaboCondutorResumo[]>(this.base, { params });
  }

  historico(id: number): Observable<HistoricoCaboCondutor> {
    return this.http.get<HistoricoCaboCondutor>(`${this.base}/${id}/historico`);
  }

  criar(dados: DadosNovoCaboCondutor): Observable<unknown> {
    return this.http.post(this.base, dados);
  }

  criarVersao(
    id: number,
    dados: DadosNovaVersaoCaboCondutor,
  ): Observable<unknown> {
    return this.http.post(`${this.base}/${id}/versoes`, dados);
  }
}
