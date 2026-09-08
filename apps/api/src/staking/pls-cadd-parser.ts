import {
  PlsCaddImportParsedRow,
  PlsCaddImportPreview,
} from '@lt-offers/domain';
import * as XLSX from 'xlsx';

interface RawRow {
  [key: string]: unknown;
}

/**
 * Normaliza strings para casamento de cabeçalhos ignorando acentos, espaços, underscores e caixa.
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Mapeamento de possíveis variações de cabeçalhos PLS-CADD para campos internos.
 */
const HEADER_SYNONYMS: Record<string, string[]> = {
  towerNumber: [
    'structure',
    'tower',
    'torre',
    'numero',
    'num',
    'id',
    'est_num',
    'structurename',
    'nomeestrutura',
  ],
  stationMeters: [
    'station',
    'estaca',
    'km',
    'chainage',
    'estacam',
    'estaca_m',
    'stationm',
  ],
  bodyExtensionMeters: [
    'bodyextension',
    'extensaope',
    'ajustealtura',
    'height',
    'extensao',
    'extension',
    'bodyext',
    'pe',
  ],
  deflectionAngleDeg: [
    'linedeflection',
    'deflection',
    'angulo',
    'angulodeflexao',
    'deflexao',
    'angle',
    'defldeg',
  ],
  lateralOffsetMeters: [
    'lateraloffset',
    'offset',
    'offsetlateral',
    'deslocamento',
    'offsetm',
  ],
  utmEast: [
    'easting',
    'utm_x',
    'utmeast',
    'leste',
    'x',
    'coordx',
    'coordenadax',
  ],
  utmNorth: [
    'northing',
    'utm_y',
    'utmnorth',
    'norte',
    'y',
    'coordy',
    'coordenaday',
  ],
  elevationMeters: [
    'elevation',
    'cota',
    'z',
    'terreno',
    'altitude',
    'elev',
    'elevacao',
  ],
  towerTypeCode: [
    'towertype',
    'tipotorre',
    'tipoestrutura',
    'estrutura',
    'familia',
    'tower_type',
  ],
  soilTypeCode: ['soiltype', 'tiposolo', 'solo', 'soil', 'soil_type'],
  foundationTypeCode: [
    'foundationtype',
    'tipofundacao',
    'fundacao',
    'foundation',
    'foundation_type',
  ],
};

function resolveFieldFromHeader(rawHeader: string): string | null {
  const normalized = normalizeHeader(rawHeader);
  for (const [canonicalField, synonyms] of Object.entries(HEADER_SYNONYMS)) {
    if (synonyms.some((syn) => normalizeHeader(syn) === normalized)) {
      return canonicalField;
    }
  }
  return null;
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return isNaN(value) ? null : value;
  }
  if (typeof value === 'string') {
    // Tratar vírgula como separador decimal se necessário
    const cleaned = value.trim().replace(',', '.');
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

export class PlsCaddParser {
  static parse(fileBuffer: Buffer): PlsCaddImportParsedRow[] {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return [];
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<RawRow>(worksheet, {
      defval: '',
      raw: false,
    });

    if (!rawRows || rawRows.length === 0) {
      return [];
    }

    // Mapear cabeçalhos da primeira linha
    const firstRow = rawRows[0];
    const headerMap: Record<string, string> = {}; // rawKey -> canonicalField
    for (const rawKey of Object.keys(firstRow)) {
      const canonical = resolveFieldFromHeader(rawKey);
      if (canonical) {
        headerMap[rawKey] = canonical;
      }
    }

    const parsedRows: PlsCaddImportParsedRow[] = [];
    const seenTowerNumbers = new Set<string>();

    for (let index = 0; index < rawRows.length; index++) {
      const raw = rawRows[index];
      const rowNumber = index + 2; // Linha 1 é cabeçalho na planilha
      const errors: string[] = [];

      const mapped: Record<string, unknown> = {};
      for (const [rawKey, val] of Object.entries(raw)) {
        const canonical = headerMap[rawKey];
        if (canonical) {
          mapped[canonical] = val;
        }
      }

      // 1. Número da torre
      const rawTowerNumber = mapped['towerNumber'];
      const towerNumber =
        rawTowerNumber !== undefined && rawTowerNumber !== null
          ? String(rawTowerNumber).trim()
          : '';

      if (!towerNumber) {
        errors.push('Identificador da torre não informado.');
      } else {
        const upper = towerNumber.toUpperCase();
        if (seenTowerNumbers.has(upper)) {
          errors.push(
            `Número de torre duplicado no arquivo: '${towerNumber}'.`,
          );
        } else {
          seenTowerNumbers.add(upper);
        }
      }

      // 2. Estaca em metros
      const station = parseNumber(mapped['stationMeters']);
      if (station === null) {
        errors.push('Estaca inválida ou não numérica.');
      } else if (station < 0) {
        errors.push('Estaca não pode ser negativa.');
      }

      // 3. Extensão de pé
      const bodyExt = parseNumber(mapped['bodyExtensionMeters']) ?? 0;

      // 4. Ângulo de deflexão
      const defl = parseNumber(mapped['deflectionAngleDeg']) ?? 0;
      if (defl < 0) {
        errors.push('Ângulo de deflexão não pode ser negativo.');
      }

      // 5. Offset lateral
      const offset = parseNumber(mapped['lateralOffsetMeters']) ?? 0;

      // 6. Coordenadas e Cota
      const utmEast = parseNumber(mapped['utmEast']);
      const utmNorth = parseNumber(mapped['utmNorth']);
      const elevation = parseNumber(mapped['elevationMeters']);

      // 7. Códigos opcionais
      const towerTypeCode = mapped['towerTypeCode']
        ? String(mapped['towerTypeCode']).trim()
        : null;
      const soilTypeCode = mapped['soilTypeCode']
        ? String(mapped['soilTypeCode']).trim()
        : null;
      const foundationTypeCode = mapped['foundationTypeCode']
        ? String(mapped['foundationTypeCode']).trim()
        : null;

      parsedRows.push({
        rowNumber,
        towerNumber,
        stationMeters: station ?? 0,
        bodyExtensionMeters: bodyExt,
        deflectionAngleDeg: defl,
        lateralOffsetMeters: offset,
        utmEast,
        utmNorth,
        elevationMeters: elevation,
        towerTypeCode: towerTypeCode || null,
        soilTypeCode: soilTypeCode || null,
        foundationTypeCode: foundationTypeCode || null,
        isValid: errors.length === 0,
        errors,
      });
    }

    return parsedRows;
  }

  /**
   * Constrói o relatório prévio comparativo (Preview) contra a base existente.
   */
  static buildPreview(
    fileName: string,
    parsedRows: PlsCaddImportParsedRow[],
    existingTowerNumbers: Set<string>,
    existingAssignmentsCount: number,
    lineRefinedLengthKm?: number,
  ): PlsCaddImportPreview {
    const totalRows = parsedRows.length;
    const validRowsCount = parsedRows.filter((r) => r.isValid).length;
    const invalidRowsCount = totalRows - validRowsCount;
    const globalErrors: string[] = [];

    if (totalRows === 0) {
      globalErrors.push(
        'Nenhuma linha de estrutura válida encontrada no arquivo.',
      );
    }

    let newTowersCount = 0;
    let existingTowersCount = 0;
    const incomingTowerNumbers = new Set<string>();

    for (const row of parsedRows) {
      if (row.towerNumber) {
        const upper = row.towerNumber.toUpperCase();
        incomingTowerNumbers.add(upper);
        if (existingTowerNumbers.has(upper)) {
          existingTowersCount++;
        } else {
          newTowersCount++;
        }
      }
    }

    let removedTowersCount = 0;
    for (const existingNum of existingTowerNumbers) {
      if (!incomingTowerNumbers.has(existingNum)) {
        removedTowersCount++;
      }
    }

    const preservedAttributesCount =
      existingTowersCount > 0 ? existingAssignmentsCount : 0;

    // Calcular extensão total das estacas (máxima estaca em km)
    let maxStationMeters = 0;
    for (const r of parsedRows) {
      if (r.stationMeters > maxStationMeters) {
        maxStationMeters = r.stationMeters;
      }
    }
    const totalLengthKm = (maxStationMeters / 1000).toFixed(3);

    let lineLengthDifferenceKm: string | null = null;
    if (lineRefinedLengthKm !== undefined && lineRefinedLengthKm > 0) {
      const diff = Math.abs(maxStationMeters / 1000 - lineRefinedLengthKm);
      lineLengthDifferenceKm = diff.toFixed(3);
    }

    return {
      fileName,
      totalRows,
      validRowsCount,
      invalidRowsCount,
      newTowersCount,
      existingTowersCount,
      removedTowersCount,
      preservedAttributesCount,
      rows: parsedRows,
      globalErrors,
      totalLengthKm,
      lineLengthDifferenceKm,
    };
  }
}
