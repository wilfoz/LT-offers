import * as XLSX from 'xlsx';
import { MAX_COLUMNS, XlsxSpreadsheetReader } from './xlsx-spreadsheet.reader';

function workbookBuffer(sheets: Record<string, XLSX.WorkSheet>): Buffer {
  const workbook = XLSX.utils.book_new();
  for (const [name, sheet] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

describe('XlsxSpreadsheetReader', () => {
  const reader = new XlsxSpreadsheetReader();

  it('indexa a partir de A1 mesmo quando a aba começa em B2 (caso do template legado)', () => {
    const sheet = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(
      sheet,
      [
        ['BASES DE DATOS'],
        ['Código de conductor', 'Peso (ton/km)'],
        ['AAAC 63,36 MCM', 0.09203],
      ],
      { origin: 'B2' },
    );
    const read = reader.readSheet(
      workbookBuffer({ DB_CAL: sheet }),
      'modelo.xlsx',
      'DB_CAL',
    );

    expect(read?.rowCount).toBe(4);
    expect(read?.row(0)).toEqual([null, null, null]);
    expect(read?.row(3)).toEqual([null, 'AAAC 63,36 MCM', 0.09203]);
    expect(read?.rowText(3)).toEqual(['', 'AAAC 63,36 MCM', '0.09203']);
  });

  it('texto formatado preserva zeros à esquerda de código numérico', () => {
    const sheet = XLSX.utils.aoa_to_sheet([['Código'], [123]]);
    sheet['A2'].z = '00000';
    const read = reader.readSheet(
      workbookBuffer({ S: sheet }),
      'modelo.xlsx',
      'S',
    );
    expect(read?.row(1)).toEqual([123]);
    expect(read?.rowText(1)).toEqual(['00123']);
  });

  it('lista todas as abas lendo só as primeiras linhas', () => {
    const rows = Array.from({ length: 50 }, (_, i) => [`linha ${i + 1}`]);
    const buffer = workbookBuffer({
      A: XLSX.utils.aoa_to_sheet(rows),
      B: XLSX.utils.aoa_to_sheet([['x']]),
    });
    const sheets = reader.listSheets(buffer, 'modelo.xlsx', 30);
    expect(sheets.map((s) => [s.name, s.rowCount])).toEqual([
      ['A', 30],
      ['B', 1],
    ]);
  });

  it('aba inexistente devolve null', () => {
    const buffer = workbookBuffer({ A: XLSX.utils.aoa_to_sheet([['x']]) });
    expect(reader.readSheet(buffer, 'modelo.xlsx', 'Z')).toBeNull();
  });

  it(`limita a leitura a ${MAX_COLUMNS} colunas quando o intervalo usado é inflado`, () => {
    const sheet = XLSX.utils.aoa_to_sheet([['a']]);
    sheet['!ref'] = 'A1:ZZ1';
    const read = reader.readSheet(
      workbookBuffer({ S: sheet }),
      'modelo.xlsx',
      'S',
    );
    expect(read?.row(0)).toHaveLength(MAX_COLUMNS);
  });

  it('CSV com ponto e vírgula mantém a vírgula decimal como texto e aceita Windows-1252', () => {
    const utf8 = Buffer.from('Código;Peso\nAÇO-1;0,85\n', 'utf-8');
    const read = reader.readSheet(utf8, 'dados.csv', 'Sheet1');
    expect(read?.row(1)).toEqual(['AÇO-1', '0,85']);

    const latin1 = Buffer.from('Código;Peso\nAÇO-1;0,85\n', 'latin1');
    const readLatin = reader.readSheet(latin1, 'dados.CSV', 'Sheet1');
    expect(readLatin?.row(0)).toEqual(['Código', 'Peso']);
  });

  it('arquivo corrompido lança erro (o caso de uso o traduz para o usuário)', () => {
    expect(() =>
      reader.listSheets(Buffer.from('PK\u0003\u0004 lixo'), 'x.xlsx', 30),
    ).toThrow();
  });
});
