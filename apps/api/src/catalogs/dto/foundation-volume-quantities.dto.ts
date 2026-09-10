import { applyDecorators } from '@nestjs/common';
import { IsOptional, Validate } from 'class-validator';
import { DecimalWithScale } from './decimal-scale.validators';
import { decimalWithScaleMessage } from './validation-messages';

// Todas as quantidades da matriz têm escala 3 = Decimal(12,3) uniforme no
// schema (design D1); zero permitido (o spec só rejeita negativo/não
// numérico), distinto de null = "não informado" (RNF-09). O decorator
// composto evita repetir a pilha 34 vezes.
const Quantity = (label: string) =>
  applyDecorators(
    IsOptional(),
    Validate(DecimalWithScale, [3], {
      message: decimalWithScaleMessage(label, 3),
    }),
  );

/** Campos versionáveis da entrada da matriz de volumes (34 colunas da DB_FUN). */
export class FoundationVolumeQuantitiesDto {
  @Quantity('escavação duro sapata (m³)')
  excavationHardFootingM3?: string | null;

  @Quantity('escavação normal sapata (m³)')
  excavationNormalFootingM3?: string | null;

  @Quantity('escavação com água sapata (m³)')
  excavationWaterFootingM3?: string | null;

  @Quantity('escavação duro preformados (m³)')
  excavationHardPrecastM3?: string | null;

  @Quantity('escavação normal preformados (m³)')
  excavationNormalPrecastM3?: string | null;

  @Quantity('escavação com água preformados (m³)')
  excavationWaterPrecastM3?: string | null;

  @Quantity('escavação duro encepados (m³)')
  excavationHardPileCapM3?: string | null;

  @Quantity('escavação normal encepados (m³)')
  excavationNormalPileCapM3?: string | null;

  @Quantity('escavação com água encepados (m³)')
  excavationWaterPileCapM3?: string | null;

  @Quantity('escavação pila (m³)')
  excavationPierM3?: string | null;

  @Quantity('perfuração de pernos (m)')
  anchorBoltDrillingM?: string | null;

  @Quantity('aço pilas (kg)')
  steelPiersKg?: string | null;

  @Quantity('aço sapatas (kg)')
  steelFootingsKg?: string | null;

  @Quantity('aço encepados (kg)')
  steelPileCapsKg?: string | null;

  @Quantity('aço preformados (kg)')
  steelPrecastKg?: string | null;

  @Quantity('aço rocha (kg)')
  steelRockKg?: string | null;

  @Quantity('aço pernos (kg)')
  steelAnchorBoltsKg?: string | null;

  @Quantity('concreto pilas (m³)')
  concretePiersM3?: string | null;

  @Quantity('concreto sapatas (m³)')
  concreteFootingsM3?: string | null;

  @Quantity('concreto encepados (m³)')
  concretePileCapsM3?: string | null;

  @Quantity('concreto preformado (m³)')
  concretePrecastM3?: string | null;

  @Quantity('concreto rocha (m³)')
  concreteRockM3?: string | null;

  @Quantity('regeneração (m³)')
  regenerationM3?: string | null;

  @Quantity('grout (m³)')
  groutM3?: string | null;

  @Quantity('reaterro solo (m³)')
  backfillSoilM3?: string | null;

  @Quantity('reaterro solo-cimento (m³)')
  backfillSoilCementM3?: string | null;

  @Quantity('formas (m²)')
  formworkM2?: string | null;

  @Quantity('estaca helicoidal (m)')
  helicalPileM?: string | null;

  @Quantity('estaca de aço (m)')
  steelPileM?: string | null;

  @Quantity('tricone (m)')
  triconeM?: string | null;

  @Quantity('estaca raiz (m)')
  rootPileM?: string | null;

  @Quantity('hélice contínua (m)')
  continuousAugerPileM?: string | null;

  @Quantity('micropilote (m)')
  micropileM?: string | null;

  @Quantity('estaca de concreto (m)')
  concretePileM?: string | null;
}
