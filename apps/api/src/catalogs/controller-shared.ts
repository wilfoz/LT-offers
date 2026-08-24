import {
  BadRequestException,
  MethodNotAllowedException,
  ParseIntPipe,
} from '@nestjs/common';
import { todayCivilDate, toCivilDate } from './civil-date';

export const DEFAULT_USER = 'sistema';

/** ParseIntPipe com mensagem pt-BR (RNF-14) para os ids de rota. */
export function createIdPipe(): ParseIntPipe {
  return new ParseIntPipe({
    exceptionFactory: () =>
      new BadRequestException('O identificador deve ser um número inteiro'),
  });
}

/** Autor provisório: header X-User com fallback "sistema" (dívida D6 do piloto). */
export function resolveAuthor(user?: string): string {
  return user?.trim() || DEFAULT_USER;
}

/** Data de referência resolvida na borda: default = hoje civil (design D2 do piloto). */
export function resolveReferenceDate(effectiveOn?: string): Date {
  return effectiveOn ? toCivilDate(effectiveOn) : todayCivilDate();
}

/** Versões são imutáveis (RNF-05): PUT/PATCH de versão respondem 405. */
export function versionImmutableException(): MethodNotAllowedException {
  return new MethodNotAllowedException(
    'Versões são imutáveis; para alterar valores, crie uma nova versão com data de vigência',
  );
}
