/**
 * Utilitários de formulário dos catálogos: campo em branco vira null
 * (não informado) — nunca "0" implícito (RNF-09).
 */

export function orNull(text: string): string | null {
  return text.trim() === '' ? null : text.trim();
}

export function intOrNull(text: string): number | null {
  return text.trim() === '' ? null : Number(text.trim());
}
