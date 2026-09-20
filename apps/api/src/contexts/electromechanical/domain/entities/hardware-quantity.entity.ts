import {
  InsulatorQuantityItem,
  GuyWireQuantityItem,
  DamperQuantityItem,
  GroundingQuantityItem,
  WarningMarkerQuantityItem,
} from '@lt-offers/domain';

export type HardwareQuantity =
  | InsulatorQuantityItem
  | GuyWireQuantityItem
  | DamperQuantityItem
  | GroundingQuantityItem
  | WarningMarkerQuantityItem;

export type {
  InsulatorQuantityItem,
  GuyWireQuantityItem,
  DamperQuantityItem,
  GroundingQuantityItem,
  WarningMarkerQuantityItem,
};
