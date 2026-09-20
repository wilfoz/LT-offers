export interface ExportTransmissionLineData {
  id: number;
  name: string;
  refinedLengthKm?: string | number | null;
  reportLengthKm?: string | number | null;
  voltageKv?: number | null;
}

export interface OfferExportData {
  id: number;
  name: string;
  code?: string;
  client?: string;
  createdAt: Date | string;
  revisionNumber: number;
  transmissionLines: ExportTransmissionLineData[];
}

/**
 * Porta para consulta de dados base da oferta necessários para os exportadores contratuais.
 */
export interface ExportDataQueryPort {
  findOfferExportData(offerId: number): Promise<OfferExportData | null>;
}
