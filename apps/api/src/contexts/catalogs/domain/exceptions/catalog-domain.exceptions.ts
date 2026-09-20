/**
 * Exceções de domínio do Bounded Context de Catálogos de Engenharia.
 */
export class CatalogDomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class CatalogItemNotFoundException extends CatalogDomainException {
  constructor(catalogName: string, identifier: string | number) {
    super(
      `${catalogName} com identificador '${identifier}' não encontrado(a).`,
    );
  }
}

export class CatalogVersionNotFoundException extends CatalogDomainException {
  constructor(catalogName: string, versionId: number) {
    super(`Versão '${versionId}' de ${catalogName} não encontrada.`);
  }
}

export class NoEffectiveVersionFoundException extends CatalogDomainException {
  constructor(catalogName = 'Item do catálogo') {
    super('Não há versão vigente para a data de referência informada');
  }
}

export class DuplicateCatalogCodeException extends CatalogDomainException {
  constructor(code: string) {
    super(`O código "${code}" já está em uso no catálogo`);
  }
}

export class DuplicateVersionDateException extends CatalogDomainException {
  constructor() {
    super(
      'Já existe uma versão com esta data de início de vigência; escolha outra data',
    );
  }
}

export class InvalidCivilDateException extends CatalogDomainException {
  constructor(text: string) {
    super(
      `Data inválida: "${text}"; informe uma data real no formato AAAA-MM-DD`,
    );
  }
}

export class InvalidEffectiveDateRangeException extends CatalogDomainException {
  constructor(from: string, to: string) {
    super(
      `Intervalo de vigência inválido: a data final (${to}) não pode ser anterior à data inicial (${from}).`,
    );
  }
}

export class VersionImmutableException extends CatalogDomainException {
  constructor() {
    super(
      'Versões são imutáveis; para alterar valores, crie uma nova versão com data de vigência',
    );
  }
}

export class InvalidCatalogDataException extends CatalogDomainException {
  constructor(message: string) {
    super(message);
  }
}
