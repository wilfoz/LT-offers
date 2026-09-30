import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import {
  CatalogImportCommitResult,
  CatalogImportInspectResult,
  CatalogImportPreviewResult,
} from '@lt-offers/domain';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../auth/auth.service';
import { AnalyticImportComponent } from './analytic-import.component';
import { columnLetter } from './analytic-import.helpers';
import { CatalogImportApi } from './catalog-import-api.service';

// Aba no formato do DB_OPGW do template legado: título, linha vazia e o
// cabeçalho na linha 5
const INSPECTION: CatalogImportInspectResult = {
  fileName: 'Calculo LT.xlsm',
  sheets: [
    { name: 'Info', rows: [['Proposta']] },
    {
      name: 'DB_OPGW',
      rows: [
        [],
        ['BASES DE DATOS'],
        ['CABLES DE GUARDA OPGW'],
        [],
        [
          'id',
          'Código del cable',
          'Fabricante',
          'I2t (kA2s)',
          'Fibras',
          'Peso (ton/km)',
          'Bobina (m)',
          'Diámetro (mm)',
          'UTS (tons)',
        ],
        ['1', 'DG1 16 kA2s', 'FURUKAWA', '16', '12-48', '0.593'],
      ],
    },
  ],
};

const PREVIEW: CatalogImportPreviewResult = {
  catalogKey: 'ground-wires',
  sheetName: 'DB_OPGW',
  headerRow: 5,
  headers: [],
  firstDataRow: 6,
  lastDataRow: 9,
  rows: [
    {
      rowNumber: 6,
      code: 'DS1 49 kA2s',
      status: 'TO_IMPORT',
      reasons: [],
      payload: { code: 'DS1 49 kA2s', type: 'OPGW', manufacturer: 'FURUKAWA' },
    },
    {
      rowNumber: 7,
      code: 'DG1 16 kA2s',
      status: 'SKIPPED_EXISTING',
      reasons: [],
      payload: null,
    },
    {
      rowNumber: 8,
      code: 'dg1 16 KA2S',
      status: 'DUPLICATE_IN_FILE',
      reasons: [],
      payload: null,
    },
    {
      rowNumber: 9,
      code: 'X',
      status: 'INVALID',
      reasons: [
        'O campo Número de fibras deve ser um número inteiro (valor lido: "12-48")',
      ],
      payload: null,
    },
  ],
  counts: {
    TO_IMPORT: 1,
    SKIPPED_EXISTING: 1,
    DUPLICATE_IN_FILE: 1,
    INVALID: 1,
  },
};

const COMMIT: CatalogImportCommitResult = {
  catalogKey: 'ground-wires',
  imported: 1,
  skippedExisting: 0,
  invalid: 0,
  rows: [{ code: 'DS1 49 kA2s', status: 'IMPORTED', reason: null }],
};

const FILE = new File(['conteudo'], 'Calculo LT.xlsm');

describe('AnalyticImportComponent (Importação Analítica)', () => {
  const apiMock = {
    inspect: vi.fn(),
    preview: vi.fn(),
    commit: vi.fn(),
  };
  const snackBarMock = { open: vi.fn() };

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [AnalyticImportComponent],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: CatalogImportApi, useValue: apiMock },
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AnalyticImportComponent);
    fixture.detectChanges();
    return fixture;
  }

  const textOf = (fixture: { nativeElement: HTMLElement }) =>
    (fixture.nativeElement.textContent ?? '').replace(/\s+/g, ' ');

  /** Avança até a etapa de mapeamento dos cabos de guarda (linha 5). */
  async function mountAtMapping() {
    const fixture = await mount();
    const component = fixture.componentInstance;
    component.pickFile(FILE);
    component.selectCatalog('ground-wires');
    component.step.set(2);
    component.selectSheet('DB_OPGW');
    component.selectHeaderRow(5);
    component.goToMapping();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    apiMock.inspect.mockReturnValue(of(INSPECTION));
    apiMock.preview.mockReturnValue(of(PREVIEW));
    apiMock.commit.mockReturnValue(of(COMMIT));
  });

  it('abre na etapa do arquivo, com as seis etapas e os formatos aceitos', async () => {
    const fixture = await mount();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h2')?.textContent).toContain(
      'Importação Analítica',
    );
    expect(
      Array.from(el.querySelectorAll('.steps .step-label')).map((s) =>
        s.textContent?.trim(),
      ),
    ).toEqual([
      'Arquivo',
      'Catálogo',
      'Aba e cabeçalho',
      'Mapeamento e vigência',
      'Prévia',
      'Relatório',
    ]);
    expect(
      el.querySelector('.steps li[aria-current="step"]')?.textContent,
    ).toContain('Arquivo');
    expect(textOf(fixture)).toContain('.xlsx, .xlsm, .xls ou .csv');
    expect(textOf(fixture)).not.toContain('OCR');
  });

  it('rejeita formato não suportado sem chamar a API', async () => {
    const fixture = await mount();
    fixture.componentInstance.pickFile(new File(['%PDF'], 'projeto.pdf'));
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')
        ?.textContent,
    ).toContain(
      'Formato de arquivo não suportado; envie uma planilha .xlsx, .xlsm, .xls ou .csv',
    );
    expect(apiMock.inspect).not.toHaveBeenCalled();
  });

  it('rejeita arquivo acima de 40 MB sem enviá-lo', async () => {
    const fixture = await mount();
    const big = new File(['x'], 'grande.xlsx');
    Object.defineProperty(big, 'size', { value: 41 * 1024 * 1024 });
    fixture.componentInstance.pickFile(big);
    fixture.detectChanges();

    expect(textOf(fixture)).toContain(
      'O arquivo excede o limite de 40 MB para importação',
    );
    expect(apiMock.inspect).not.toHaveBeenCalled();
  });

  it('arquivo lido: mostra as abas e pede o catálogo, sem destinos hierárquicos', async () => {
    const fixture = await mount();
    fixture.componentInstance.pickFile(FILE);
    fixture.detectChanges();

    expect(apiMock.inspect).toHaveBeenCalledWith(FILE);
    expect(fixture.componentInstance.step()).toBe(1);
    expect(textOf(fixture)).toContain('Calculo LT.xlsm · 2 aba(s)');
    expect(
      fixture.componentInstance.catalogOptions.map((o) => o.label),
    ).toEqual([
      'Cabos condutores',
      'Cabos de guarda',
      'Cabos de tirante',
      'Isoladores',
      'Tipos de solo',
      'Mão de obra',
      'Equipamentos',
      'Custos fixos',
    ]);
  });

  it('aba e cabeçalho: amostra com letras das colunas e linha de cabeçalho destacada', async () => {
    const fixture = await mount();
    const component = fixture.componentInstance;
    component.pickFile(FILE);
    component.selectCatalog('ground-wires');
    component.step.set(2);
    component.selectSheet('DB_OPGW');
    component.selectHeaderRow(5);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const letters = Array.from(
      el.querySelectorAll('table.sample thead th'),
    ).map((th) => th.textContent?.trim());
    expect(letters.slice(0, 4)).toEqual(['Linha', 'A', 'B', 'C']);
    expect(el.querySelector('tr.header-row')?.textContent).toContain(
      'Código del cable',
    );
    expect(component.columnOptions()[1].label).toBe('B · Código del cable');
  });

  it('mapeamento: lista os campos do registro com requeridos marcados e sugere colunas pelo título', async () => {
    const fixture = await mountAtMapping();
    const component = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;

    const labels = Array.from(el.querySelectorAll('.mapping-label')).map(
      (l) => [
        l.querySelector('span')?.textContent?.trim(),
        l.querySelector('.badge')?.textContent?.trim() ?? null,
      ],
    );
    expect(labels.slice(0, 3)).toEqual([
      ['Código', 'Requerido'],
      ['Tipo', 'Requerido'],
      ['Descrição', null],
    ]);
    // "Diámetro (mm)" casa com "Diâmetro (mm)" ignorando acento
    expect(component.mapping.columns()).toEqual({
      manufacturer: 2,
      weightTonPerKm: 5,
      reelLengthM: 6,
      diameterMm: 7,
    });
  });

  it('requerido sem coluna nem valor fixo bloqueia a prévia com orientação', async () => {
    const fixture = await mountAtMapping();
    fixture.componentInstance.effectiveFrom.setValue('2026-01-01');
    fixture.componentInstance.requestPreview();
    fixture.detectChanges();

    const alert = (fixture.nativeElement as HTMLElement).querySelector(
      'ul[role="alert"]',
    );
    expect(alert?.textContent).toContain(
      'O campo Código é requerido: associe uma coluna do arquivo ou informe um valor fixo',
    );
    expect(alert?.textContent).toContain('O campo Tipo é requerido');
    expect(apiMock.preview).not.toHaveBeenCalled();
  });

  it('opcional sem associação gera aviso de que ficará sem dados', async () => {
    const fixture = await mountAtMapping();
    const warning = (fixture.nativeElement as HTMLElement).querySelector(
      '.warning',
    );
    expect(warning?.textContent).toContain(
      'ficarão sem dados (não informado, nunca zero)',
    );
    expect(warning?.textContent).toContain('Descrição');
    expect(warning?.textContent).not.toContain('Fabricante');
  });

  it('vigência com data inexistente é recusada antes de chamar a API', async () => {
    const fixture = await mountAtMapping();
    const component = fixture.componentInstance;
    component.mapping.setSource('code', 1);
    component.mapping.setSource('type', 'fixed');
    component.mapping.setFixedValue('type', 'OPGW');
    component.effectiveFrom.setValue('2027-02-30');
    component.requestPreview();
    fixture.detectChanges();

    expect(textOf(fixture)).toContain(
      'Informe uma data real no formato AAAA-MM-DD',
    );
    expect(apiMock.preview).not.toHaveBeenCalled();
  });

  it('fluxo completo: valor fixo OPGW → prévia classificada → importação → relatório', async () => {
    const fixture = await mountAtMapping();
    const component = fixture.componentInstance;
    component.mapping.setSource('code', 1);
    component.mapping.setSource('type', 'fixed');
    component.mapping.setFixedValue('type', 'OPGW');
    component.effectiveFrom.setValue('2026-01-01');
    component.requestPreview();
    fixture.detectChanges();

    expect(apiMock.preview).toHaveBeenCalledWith(FILE, {
      catalogKey: 'ground-wires',
      sheetName: 'DB_OPGW',
      headerRow: 5,
      columns: {
        code: 1,
        manufacturer: 2,
        weightTonPerKm: 5,
        reelLengthM: 6,
        diameterMm: 7,
      },
      fixedValues: { type: 'OPGW' },
      effectiveFrom: '2026-01-01',
    });

    // Prévia reflete a resposta da API, com motivo das inválidas
    const text = textOf(fixture);
    expect(text).toContain('Linhas lidas: 6 a 9');
    expect(text).toContain('A importar');
    expect(text).toContain('Ignorada (já cadastrada)');
    expect(text).toContain('Duplicada no arquivo');
    expect(text).toContain(
      'O campo Número de fibras deve ser um número inteiro (valor lido: "12-48")',
    );
    expect(text).toContain('Importar 1 item(ns)');

    component.confirmImport();
    fixture.detectChanges();

    expect(apiMock.commit).toHaveBeenCalledWith(
      {
        catalogKey: 'ground-wires',
        effectiveFrom: '2026-01-01',
        items: [
          { code: 'DS1 49 kA2s', type: 'OPGW', manufacturer: 'FURUKAWA' },
        ],
      },
      TestBed.inject(AuthService).activeUserEmail(),
    );
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.summary')?.textContent?.trim()).toBe(
      '1 importado, 1 ignorado (já cadastrado), 1 inválido, 1 duplicado no arquivo',
    );
    expect(
      el.querySelector('a[href="/catalogs/ground-wires"]')?.textContent,
    ).toContain('Ver Cabos de guarda');
  });

  it('relatório soma o que o commit ignorou ou recusou às contagens da prévia', async () => {
    apiMock.commit.mockReturnValue(
      of({
        ...COMMIT,
        imported: 0,
        skippedExisting: 1,
        rows: [
          { code: 'DS1 49 kA2s', status: 'SKIPPED_EXISTING', reason: null },
        ],
      }),
    );
    const fixture = await mountAtMapping();
    const component = fixture.componentInstance;
    component.mapping.setSource('code', 1);
    component.mapping.setSource('type', 'fixed');
    component.mapping.setFixedValue('type', 'OPGW');
    component.effectiveFrom.setValue('2026-01-01');
    component.requestPreview();
    component.confirmImport();
    fixture.detectChanges();

    const text = textOf(fixture);
    expect(text).toContain(
      '0 importados, 2 ignorados (já cadastrados), 1 inválido',
    );
    expect(text).toContain('DS1 49 kA2s: Ignorado (já cadastrado)');
  });

  it('erro do servidor na leitura do arquivo: mensagem persistente e aviso', async () => {
    apiMock.inspect.mockReturnValue(
      throwError(() => ({
        error: {
          message:
            'Não foi possível ler o arquivo; confira se é uma planilha válida e não protegida por senha',
        },
      })),
    );
    const fixture = await mount();
    fixture.componentInstance.pickFile(FILE);
    fixture.detectChanges();

    const message =
      'Não foi possível ler o arquivo; confira se é uma planilha válida e não protegida por senha';
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')
        ?.textContent,
    ).toContain(message);
    expect(snackBarMock.open).toHaveBeenCalledWith(message, 'Fechar', {
      duration: 6000,
    });
    expect(fixture.componentInstance.step()).toBe(0);
    expect(fixture.componentInstance.busy()).toBe(false);
  });

  it('erro do servidor na prévia junta as mensagens do DTO e mantém o mapeamento', async () => {
    apiMock.preview.mockReturnValue(
      throwError(() => ({
        error: {
          message: [
            'Catálogo de destino inválido para importação',
            'Informe a aba da planilha',
          ],
        },
      })),
    );
    const fixture = await mountAtMapping();
    const component = fixture.componentInstance;
    component.mapping.setSource('code', 1);
    component.mapping.setSource('type', 'fixed');
    component.mapping.setFixedValue('type', 'OPGW');
    component.effectiveFrom.setValue('2026-01-01');
    component.requestPreview();
    fixture.detectChanges();

    expect(component.serverError()).toBe(
      'Catálogo de destino inválido para importação; Informe a aba da planilha',
    );
    expect(component.step()).toBe(3);
  });

  it('erro do servidor na importação: fica na prévia, com mensagem e botão liberado', async () => {
    apiMock.commit.mockReturnValue(throwError(() => ({ status: 0 })));
    const fixture = await mountAtMapping();
    const component = fixture.componentInstance;
    component.mapping.setSource('code', 1);
    component.mapping.setSource('type', 'fixed');
    component.mapping.setFixedValue('type', 'OPGW');
    component.effectiveFrom.setValue('2026-01-01');
    component.requestPreview();
    component.confirmImport();
    fixture.detectChanges();

    expect(component.step()).toBe(4);
    expect(component.serverError()).toBe(
      'Não foi possível concluir a importação; nenhum relatório foi gerado',
    );
    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => b.textContent?.includes('Importar'));
    expect(button?.disabled).toBe(false);
  });

  it('enquanto importa, o botão fica desabilitado e um segundo clique não reenvia', async () => {
    const pending = new Subject<CatalogImportCommitResult>();
    apiMock.commit.mockReturnValue(pending);
    const fixture = await mountAtMapping();
    const component = fixture.componentInstance;
    component.mapping.setSource('code', 1);
    component.mapping.setSource('type', 'fixed');
    component.mapping.setFixedValue('type', 'OPGW');
    component.effectiveFrom.setValue('2026-01-01');
    component.requestPreview();
    component.confirmImport();
    component.confirmImport();
    fixture.detectChanges();

    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => b.textContent?.includes('Importar'));
    expect(button?.disabled).toBe(true);
    expect(apiMock.commit).toHaveBeenCalledTimes(1);
    expect(textOf(fixture)).toContain('Importando os itens…');
  });

  it('prévia sem nenhuma linha a importar não permite confirmar', async () => {
    apiMock.preview.mockReturnValue(
      of({
        ...PREVIEW,
        rows: PREVIEW.rows.filter((r) => r.status !== 'TO_IMPORT'),
        counts: { ...PREVIEW.counts, TO_IMPORT: 0 },
      }),
    );
    const fixture = await mountAtMapping();
    const component = fixture.componentInstance;
    component.mapping.setSource('code', 1);
    component.mapping.setSource('type', 'fixed');
    component.mapping.setFixedValue('type', 'OPGW');
    component.effectiveFrom.setValue('2026-01-01');
    component.requestPreview();
    component.confirmImport();
    fixture.detectChanges();

    expect(apiMock.commit).not.toHaveBeenCalled();
    const button = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((b) => b.textContent?.includes('Importar'));
    expect(button?.disabled).toBe(true);
  });

  it('o seletor nativo aceita as quatro extensões (atributo accept em lista)', async () => {
    const fixture = await mount();
    const input = (fixture.nativeElement as HTMLElement).querySelector(
      'input[type="file"]',
    );
    expect(input?.getAttribute('accept')).toBe('.xlsx,.xlsm,.xls,.csv');
    expect(input?.getAttribute('tabindex')).toBe('-1');
  });

  it('arquivo escolhido no seletor é enviado e o input é limpo para nova escolha', async () => {
    const fixture = await mount();
    const input = { files: [FILE], value: 'Calculo LT.xlsm' };
    fixture.componentInstance.onFileSelected({
      target: input,
    } as unknown as Event);
    expect(apiMock.inspect).toHaveBeenCalledWith(FILE);
    expect(input.value).toBe('');
  });

  it('valor fixo usa o controle do tipo do campo: lista para enum, sim/não para booleano, texto nos demais', async () => {
    const fixture = await mountAtMapping();
    const component = fixture.componentInstance;
    component.mapping.setSource('type', 'fixed');
    component.mapping.setSource('description', 'fixed');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('mat-select#fixed-type')).not.toBeNull();
    expect(el.querySelector('input#fixed-description')).not.toBeNull();

    component.selectCatalog('soil-types');
    component.goToMapping();
    component.mapping.setSource('submerged', 'fixed');
    fixture.detectChanges();
    expect(el.querySelector('mat-select#fixed-submerged')).not.toBeNull();
  });

  it('voltar retorna uma etapa e mantém o que foi escolhido', async () => {
    const fixture = await mountAtMapping();
    const component = fixture.componentInstance;
    component.back();
    fixture.detectChanges();
    expect(component.step()).toBe(2);
    expect(component.headerRow()).toBe(5);
    expect(textOf(fixture)).toContain('Etapa 3 de 6: Aba e cabeçalho');
  });

  it('importação concluída avisa com snackbar', async () => {
    const fixture = await mountAtMapping();
    const component = fixture.componentInstance;
    component.mapping.setSource('code', 1);
    component.mapping.setSource('type', 'fixed');
    component.mapping.setFixedValue('type', 'OPGW');
    component.effectiveFrom.setValue('2026-01-01');
    component.requestPreview();
    component.confirmImport();
    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Importação concluída',
      'Fechar',
      { duration: 4000 },
    );
  });

  it('nova importação volta à etapa do arquivo com tudo limpo', async () => {
    const fixture = await mountAtMapping();
    const component = fixture.componentInstance;
    component.restart();
    fixture.detectChanges();

    expect(component.step()).toBe(0);
    expect(component.file()).toBeNull();
    expect(component.catalogKey()).toBeNull();
    expect(component.mapping.values()).toEqual({});
    expect(textOf(fixture)).toContain('Arraste a planilha aqui');
  });
});

describe('columnLetter', () => {
  it('converte índice em letra de coluna da planilha', () => {
    expect([0, 1, 25, 26, 27, 51, 52, 701, 702].map(columnLetter)).toEqual([
      'A',
      'B',
      'Z',
      'AA',
      'AB',
      'AZ',
      'BA',
      'ZZ',
      'AAA',
    ]);
  });
});
