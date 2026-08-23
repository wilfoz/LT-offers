import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DadosVersaoCaboCondutor } from '@lt-offers/domain';
import { CabosCondutoresApi } from './cabos-condutores-api.service';

const PADRAO_DECIMAL = /^\d+(\.\d+)?$/;
const PADRAO_DATA = /^\d{4}-\d{2}-\d{2}$/;

@Component({
  selector: 'app-formulario-cabo',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section>
      <h2>
        {{ idEdicao() ? 'Nova versão do cabo condutor' : 'Novo cabo condutor' }}
      </h2>
      <p>
        Campos numéricos usam ponto como separador decimal. Campo em branco
        significa "não informado" — diferente de zero.
      </p>

      <form [formGroup]="formulario" (ngSubmit)="salvar()">
        @if (!idEdicao()) {
          <div>
            <label for="codigo">Código *</label>
            <input id="codigo" formControlName="codigo" maxlength="50" />
            @if (erroDe('codigo')) {
              <p class="erro" role="alert">{{ erroDe('codigo') }}</p>
            }
          </div>
        } @else {
          <p>
            Código: <strong>{{ codigoAtual() }}</strong>
          </p>
        }

        <div>
          <label for="descricao">Descrição</label>
          <input id="descricao" formControlName="descricao" maxlength="200" />
        </div>

        <div>
          <label for="pesoTonKm">Peso (ton/km)</label>
          <input
            id="pesoTonKm"
            formControlName="pesoTonKm"
            inputmode="decimal"
          />
          @if (erroDe('pesoTonKm')) {
            <p class="erro" role="alert">{{ erroDe('pesoTonKm') }}</p>
          }
        </div>

        <div>
          <label for="bobinaM">Bobina (m)</label>
          <input id="bobinaM" formControlName="bobinaM" inputmode="decimal" />
          @if (erroDe('bobinaM')) {
            <p class="erro" role="alert">{{ erroDe('bobinaM') }}</p>
          }
        </div>

        <div>
          <label for="diametroMm">Diâmetro (mm)</label>
          <input
            id="diametroMm"
            formControlName="diametroMm"
            inputmode="decimal"
          />
          @if (erroDe('diametroMm')) {
            <p class="erro" role="alert">{{ erroDe('diametroMm') }}</p>
          }
        </div>

        <div>
          <label for="utsKn">UTS — carga de ruptura (kN)</label>
          <input id="utsKn" formControlName="utsKn" inputmode="decimal" />
          @if (erroDe('utsKn')) {
            <p class="erro" role="alert">{{ erroDe('utsKn') }}</p>
          }
        </div>

        <div>
          <label for="vigenciaInicio">
            Início de vigência
            {{ idEdicao() ? '*' : '(opcional; padrão hoje)' }}
          </label>
          <input
            id="vigenciaInicio"
            formControlName="vigenciaInicio"
            type="date"
          />
          @if (erroDe('vigenciaInicio')) {
            <p class="erro" role="alert">{{ erroDe('vigenciaInicio') }}</p>
          }
        </div>

        @if (erroServidor()) {
          <p class="erro" role="alert">{{ erroServidor() }}</p>
        }

        <button type="submit" [disabled]="salvando()">Salvar</button>
        <a routerLink="/catalogos/cabos-condutores">Cancelar</a>
      </form>
    </section>
  `,
  styles: `
    form {
      display: grid;
      gap: 0.75rem;
      max-width: 28rem;
    }
    label {
      display: block;
      font-weight: 600;
    }
    input {
      width: 100%;
      padding: 0.35rem;
    }
    .erro {
      color: #b91c1c;
      margin: 0.15rem 0 0;
    }
  `,
})
export class FormularioCaboComponent {
  private readonly api = inject(CabosCondutoresApi);
  private readonly rota = inject(ActivatedRoute);
  private readonly roteador = inject(Router);

  readonly idEdicao = signal<number | null>(null);
  readonly codigoAtual = signal('');
  readonly erroServidor = signal('');
  readonly salvando = signal(false);

  readonly formulario = new FormGroup({
    codigo: new FormControl('', { nonNullable: true }),
    descricao: new FormControl('', { nonNullable: true }),
    pesoTonKm: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(PADRAO_DECIMAL)],
    }),
    bobinaM: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(PADRAO_DECIMAL)],
    }),
    diametroMm: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(PADRAO_DECIMAL)],
    }),
    utsKn: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(PADRAO_DECIMAL)],
    }),
    vigenciaInicio: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(PADRAO_DATA)],
    }),
  });

  constructor() {
    const idParam = this.rota.snapshot.paramMap.get('id');
    const id = idParam === null ? null : Number(idParam);
    if (id !== null && Number.isInteger(id) && id > 0) {
      this.prepararEdicao(id);
    } else {
      this.formulario.controls.codigo.addValidators(Validators.required);
    }
  }

  erroDe(campo: keyof typeof this.formulario.controls): string {
    const controle = this.formulario.controls[campo];
    if (!controle.touched || controle.valid) {
      return '';
    }
    if (controle.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (campo === 'vigenciaInicio') {
      return 'Informe uma data no formato AAAA-MM-DD';
    }
    return 'Informe um número decimal positivo com ponto (ex.: 12.34)';
  }

  salvar(): void {
    // Formulário desabilitado = prefill da edição pendente ou falho; salvar
    // aqui gravaria uma versão toda nula por cima dos valores vigentes.
    if (this.formulario.disabled) {
      return;
    }
    this.formulario.markAllAsTouched();
    if (this.formulario.invalid) {
      return;
    }
    this.salvando.set(true);
    this.erroServidor.set('');

    const id = this.idEdicao();
    const dados = this.paraDados();
    const operacao = id
      ? this.api.criarVersao(id, {
          ...dados,
          vigenciaInicio: this.formulario.getRawValue().vigenciaInicio.trim(),
        })
      : this.api.criar({
          ...dados,
          codigo: this.formulario.controls.codigo.value.trim(),
        });

    operacao.subscribe({
      next: () => this.roteador.navigate(['/catalogos/cabos-condutores']),
      error: (erro) => {
        this.salvando.set(false);
        const mensagem = erro?.error?.message;
        this.erroServidor.set(
          Array.isArray(mensagem)
            ? mensagem.join('; ')
            : (mensagem ?? 'Não foi possível salvar; tente novamente'),
        );
      },
    });
  }

  private prepararEdicao(id: number): void {
    this.idEdicao.set(id);
    this.formulario.controls.vigenciaInicio.addValidators(Validators.required);
    this.formulario.disable();
    this.api.historico(id).subscribe({
      next: (historico) => {
        this.codigoAtual.set(historico.codigo);
        const maisRecente = historico.versoes[0];
        if (maisRecente) {
          this.formulario.patchValue({
            descricao: maisRecente.descricao ?? '',
            pesoTonKm: maisRecente.pesoTonKm ?? '',
            bobinaM: maisRecente.bobinaM ?? '',
            diametroMm: maisRecente.diametroMm ?? '',
            utsKn: maisRecente.utsKn ?? '',
          });
        }
        this.formulario.enable();
      },
      error: () =>
        this.erroServidor.set(
          'Não foi possível carregar os dados atuais do cabo; recarregue a página antes de criar uma nova versão',
        ),
    });
  }

  /** Campo em branco vira null (não informado) — nunca "0" implícito (RNF-09). */
  private paraDados(): DadosVersaoCaboCondutor {
    const valor = this.formulario.getRawValue();
    const ouNulo = (texto: string) =>
      texto.trim() === '' ? null : texto.trim();
    return {
      descricao: ouNulo(valor.descricao),
      pesoTonKm: ouNulo(valor.pesoTonKm),
      bobinaM: ouNulo(valor.bobinaM),
      diametroMm: ouNulo(valor.diametroMm),
      utsKn: ouNulo(valor.utsKn),
      ...(valor.vigenciaInicio.trim() !== ''
        ? { vigenciaInicio: valor.vigenciaInicio.trim() }
        : {}),
    };
  }
}
