// Mensagens de validação dos DTOs de catálogo — em pt-BR (RNF-14)

export const decimalMessage = (field: string) =>
  `O campo ${field} deve ser um número decimal positivo em formato texto, com ponto como separador (ex.: "12.34")`;

export const countMessage = (field: string) =>
  `O campo ${field} deve ser um número inteiro positivo`;

// Contagens em que zero é valor válido (ex.: estais de torre autoportante,
// RNF-09: zero informado é diferente de não informado)
export const nonNegativeCountMessage = (field: string) =>
  `O campo ${field} deve ser um número inteiro maior ou igual a zero`;

// Decimais com escala limitada à precisão da coluna do banco (evita que dois
// valores distintos no DTO colidam após o arredondamento do Postgres)
export const decimalWithScaleMessage = (field: string, scale: number) =>
  `O campo ${field} deve ser um número decimal positivo com até ${scale} casas decimais, em formato texto com ponto como separador (ex.: "12.34")`;
