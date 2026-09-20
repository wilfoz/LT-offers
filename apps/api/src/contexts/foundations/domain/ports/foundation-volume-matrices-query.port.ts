import { FoundationMatrixLookupItem } from '@lt-offers/domain';

export interface FoundationVolumeMatricesQueryPort {
  loadEffectiveVolumeMatrices(): Promise<FoundationMatrixLookupItem[]>;
}
