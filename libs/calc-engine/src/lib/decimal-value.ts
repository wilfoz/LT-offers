import { Decimal } from 'decimal.js';

/**
 * Instância isolada do Decimal: configuração própria do motor, imune a
 * alterações da configuração global feitas por outros módulos (RNF-04).
 */
const EngineDecimal = Decimal.clone({ precision: 34 });

/**
 * Política de arredondamento explícita (RNF-08). Toda operação de
 * arredondamento declara qual política usa — nunca há default implícito.
 */
export type RoundingPolicy =
  | 'half-up' // comercial: 0,5 sobe (padrão fiscal brasileiro)
  | 'half-even'; // bancário: 0,5 vai para o par mais próximo

const MODE_BY_POLICY: Record<RoundingPolicy, Decimal.Rounding> = {
  'half-up': Decimal.ROUND_HALF_UP,
  'half-even': Decimal.ROUND_HALF_EVEN,
};

/**
 * Valor numérico de precisão arbitrária do motor de cálculo.
 *
 * Único ponto de contato com a decimal.js: o restante do sistema nunca
 * importa a biblioteca diretamente, o que permite trocar a implementação
 * sem tocar os consumidores (design D4 da change fundacao-tecnica).
 *
 * Imutável: toda operação retorna um novo DecimalValue.
 */
export class DecimalValue {
  private constructor(
    private readonly value: InstanceType<typeof EngineDecimal>,
  ) {}

  /** Cria a partir de texto ou número. Prefira texto para valores monetários. */
  static of(input: string | number): DecimalValue {
    return new DecimalValue(new EngineDecimal(input));
  }

  static zero(): DecimalValue {
    return DecimalValue.of(0);
  }

  plus(other: DecimalValue): DecimalValue {
    return new DecimalValue(this.value.plus(other.value));
  }

  times(other: DecimalValue): DecimalValue {
    return new DecimalValue(this.value.times(other.value));
  }

  round(places: number, policy: RoundingPolicy): DecimalValue {
    return new DecimalValue(
      this.value.toDecimalPlaces(places, MODE_BY_POLICY[policy]),
    );
  }

  equals(other: DecimalValue): boolean {
    return this.value.equals(other.value);
  }

  toText(): string {
    return this.value.toString();
  }

  /** Conversão com perda potencial de precisão — apenas para exibição. */
  toNumber(): number {
    return this.value.toNumber();
  }
}
