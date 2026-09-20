import {
  FOUNDATION_MATERIAL_FAMILIES,
  FOUNDATION_QUANTITY_METADATA_MAP,
  FOUNDATION_MATERIAL_FAMILY_LABELS,
} from './foundation-quantities';
import {
  FOUNDATION_VOLUME_QUANTITY_FIELDS,
  FoundationVolumeQuantityField,
} from '../catalogs/foundation-volumes';

describe('Foundation Quantities Domain Contracts', () => {
  it('should define all 5 material families with valid labels', () => {
    expect(FOUNDATION_MATERIAL_FAMILIES).toHaveLength(5);
    FOUNDATION_MATERIAL_FAMILIES.forEach((family) => {
      expect(FOUNDATION_MATERIAL_FAMILY_LABELS[family]).toBeDefined();
      expect(FOUNDATION_MATERIAL_FAMILY_LABELS[family].length).toBeGreaterThan(
        0,
      );
    });
  });

  it('should have complete metadata for every field in FOUNDATION_VOLUME_QUANTITY_FIELDS', () => {
    FOUNDATION_VOLUME_QUANTITY_FIELDS.forEach(
      (field: FoundationVolumeQuantityField) => {
        const meta = FOUNDATION_QUANTITY_METADATA_MAP[field];
        expect(meta).toBeDefined();
        expect(meta.field).toBe(field);
        expect(meta.name).toBeTruthy();
        expect(meta.code).toBeTruthy();
        expect(meta.unit).toMatch(/m³|kg|m|m²/);
        expect(FOUNDATION_MATERIAL_FAMILIES).toContain(meta.family);
        expect(meta.defaultWastePercent).toBeGreaterThanOrEqual(0);
      },
    );
  });

  it('should configure correct default waste factors per RN-12', () => {
    // RN-12: Duro 10%, Normal 5%, Água 20%, Tubulão 5%
    expect(
      FOUNDATION_QUANTITY_METADATA_MAP.excavationHardFootingM3
        .defaultWastePercent,
    ).toBe(10);
    expect(
      FOUNDATION_QUANTITY_METADATA_MAP.excavationNormalFootingM3
        .defaultWastePercent,
    ).toBe(5);
    expect(
      FOUNDATION_QUANTITY_METADATA_MAP.excavationWaterFootingM3
        .defaultWastePercent,
    ).toBe(20);
    expect(
      FOUNDATION_QUANTITY_METADATA_MAP.excavationPierM3.defaultWastePercent,
    ).toBe(5);

    // RN-12: Concreto 5%
    expect(
      FOUNDATION_QUANTITY_METADATA_MAP.concreteFootingsM3.defaultWastePercent,
    ).toBe(5);
    expect(
      FOUNDATION_QUANTITY_METADATA_MAP.concretePiersM3.defaultWastePercent,
    ).toBe(5);

    // RN-12: Aço de reforço 10%, Aço de tubulão 3%
    expect(
      FOUNDATION_QUANTITY_METADATA_MAP.steelFootingsKg.defaultWastePercent,
    ).toBe(10);
    expect(
      FOUNDATION_QUANTITY_METADATA_MAP.steelPiersKg.defaultWastePercent,
    ).toBe(3);
  });
});
