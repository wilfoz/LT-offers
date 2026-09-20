export interface PlsCaddImportResultProps {
  importedCount: number;
  updatedCount: number;
  preservedCount: number;
}

export class PlsCaddImportResult {
  public readonly importedCount: number;
  public readonly updatedCount: number;
  public readonly preservedCount: number;

  constructor(props: PlsCaddImportResultProps) {
    this.importedCount = props.importedCount;
    this.updatedCount = props.updatedCount;
    this.preservedCount = props.preservedCount;
  }
}
