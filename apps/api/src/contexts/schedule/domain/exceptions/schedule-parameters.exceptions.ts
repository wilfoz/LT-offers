/**
 * Exceções de domínio dos catálogos de configuração do cronograma
 * (parâmetros de chuva e calendário de trabalho). Mensagens em pt-BR (RNF-14).
 */

export class NoEffectiveScheduleParametersException extends Error {
  constructor(kind: 'chuva' | 'calendário', referenceDate: string) {
    super(
      kind === 'chuva'
        ? `Não há versão de parâmetros de chuva vigente em ${referenceDate}.`
        : `Não há versão de calendário de trabalho vigente em ${referenceDate}.`,
    );
    this.name = 'NoEffectiveScheduleParametersException';
  }
}

export class DuplicateScheduleParametersDateException extends Error {
  constructor(kind: 'chuva' | 'calendário', effectiveFrom: string) {
    super(
      kind === 'chuva'
        ? `Já existe uma versão de parâmetros de chuva com vigência em ${effectiveFrom}.`
        : `Já existe uma versão de calendário de trabalho com vigência em ${effectiveFrom}.`,
    );
    this.name = 'DuplicateScheduleParametersDateException';
  }
}

export class InvalidScheduleParametersException extends Error {
  constructor(public readonly messages: string[]) {
    super(messages.join(' '));
    this.name = 'InvalidScheduleParametersException';
  }
}
