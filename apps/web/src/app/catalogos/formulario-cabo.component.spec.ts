import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CabosCondutoresApi } from './cabos-condutores-api.service';
import { FormularioCaboComponent } from './formulario-cabo.component';

describe('FormularioCaboComponent (novo cabo)', () => {
  const apiMock = {
    criar: vi.fn().mockReturnValue(of({})),
    criarVersao: vi.fn(),
    historico: vi.fn(),
  };

  async function montar() {
    await TestBed.configureTestingModule({
      imports: [FormularioCaboComponent],
      providers: [
        // catch-all: o salvar() navega para a listagem após sucesso
        provideRouter([{ path: '**', children: [] }]),
        { provide: CabosCondutoresApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FormularioCaboComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.criar.mockReturnValue(of({}));
  });

  it('exige código e mostra mensagem em português', async () => {
    const fixture = await montar();
    fixture.componentInstance.salvar();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Campo obrigatório');
    expect(apiMock.criar).not.toHaveBeenCalled();
  });

  it('rejeita valor numérico inválido apontando o formato esperado', async () => {
    const fixture = await montar();
    fixture.componentInstance.formulario.patchValue({
      codigo: 'CAA-636',
      pesoTonKm: 'abc',
    });
    fixture.componentInstance.salvar();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('número decimal positivo');
    expect(apiMock.criar).not.toHaveBeenCalled();
  });

  it('envia campo em branco como null (não informado), nunca como zero', async () => {
    const fixture = await montar();
    fixture.componentInstance.formulario.patchValue({
      codigo: 'CAA-636',
      pesoTonKm: '1.3026',
      utsKn: '',
    });
    fixture.componentInstance.salvar();

    expect(apiMock.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        codigo: 'CAA-636',
        pesoTonKm: '1.3026',
        utsKn: null,
      }),
    );
  });
});

describe('FormularioCaboComponent (nova versão)', () => {
  const apiMock = {
    criar: vi.fn(),
    criarVersao: vi.fn().mockReturnValue(of({})),
    historico: vi.fn(),
  };

  async function montarEdicao() {
    await TestBed.configureTestingModule({
      imports: [FormularioCaboComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: CabosCondutoresApi, useValue: apiMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(FormularioCaboComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.criarVersao.mockReturnValue(of({}));
  });

  it('bloqueia o salvar enquanto o prefill não conclui (evita versão toda nula)', async () => {
    apiMock.historico.mockReturnValue(NEVER);

    const fixture = await montarEdicao();
    fixture.componentInstance.salvar();

    expect(apiMock.criarVersao).not.toHaveBeenCalled();
  });

  it('bloqueia o salvar e exibe erro quando o prefill falha', async () => {
    apiMock.historico.mockReturnValue(throwError(() => new Error('rede')));

    const fixture = await montarEdicao();
    fixture.detectChanges();
    fixture.componentInstance.salvar();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Não foi possível carregar os dados atuais');
    expect(apiMock.criarVersao).not.toHaveBeenCalled();
  });
});
