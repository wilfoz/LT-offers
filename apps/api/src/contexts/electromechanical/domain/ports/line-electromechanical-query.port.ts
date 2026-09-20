export interface LineElectromechanicalQueryData {
  id: number;
  name: string;
  refinedLengthKm: string | null;
  reportLengthKm: string | null;
  nominalVoltageKv: string | null;
  stakingTowers?: {
    id: number;
    towerNumber: string;
    stationMeters: string;
    towerTypeId: number;
    towerCode?: string;
  }[];
}

/**
 * Porta de consulta dos dados da linha de transmissão para quantitativos eletromecânicos.
 */
export interface LineElectromechanicalQueryPort {
  findLineElectromechanicalData(
    lineId: number,
  ): Promise<LineElectromechanicalQueryData | null>;
}
