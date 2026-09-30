import { Signal, computed, signal } from '@angular/core';
import {
  CatalogImportDefinition,
  CatalogImportField,
  foldImportText,
  missingRequiredMappings,
  unmappedOptionalFields,
} from '@lt-offers/domain';

/** Associação de um campo do cadastro: coluna do arquivo ou valor fixo. */
export interface FieldMapping {
  column: number | null;
  fixedValue: string | null;
}

/** Opção do seletor de origem: índice da coluna, 'fixed' ou null (sem associação). */
export type MappingSource = number | 'fixed' | null;

/**
 * Estado da etapa de mapeamento (campo → coluna ou valor fixo), dirigido pelo
 * registro da domain: requeridos sem associação bloqueiam, opcionais sem
 * associação geram aviso de "não informado" (RNF-09).
 */
export class ImportMappingState {
  readonly values = signal<Record<string, FieldMapping>>({});
  readonly errors = signal<string[]>([]);

  readonly columns = computed(() => {
    const columns: Record<string, number> = {};
    for (const [key, m] of Object.entries(this.values())) {
      if (m.column !== null) {
        columns[key] = m.column;
      }
    }
    return columns;
  });

  readonly fixedValues = computed(() => {
    const fixed: Record<string, string> = {};
    for (const [key, m] of Object.entries(this.values())) {
      if (m.fixedValue !== null && m.fixedValue.trim() !== '') {
        fixed[key] = m.fixedValue;
      }
    }
    return fixed;
  });

  readonly missingRequired = computed(() => {
    const definition = this.definition();
    return definition
      ? missingRequiredMappings(definition, this.columns(), this.fixedValues())
      : [];
  });

  readonly unmappedOptionalLabels = computed(() => {
    const definition = this.definition();
    return definition
      ? unmappedOptionalFields(definition, this.columns(), this.fixedValues())
          .map((f) => f.label)
          .join(', ')
      : '';
  });

  constructor(
    private readonly definition: Signal<CatalogImportDefinition | null>,
  ) {}

  reset(): void {
    this.values.set({});
    this.errors.set([]);
  }

  /** Sugestão: coluna cujo título é igual ao rótulo do campo, sem acento/caixa. */
  suggest(fields: readonly CatalogImportField[], headers: string[]): void {
    const folded = headers.map((h) => foldImportText(h).replace(/\s+/g, ' '));
    this.values.set(
      Object.fromEntries(
        fields.map((field) => {
          const index = folded.indexOf(foldImportText(field.label));
          return [
            field.key,
            { column: index >= 0 ? index : null, fixedValue: null },
          ];
        }),
      ),
    );
    this.errors.set([]);
  }

  sourceOf(key: string): MappingSource {
    const m = this.values()[key];
    if (!m) {
      return null;
    }
    return m.fixedValue !== null ? 'fixed' : m.column;
  }

  setSource(key: string, source: MappingSource): void {
    const next: FieldMapping =
      source === 'fixed'
        ? { column: null, fixedValue: '' }
        : { column: source, fixedValue: null };
    this.values.update((current) => ({ ...current, [key]: next }));
    this.errors.set([]);
  }

  fixedValueOf(key: string): string {
    return this.values()[key]?.fixedValue ?? '';
  }

  setFixedValue(key: string, value: string): void {
    this.values.update((current) => ({
      ...current,
      [key]: { column: null, fixedValue: value },
    }));
    this.errors.set([]);
  }

  isMissing(field: CatalogImportField): boolean {
    return this.missingRequired().some((f) => f.key === field.key);
  }

  /** Bloqueio com orientação; true = pode avançar. */
  validate(): boolean {
    this.errors.set(
      this.missingRequired().map(
        (field) =>
          `O campo ${field.label} é requerido: associe uma coluna do arquivo ou informe um valor fixo`,
      ),
    );
    return this.errors().length === 0;
  }
}

export function enumOptions(
  field: CatalogImportField,
): { value: string; label: string }[] {
  return (field.enumValues ?? []).map((value) => ({
    value,
    label: field.enumLabels?.[value] ?? value,
  }));
}
