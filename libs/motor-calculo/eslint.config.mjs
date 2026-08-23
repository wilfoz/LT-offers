import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // Determinismo do motor (RNF-04, design D5): tempo e aleatoriedade
      // nunca são lidos dentro do motor — datas chegam sempre como parâmetro.
      'no-restricted-properties': [
        'error',
        {
          object: 'Date',
          property: 'now',
          message:
            'Motor determinístico (RNF-04): receba a data como parâmetro.',
        },
        {
          object: 'Math',
          property: 'random',
          message:
            'Motor determinístico (RNF-04): aleatoriedade é proibida no motor.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message:
            'Motor determinístico (RNF-04): new Date() sem argumentos lê o relógio — receba a data como parâmetro.',
        },
      ],
    },
  },
];
