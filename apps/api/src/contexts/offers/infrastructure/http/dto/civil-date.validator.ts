import { ValidateBy, ValidationOptions } from 'class-validator';
import { isValidCivilDate } from '@lt-offers/domain';

/**
 * Valida data civil AAAA-MM-DD por round-trip de calendário: rejeita datas
 * inexistentes como 2027-02-30 sem rollover silencioso (achado recorrente
 * do projeto com new Date()).
 */
export function IsCivilDate(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isCivilDate',
      validator: {
        validate: (value: unknown): boolean =>
          typeof value === 'string' && isValidCivilDate(value),
      },
    },
    validationOptions,
  );
}
