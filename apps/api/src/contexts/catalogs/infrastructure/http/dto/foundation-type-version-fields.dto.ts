import { applyDecorators } from '@nestjs/common';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { nonNegativeCountMessage } from './validation-messages';

// O decorator composto evita repetir a pilha 17 vezes (mesmo critério do
// Quantity da matriz de volumes).
const Count = (label: string) =>
  applyDecorators(
    IsOptional(),
    IsInt({ message: nonNegativeCountMessage(label) }),
    Min(0, { message: nonNegativeCountMessage(label) }),
  );

/**
 * Campos versionáveis do tipo de fundação. A composição são contagens
 * inteiras ≥ 0 por elemento (17 colunas da DB_FUN); zero informado é valor,
 * distinto de null = "não informado" (RNF-09). Não há validação de
 * aplicabilidade contagem × aplicação — a planilha não tem essa regra
 * (non-goal do design).
 */
export class FoundationTypeVersionFieldsDto {
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto' })
  @MaxLength(200, { message: 'A descrição deve ter no máximo 200 caracteres' })
  description?: string | null;

  @Count('fuste sapata')
  spreadFootingCount?: number | null;

  @Count('preformado mastro')
  precastMastCount?: number | null;

  @Count('preformado tirante')
  precastGuyCount?: number | null;

  @Count('pila reta')
  straightPierCount?: number | null;

  @Count('pila campana')
  belledPierCount?: number | null;

  @Count('pila com laje')
  slabPierCount?: number | null;

  @Count('pila reta tirante')
  straightPierGuyCount?: number | null;

  @Count('pila campana tirante')
  belledPierGuyCount?: number | null;

  @Count('ancoragem em rocha')
  rockAnchorCount?: number | null;

  @Count('estaca de concreto')
  concretePileCount?: number | null;

  @Count('estaca metálica')
  steelPileCount?: number | null;

  @Count('helicoidal mastro')
  helicalMastCount?: number | null;

  @Count('helicoidal tirante')
  helicalGuyCount?: number | null;

  @Count('tricone')
  triconeCount?: number | null;

  @Count('estaca raiz')
  rootPileCount?: number | null;

  @Count('micropilote')
  micropileCount?: number | null;

  @Count('hélice contínua')
  continuousAugerPileCount?: number | null;
}
