export interface CoordinatesUtmProps {
  utmEast: number | null;
  utmNorth: number | null;
  elevationMeters: number | null;
}

export class CoordinatesUtm {
  public readonly utmEast: number | null;
  public readonly utmNorth: number | null;
  public readonly elevationMeters: number | null;

  constructor(props: CoordinatesUtmProps) {
    this.utmEast =
      props.utmEast !== null && props.utmEast !== undefined
        ? Number(props.utmEast)
        : null;
    this.utmNorth =
      props.utmNorth !== null && props.utmNorth !== undefined
        ? Number(props.utmNorth)
        : null;
    this.elevationMeters =
      props.elevationMeters !== null && props.elevationMeters !== undefined
        ? Number(props.elevationMeters)
        : null;
  }

  public get eastString(): string | null {
    return this.utmEast !== null ? this.utmEast.toFixed(2) : null;
  }

  public get northString(): string | null {
    return this.utmNorth !== null ? this.utmNorth.toFixed(2) : null;
  }

  public get elevationString(): string | null {
    return this.elevationMeters !== null
      ? this.elevationMeters.toFixed(2)
      : null;
  }
}
