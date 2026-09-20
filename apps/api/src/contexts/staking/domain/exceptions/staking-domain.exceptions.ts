export class StakingTowerNotFoundException extends Error {
  constructor(towerId: number, lineId?: number) {
    super(
      lineId !== undefined
        ? `Torre #${towerId} não encontrada na linha #${lineId}.`
        : `Torre #${towerId} não encontrada.`,
    );
    this.name = 'StakingTowerNotFoundException';
  }
}

export class TransmissionLineNotFoundException extends Error {
  constructor(lineId: number) {
    super(`Linha de transmissão #${lineId} não encontrada.`);
    this.name = 'TransmissionLineNotFoundException';
  }
}

export class DuplicateTowerNumberException extends Error {
  constructor(towerNumber: string) {
    super(
      `Já existe uma torre com o identificador '${towerNumber}' nesta linha.`,
    );
    this.name = 'DuplicateTowerNumberException';
  }
}

export class InvalidStakingDistributionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStakingDistributionException';
  }
}

export class PlsCaddParsingException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlsCaddParsingException';
  }
}

export class InvalidTowerCombinationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTowerCombinationException';
  }
}
