import { PlsCaddParser } from './pls-cadd-parser.service';
import * as XLSX from 'xlsx';

describe('PlsCaddParser', () => {
  it('should parse CSV content with standard Portuguese and English headers', () => {
    const csvContent = `Torre,Estaca,Extensao Pe,Angulo Deflexao,Offset,UTM_X,UTM_Y,Cota,Tipo Torre
T01,0,0,0,0,500000,7500000,650,SUSP
T02,450.5,3.0,15.2,0,500400,7500200,655,ANG
T03,900,0,0,-2.5,500800,7500400,648,SUSP`;

    const buffer = Buffer.from(csvContent, 'utf-8');
    const parsed = PlsCaddParser.parse(buffer);

    expect(parsed).toHaveLength(3);
    expect(parsed[0].towerNumber).toBe('T01');
    expect(parsed[0].stationMeters).toBe(0);
    expect(parsed[0].elevationMeters).toBe(650);
    expect(parsed[0].towerTypeCode).toBe('SUSP');
    expect(parsed[0].isValid).toBe(true);

    expect(parsed[1].towerNumber).toBe('T02');
    expect(parsed[1].stationMeters).toBe(450.5);
    expect(parsed[1].bodyExtensionMeters).toBe(3);
    expect(parsed[1].deflectionAngleDeg).toBe(15.2);
    expect(parsed[1].isValid).toBe(true);

    expect(parsed[2].lateralOffsetMeters).toBe(-2.5);
    expect(parsed[2].isValid).toBe(true);
  });

  it('should parse XLSX binary buffer correctly', () => {
    const data = [
      {
        Structure: 'T10',
        Station: 1500,
        'Body Extension': 4.5,
        'Line Deflection': 0,
        'Lateral Offset': 0,
        Easting: 501200,
        Northing: 7500600,
        Elevation: 700,
      },
      {
        Structure: 'T11',
        Station: 1950,
        'Body Extension': 0,
        'Line Deflection': 5.5,
        'Lateral Offset': 1.2,
        Easting: 501600,
        Northing: 7500800,
        Elevation: 710,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staking');
    const xlsxBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    const parsed = PlsCaddParser.parse(xlsxBuffer);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].towerNumber).toBe('T10');
    expect(parsed[0].stationMeters).toBe(1500);
    expect(parsed[0].bodyExtensionMeters).toBe(4.5);
    expect(parsed[1].towerNumber).toBe('T11');
    expect(parsed[1].stationMeters).toBe(1950);
  });

  it('should flag duplicate tower numbers in the file', () => {
    const csvContent = `Torre,Estaca
T01,100
T02,500
T01,900`;

    const buffer = Buffer.from(csvContent, 'utf-8');
    const parsed = PlsCaddParser.parse(buffer);

    expect(parsed).toHaveLength(3);
    expect(parsed[0].isValid).toBe(true);
    expect(parsed[1].isValid).toBe(true);
    expect(parsed[2].isValid).toBe(false);
    expect(parsed[2].errors[0]).toContain("duplicado no arquivo: 'T01'");
  });

  it('should generate preview summary with difference calculation against line length', () => {
    const rows = [
      {
        rowNumber: 2,
        towerNumber: 'T01',
        stationMeters: 0,
        bodyExtensionMeters: 0,
        deflectionAngleDeg: 0,
        lateralOffsetMeters: 0,
        isValid: true,
        errors: [],
      },
      {
        rowNumber: 3,
        towerNumber: 'T02',
        stationMeters: 25000,
        bodyExtensionMeters: 0,
        deflectionAngleDeg: 0,
        lateralOffsetMeters: 0,
        isValid: true,
        errors: [],
      },
    ];

    const existingTowers = new Set(['T01', 'T03']);
    const preview = PlsCaddParser.buildPreview(
      'teste.csv',
      rows,
      existingTowers,
      1,
      20.0,
    );

    expect(preview.totalRows).toBe(2);
    expect(preview.validRowsCount).toBe(2);
    expect(preview.existingTowersCount).toBe(1); // T01
    expect(preview.newTowersCount).toBe(1); // T02
    expect(preview.removedTowersCount).toBe(1); // T03
    expect(preview.totalLengthKm).toBe('25.000');
    expect(preview.lineLengthDifferenceKm).toBe('5.000'); // 25.0 - 20.0 = 5.0
  });
});
