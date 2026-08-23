import { BadRequestException } from '@nestjs/common';
import { PADRAO_DATA } from './dto/campos-versao.dto';

export const FUSO_DO_NEGOCIO = 'America/Sao_Paulo';

/**
 * Converte texto AAAA-MM-DD em data civil (meia-noite UTC), rejeitando datas
 * de calendário inválidas: new Date('2026-02-30') sofreria rollover
 * silencioso para 2026-03-02, corrompendo a vigência imutável (RNF-05).
 */
export function paraDataCivil(texto: string): Date {
  const data = new Date(`${texto}T00:00:00.000Z`);
  const valida =
    PADRAO_DATA.test(texto) &&
    !Number.isNaN(data.getTime()) &&
    data.toISOString().slice(0, 10) === texto;
  if (!valida) {
    throw new BadRequestException(
      `Data inválida: "${texto}"; informe uma data real no formato AAAA-MM-DD`,
    );
  }
  return data;
}

/**
 * Data civil de hoje no fuso do negócio. new Date() puro é um instante UTC:
 * entre 21h e 24h em BRT ele já pertence ao dia seguinte em UTC, e a
 * vigência seria gravada com a data errada.
 */
export function hojeDataCivil(agora: Date = new Date()): Date {
  const texto = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_DO_NEGOCIO,
  }).format(agora);
  return new Date(`${texto}T00:00:00.000Z`);
}
