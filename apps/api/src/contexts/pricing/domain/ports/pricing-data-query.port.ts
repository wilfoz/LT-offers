/**
 * Recorte da linha de transmissão consumido pela precificação: extensão e
 * destinos tributários. Valores decimais chegam como string (RNF-08).
 */
export interface PricingLineData {
  id: number;
  name: string;
  refinedLengthKm: string | null;
  reportLengthKm: string | null;
  destinationStatePrimary: string | null;
  destinationPercentagePrimary: string | null;
  destinationStateSecondary: string | null;
  destinationPercentageSecondary: string | null;
}

export interface PricingDataQueryPort {
  findLinePricingData(lineId: number): Promise<PricingLineData | null>;
}
