import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'escopo:dominio',
              onlyDependOnLibsWithTags: ['escopo:dominio'],
            },
            {
              sourceTag: 'escopo:motor',
              onlyDependOnLibsWithTags: ['escopo:motor', 'escopo:dominio'],
              bannedExternalImports: [
                '@nestjs/*',
                '@angular/*',
                '@prisma/*',
                'prisma',
                'express',
                'fs',
                'http',
                'https',
                'child_process',
                'node:*',
              ],
            },
            {
              sourceTag: 'escopo:app',
              onlyDependOnLibsWithTags: [
                'escopo:app',
                'escopo:motor',
                'escopo:dominio',
              ],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
