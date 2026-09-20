import { ScopeResponsibleParty } from '@lt-offers/domain';

export interface ScopeMatrixItemProps {
  id?: number;
  revisionId?: number;
  itemCode: string;
  itemName: string;
  category: string;
  responsibleParty: ScopeResponsibleParty;
  acceptsDirectBilling: boolean;
  currencyRiskParty: ScopeResponsibleParty;
  commodityRiskParty: ScopeResponsibleParty;
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ScopeMatrixItem {
  private constructor(private readonly _props: ScopeMatrixItemProps) {}

  static create(
    props: Omit<ScopeMatrixItemProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): ScopeMatrixItem {
    return new ScopeMatrixItem({
      ...props,
      notes: props.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(props: ScopeMatrixItemProps): ScopeMatrixItem {
    return new ScopeMatrixItem(props);
  }

  get id(): number | undefined {
    return this._props.id;
  }

  get revisionId(): number | undefined {
    return this._props.revisionId;
  }

  get itemCode(): string {
    return this._props.itemCode;
  }

  get itemName(): string {
    return this._props.itemName;
  }

  get category(): string {
    return this._props.category;
  }

  get responsibleParty(): ScopeResponsibleParty {
    return this._props.responsibleParty;
  }

  get acceptsDirectBilling(): boolean {
    return this._props.acceptsDirectBilling;
  }

  get currencyRiskParty(): ScopeResponsibleParty {
    return this._props.currencyRiskParty;
  }

  get commodityRiskParty(): ScopeResponsibleParty {
    return this._props.commodityRiskParty;
  }

  get notes(): string | null | undefined {
    return this._props.notes;
  }

  isClientResponsibility(): boolean {
    return this._props.responsibleParty === 'CLIENT';
  }

  toRawProps(): ScopeMatrixItemProps {
    return { ...this._props };
  }
}
