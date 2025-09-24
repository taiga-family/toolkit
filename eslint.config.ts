import taiga, {
    TUI_RECOMMENDED_NAMING_CONVENTION as recommended,
} from '@taiga-ui/eslint-plugin-experience-next';
import {globalIgnores} from 'eslint/config';

export default process.env.HTML_ESLINT
    ? [
          // Eslint doesn't support multiple parsers for different rules
          ...taiga.configs['html-eslint'],
          globalIgnores(['**/*.{ts,js,css,less,scss}']),
      ]
    : [
          ...taiga.configs.recommended,
          ...taiga.configs['taiga-specific'],
          {
              ignores: [
                  // TypeScript will ignore files with duplicate filenames in the same folder
                  // (for example, src/file.ts and src/file.js). TypeScript purposely ignore
                  // all but one of the files, only keeping the one file
                  // with the highest priority extension
                  '**/jest-preset.js',
                  '**/polyfill.js',
                  '**/jest.config.js',
                  '**/eslint.config.js',
                  '.release-it.js',
                  '**/*.spec.js',
              ],
          },
          {
              files: ['**/*.js', '**/*.ts'],
              rules: {
                  '@typescript-eslint/naming-convention': ['error', ...recommended],
                  'perfectionist/sort-objects': [
                      'error',
                      {
                          customGroups: {
                              id: 'id',
                              overrides: 'overrides',
                              env: 'env',
                              files: 'files',
                              parser: 'parser',
                              plugins: 'plugins',
                              extends: 'extends',
                              $schema: '$schema',
                              rules: 'rules',
                          },
                          groups: [
                              '$schema',
                              'id',
                              'env',
                              'files',
                              'parser',
                              'plugins',
                              'extends',
                              'unknown',
                              'rules',
                              'overrides',
                          ],
                          order: 'asc',
                          partitionByComment: true,
                          type: 'natural',
                      },
                  ],
              },
          },
      ];
