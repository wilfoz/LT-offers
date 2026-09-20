export interface PreliminaryPercentageItemValue {
  itemId: number;
  code: string;
  name: string;
  percentage: number;
}

export class PreliminaryPercentages {
  private readonly _items: PreliminaryPercentageItemValue[];

  constructor(
    items: Array<{
      itemId: number;
      code: string;
      name: string;
      percentage: number | string;
    }>,
  ) {
    this._items = items.map((item) => ({
      itemId: item.itemId,
      code: item.code,
      name: item.name,
      percentage: Number(item.percentage || 0),
    }));
  }

  public get items(): ReadonlyArray<PreliminaryPercentageItemValue> {
    return this._items;
  }

  public calculateSum(): number {
    return this._items.reduce((acc, curr) => acc + curr.percentage, 0);
  }

  public isValid(tolerance = 0.01): boolean {
    const sum = this.calculateSum();
    return Math.abs(sum - 100) <= tolerance;
  }

  public validate(categoryName: string): void {
    const sum = this.calculateSum();
    if (!this.isValid()) {
      throw new Error(
        `A soma dos percentuais de ${categoryName} deve totalizar 100,00%. Soma atual: ${sum.toFixed(2)}%`,
      );
    }
  }
}
