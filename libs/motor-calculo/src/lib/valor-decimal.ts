import { Decimal } from 'decimal.js';

/**
 * Instância isolada do Decimal: configuração própria do motor, imune a
 * alterações da configuração global feitas por outros módulos (RNF-04).
 */
const DecimalMotor = Decimal.clone({ precision: 34 });

/**
 * Política de arredondamento explícita (RNF-08). Toda operação de
 * arredondamento declara qual política usa — nunca há default implícito.
 */
export type PoliticaArredondamento =
  | 'meio-para-cima' // comercial: 0,5 sobe (padrão fiscal brasileiro)
  | 'meio-para-par'; // bancário: 0,5 vai para o par mais próximo

const MODO_POR_POLITICA: Record<PoliticaArredondamento, Decimal.Rounding> = {
  'meio-para-cima': Decimal.ROUND_HALF_UP,
  'meio-para-par': Decimal.ROUND_HALF_EVEN,
};

/**
 * Valor numérico de precisão arbitrária do motor de cálculo.
 *
 * Único ponto de contato com a decimal.js: o restante do sistema nunca
 * importa a biblioteca diretamente, o que permite trocar a implementação
 * sem tocar os consumidores (design D4).
 *
 * Imutável: toda operação retorna um novo ValorDecimal.
 */
export class ValorDecimal {
  private constructor(private readonly valor: InstanceType<typeof DecimalMotor>) {}

  /** Cria a partir de texto ou número. Prefira texto para valores monetários. */
  static de(entrada: string | number): ValorDecimal {
    return new ValorDecimal(new DecimalMotor(entrada));
  }

  static zero(): ValorDecimal {
    return ValorDecimal.de(0);
  }

  somar(outro: ValorDecimal): ValorDecimal {
    return new ValorDecimal(this.valor.plus(outro.valor));
  }

  multiplicar(outro: ValorDecimal): ValorDecimal {
    return new ValorDecimal(this.valor.times(outro.valor));
  }

  arredondar(casas: number, politica: PoliticaArredondamento): ValorDecimal {
    return new ValorDecimal(
      this.valor.toDecimalPlaces(casas, MODO_POR_POLITICA[politica]),
    );
  }

  igualA(outro: ValorDecimal): boolean {
    return this.valor.equals(outro.valor);
  }

  paraTexto(): string {
    return this.valor.toString();
  }

  /** Conversão com perda potencial de precisão — apenas para exibição. */
  paraNumero(): number {
    return this.valor.toNumber();
  }
}
