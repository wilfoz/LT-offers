/**
 * Utilitários de formulário dos catálogos: campo em branco vira null
 * (não informado) — nunca "0" implícito (RNF-09).
 */
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { decimalScaleViolation } from '@lt-offers/domain';

export function orNull(text: string): string | null {
  return text.trim() === '' ? null : text.trim();
}

export function intOrNull(text: string): number | null {
  return text.trim() === '' ? null : Number(text.trim());
}

/**
 * Espelha a validação de escala da API sobre o predicado único da domain
 * (design D3 da change reavaliacao-base-catalogos). Branco é válido —
 * required é validador próprio. Formato e "não positivo" compartilham o
 * error key `invalidDecimal` (mesma mensagem na UI); escala excedente vira
 * `decimalScale`.
 */
export function decimalScaleValidator(
  maxScale: number,
  options: { nonZero?: boolean } = {},
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (value === '') {
      return null;
    }
    const violation = decimalScaleViolation(value, maxScale, options);
    if (violation === 'scale-exceeded') {
      return { decimalScale: true };
    }
    return violation === null ? null : { invalidDecimal: true };
  };
}
