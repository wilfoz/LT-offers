import {
  BadRequestException,
  ConflictException,
  HttpException,
  MethodNotAllowedException,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import {
  CivilDate,
  CatalogItemNotFoundException,
  CatalogVersionNotFoundException,
  NoEffectiveVersionFoundException,
  DuplicateCatalogCodeException,
  DuplicateVersionDateException,
  InvalidCivilDateException,
  InvalidCatalogDataException,
  InvalidEffectiveDateRangeException,
  VersionImmutableException,
} from '../../domain';

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
export function resolveReferenceDate(effectiveOn?: string): CivilDate {
  return effectiveOn ? CivilDate.fromString(effectiveOn) : CivilDate.today();
}

/** Versões são imutáveis (RNF-05): PUT/PATCH de versão respondem 405. */
export function versionImmutableException(): MethodNotAllowedException {
  return new MethodNotAllowedException(
    'Versões são imutáveis; para alterar valores, crie uma nova versão com data de vigência',
  );
}

/** Mapeamento de exceções de domínio para respostas HTTP padrão. */
export function handleCatalogDomainError(error: any): never {
  if (error instanceof HttpException) {
    throw error;
  }

  if (
    error instanceof CatalogItemNotFoundException ||
    error instanceof CatalogVersionNotFoundException ||
    error instanceof NoEffectiveVersionFoundException
  ) {
    throw new NotFoundException(error.message);
  }

  if (
    error instanceof DuplicateCatalogCodeException ||
    error instanceof DuplicateVersionDateException
  ) {
    throw new ConflictException(error.message);
  }

  if (
    error instanceof InvalidCivilDateException ||
    error instanceof InvalidCatalogDataException ||
    error instanceof InvalidEffectiveDateRangeException
  ) {
    throw new BadRequestException(error.message);
  }

  if (error instanceof VersionImmutableException) {
    throw new MethodNotAllowedException(error.message);
  }

  throw new BadRequestException(error?.message || 'Erro ao processar catálogo');
}
