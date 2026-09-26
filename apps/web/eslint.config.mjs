import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // The app's own alias (`@app/model`) sorts after the framework packages,
      // the same way a scaffolded workspace orders its `@<prefix>/**` imports.
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          groups: ['external', 'builtin', 'internal'],
          pathGroups: [
            {
              pattern: '@smartsoft001/**',
              group: 'external',
              position: 'after',
            },
            {
              pattern: '@app/**',
              group: 'internal',
            },
          ],
          pathGroupsExcludedImportTypes: [],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
    },
  },
];
