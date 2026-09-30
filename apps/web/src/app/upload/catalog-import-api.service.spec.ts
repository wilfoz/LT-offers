import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CatalogImportApi } from './catalog-import-api.service';

describe('CatalogImportApi', () => {
  let api: CatalogImportApi;
  let http: HttpTestingController;
  const file = new File(['conteudo'], 'Calculo LT.xlsm');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CatalogImportApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('inspect envia o arquivo em multipart no campo "file"', () => {
    api.inspect(file).subscribe();
    const req = http.expectOne('/api/catalogs/import/inspect');
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect((body.get('file') as File).name).toBe('Calculo LT.xlsm');
    req.flush({ fileName: 'Calculo LT.xlsm', sheets: [] });
  });

  it('preview reenvia o arquivo e as opções em JSON no campo "options"', () => {
    const options = {
      catalogKey: 'conductor-cables' as const,
      sheetName: 'DB_CAL',
      headerRow: 5,
      columns: { code: 1 },
      fixedValues: {},
      effectiveFrom: '2026-01-01',
    };
    api.preview(file, options).subscribe();
    const req = http.expectOne('/api/catalogs/import/preview');
    const body = req.request.body as FormData;
    expect(body.get('file')).toBeInstanceOf(File);
    expect(JSON.parse(body.get('options') as string)).toEqual(options);
    req.flush({});
  });

  it('commit envia os itens em JSON e o autor no header X-User', () => {
    const request = {
      catalogKey: 'conductor-cables' as const,
      effectiveFrom: '2026-01-01',
      items: [{ code: 'C1' }],
    };
    api.commit(request, 'admin@orcamento-lt.com.br').subscribe();
    const req = http.expectOne('/api/catalogs/import/commit');
    expect(req.request.body).toEqual(request);
    expect(req.request.headers.get('X-User')).toBe('admin@orcamento-lt.com.br');
    req.flush({});
  });
});
