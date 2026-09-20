export interface TransmissionLineInfo {
  id: number;
  refinedLengthKm: number | string;
}

export interface StakingCatalogQueryPort {
  ensureTransmissionLineExists(lineId: number): Promise<TransmissionLineInfo>;
  findCatalogCodes(): Promise<{
    towerTypeMap: Map<string, number>;
    soilTypeMap: Map<string, number>;
    foundationTypeMap: Map<string, number>;
  }>;
  findValidFoundationVolumeCombinations(): Promise<Set<string>>;
}
