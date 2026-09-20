import { ResourceHistogramSummary } from '@lt-offers/domain';

export interface LineHistogram extends ResourceHistogramSummary {
  lineId?: number;
}
