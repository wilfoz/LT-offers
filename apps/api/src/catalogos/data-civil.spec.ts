import { BadRequestException } from '@nestjs/common';
import { hojeDataCivil, paraDataCivil } from './data-civil';

describe('paraDataCivil', () => {
  it('converte data válida para meia-noite UTC', () => {
    expect(paraDataCivil('2026-02-28').toISOString()).toBe(
      '2026-02-28T00:00:00.000Z',
    );
  });

  it('rejeita data de calendário inexistente sem rollover silencioso', () => {
    expect(() => paraDataCivil('2026-02-30')).toThrow(BadRequestException);
  });

  it('rejeita mês e dia fora de faixa', () => {
    expect(() => paraDataCivil('2026-13-45')).toThrow(BadRequestException);
  });

  it('rejeita formato fora do padrão', () => {
    expect(() => paraDataCivil('23/08/2026')).toThrow(BadRequestException);
  });
});

describe('hojeDataCivil', () => {
  it('retorna o dia civil de São Paulo mesmo quando o UTC já virou', () => {
    // 23:30 em BRT (UTC-3) = 02:30 UTC do dia seguinte
    const instante = new Date('2026-08-24T02:30:00.000Z');
    expect(hojeDataCivil(instante).toISOString()).toBe(
      '2026-08-23T00:00:00.000Z',
    );
  });

  it('retorna o mesmo dia quando UTC e BRT coincidem', () => {
    const instante = new Date('2026-08-23T15:00:00.000Z');
    expect(hojeDataCivil(instante).toISOString()).toBe(
      '2026-08-23T00:00:00.000Z',
    );
  });
});
