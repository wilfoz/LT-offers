// Mensagens de validação dos DTOs de catálogo — em pt-BR (RNF-14)

export const decimalMessage = (field: string) =>
  `O campo ${field} deve ser um número decimal positivo em formato texto, com ponto como separador (ex.: "12.34")`;

export const countMessage = (field: string) =>
  `O campo ${field} deve ser um número inteiro positivo`;
