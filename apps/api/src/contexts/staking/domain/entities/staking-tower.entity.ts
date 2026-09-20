import { AccessDifficulty } from '@lt-offers/domain';
import { Station, DeflectionAngle, CoordinatesUtm } from '../value-objects';

export interface CatalogReference {
  id: number;
  code: string;
  name: string;
}

export interface StakingTowerProps {
  id?: number;
  transmissionLineId: number;
  towerNumber: string;
  station: Station;
  bodyExtensionMeters: number;
  deflectionAngle: DeflectionAngle;
  lateralOffsetMeters: number;
  coordinates: CoordinatesUtm;
  towerTypeId?: number | null;
  soilTypeId?: number | null;
  foundationTypeId?: number | null;
  accessDifficulty?: AccessDifficulty;
  notes?: string | null;
  towerType?: CatalogReference | null;
  soilType?: CatalogReference | null;
  foundationType?: CatalogReference | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class StakingTower {
  public readonly id?: number;
  public readonly transmissionLineId: number;
  private _towerNumber: string;
  private _station: Station;
  private _bodyExtensionMeters: number;
  private _deflectionAngle: DeflectionAngle;
  private _lateralOffsetMeters: number;
  private _coordinates: CoordinatesUtm;
  private _towerTypeId: number | null;
  private _soilTypeId: number | null;
  private _foundationTypeId: number | null;
  private _accessDifficulty: AccessDifficulty;
  private _notes: string | null;
  private _towerType: CatalogReference | null;
  private _soilType: CatalogReference | null;
  private _foundationType: CatalogReference | null;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(props: StakingTowerProps) {
    if (!props.towerNumber || !props.towerNumber.trim()) {
      throw new Error('Identificador da torre não pode ser vazio.');
    }
    this.id = props.id;
    this.transmissionLineId = props.transmissionLineId;
    this._towerNumber = props.towerNumber.trim();
    this._station = props.station;
    this._bodyExtensionMeters = props.bodyExtensionMeters ?? 0;
    this._deflectionAngle = props.deflectionAngle;
    this._lateralOffsetMeters = props.lateralOffsetMeters ?? 0;
    this._coordinates = props.coordinates;
    this._towerTypeId = props.towerTypeId ?? null;
    this._soilTypeId = props.soilTypeId ?? null;
    this._foundationTypeId = props.foundationTypeId ?? null;
    this._accessDifficulty = props.accessDifficulty ?? 'NORMAL';
    this._notes = props.notes ?? null;
    this._towerType = props.towerType ?? null;
    this._soilType = props.soilType ?? null;
    this._foundationType = props.foundationType ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public get towerNumber(): string {
    return this._towerNumber;
  }

  public get station(): Station {
    return this._station;
  }

  public get bodyExtensionMeters(): number {
    return this._bodyExtensionMeters;
  }

  public get deflectionAngle(): DeflectionAngle {
    return this._deflectionAngle;
  }

  public get lateralOffsetMeters(): number {
    return this._lateralOffsetMeters;
  }

  public get coordinates(): CoordinatesUtm {
    return this._coordinates;
  }

  public get towerTypeId(): number | null {
    return this._towerTypeId;
  }

  public get soilTypeId(): number | null {
    return this._soilTypeId;
  }

  public get foundationTypeId(): number | null {
    return this._foundationTypeId;
  }

  public get accessDifficulty(): AccessDifficulty {
    return this._accessDifficulty;
  }

  public get notes(): string | null {
    return this._notes;
  }

  public get towerType(): CatalogReference | null {
    return this._towerType;
  }

  public get soilType(): CatalogReference | null {
    return this._soilType;
  }

  public get foundationType(): CatalogReference | null {
    return this._foundationType;
  }

  public update(props: {
    towerNumber?: string;
    station?: Station;
    bodyExtensionMeters?: number;
    deflectionAngle?: DeflectionAngle;
    lateralOffsetMeters?: number;
    coordinates?: CoordinatesUtm;
    towerTypeId?: number | null;
    soilTypeId?: number | null;
    foundationTypeId?: number | null;
    accessDifficulty?: AccessDifficulty;
    notes?: string | null;
  }): void {
    if (props.towerNumber !== undefined) {
      if (!props.towerNumber.trim()) {
        throw new Error('Identificador da torre não pode ser vazio.');
      }
      this._towerNumber = props.towerNumber.trim();
    }
    if (props.station !== undefined) this._station = props.station;
    if (props.bodyExtensionMeters !== undefined)
      this._bodyExtensionMeters = props.bodyExtensionMeters;
    if (props.deflectionAngle !== undefined)
      this._deflectionAngle = props.deflectionAngle;
    if (props.lateralOffsetMeters !== undefined)
      this._lateralOffsetMeters = props.lateralOffsetMeters;
    if (props.coordinates !== undefined) this._coordinates = props.coordinates;
    if (props.towerTypeId !== undefined) this._towerTypeId = props.towerTypeId;
    if (props.soilTypeId !== undefined) this._soilTypeId = props.soilTypeId;
    if (props.foundationTypeId !== undefined)
      this._foundationTypeId = props.foundationTypeId;
    if (props.accessDifficulty !== undefined)
      this._accessDifficulty = props.accessDifficulty;
    if (props.notes !== undefined) this._notes = props.notes?.trim() || null;
  }

  public isComplete(): boolean {
    return (
      this._towerTypeId !== null &&
      this._soilTypeId !== null &&
      this._foundationTypeId !== null
    );
  }
}
