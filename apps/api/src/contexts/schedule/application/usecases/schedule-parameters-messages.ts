import {
  RainfallParametersViolation,
  WorkCalendarViolation,
} from '@lt-offers/domain';

// Tradução das violações tipadas da domain para mensagens em pt-BR (RNF-14):
// a domain devolve códigos; as mensagens são responsabilidade da borda.

export function rainfallViolationMessage(
  violation: RainfallParametersViolation,
): string {
  switch (violation.code) {
    case 'no-bands':
      return 'Informe ao menos uma faixa de severidade de chuva.';
    case 'band-position-duplicated':
      return `A posição ${violation.position} está duplicada entre as faixas de severidade.`;
    case 'band-factor-invalid':
      return `O fator de produtividade da faixa ${violation.position} deve ser um número decimal em formato texto (ex.: "0.85").`;
    case 'band-factor-out-of-range':
      return `O fator de produtividade da faixa ${violation.position} deve estar entre 0 e 1.`;
    case 'band-limit-invalid':
      return `O limite superior (mm) da faixa ${violation.position} deve ser um número decimal em formato texto.`;
    case 'band-limits-not-increasing':
      return `O limite superior da faixa ${violation.position} deve ser maior que o da faixa anterior.`;
    case 'band-open-not-last':
      return `Apenas a última faixa pode ser aberta (sem limite superior); a faixa ${violation.position} tem limite nulo.`;
    case 'last-band-not-open':
      return 'A última faixa de severidade deve ser aberta (sem limite superior).';
    case 'uf-missing':
      return `A matriz de precipitação está incompleta: falta a série da UF ${violation.uf}.`;
    case 'uf-unknown':
      return `A UF '${violation.uf}' não é uma UF brasileira válida.`;
    case 'uf-duplicated':
      return `A UF ${violation.uf} aparece mais de uma vez na matriz de precipitação.`;
    case 'uf-series-length-invalid':
      return `A série da UF ${violation.uf} deve ter exatamente 12 meses.`;
    case 'precipitation-invalid':
      return `A precipitação da UF ${violation.uf} no mês ${violation.month} deve ser um número decimal não negativo em formato texto.`;
  }
}

export function workCalendarViolationMessage(
  violation: WorkCalendarViolation,
): string {
  switch (violation.code) {
    case 'standard-days-invalid':
      return 'Os dias úteis padrão por mês devem ser um número decimal em formato texto (ex.: "22.00").';
    case 'standard-days-not-positive':
      return 'Os dias úteis padrão por mês devem ser maiores que zero.';
    case 'weekday-out-of-range':
      return `Dia da semana inválido (${violation.weekday}): use 0 (domingo) a 6 (sábado).`;
    case 'weekday-duplicated':
      return `O dia da semana ${violation.weekday} está duplicado entre os dias não laborais.`;
    case 'all-weekdays-non-working':
      return 'Os 7 dias da semana não podem ser todos não laborais.';
    case 'holiday-date-invalid':
      return `O feriado na posição ${violation.index + 1} tem data de calendário inválida; use AAAA-MM-DD com uma data existente.`;
    case 'holiday-name-empty':
      return `O feriado na posição ${violation.index + 1} está sem nome.`;
    case 'holiday-uf-unknown':
      return `O feriado na posição ${violation.index + 1} tem UF inválida.`;
  }
}
