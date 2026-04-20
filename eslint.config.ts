import taiga, {
    TUI_RECOMMENDED_NAMING_CONVENTION as recommended,
} from '@taiga-ui/eslint-plugin-experience-next';
import {globalIgnores} from 'eslint/config';

export default process.env.HTML_ESLINT
    ? [
          ...taiga.configs.recommended,
          ...taiga.configs['taiga-specific'],
          {
              files: ['**/*.html'],
              rules: {
                  '@taiga-ui/experience-next/attrs-newline': 'error',
                  '@taiga-ui/experience-next/element-newline': 'error',
                  '@taiga-ui/experience-next/no-duplicate-attrs': 'error',
                  '@taiga-ui/experience-next/no-duplicate-id': 'error',
                  '@taiga-ui/experience-next/no-duplicate-in-head': 'error',
                  '@taiga-ui/experience-next/no-obsolete-attrs': 'error',
                  '@taiga-ui/experience-next/no-obsolete-tags': 'error',
                  '@taiga-ui/experience-next/quotes': 'error',
                  '@taiga-ui/experience-next/require-doctype': 'error',
                  '@taiga-ui/experience-next/require-img-alt': 'error',
                  '@taiga-ui/experience-next/require-lang': 'error',
                  '@taiga-ui/experience-next/require-li-container': 'error',
                  '@taiga-ui/experience-next/require-title': 'error',
              },
          },
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
                          customGroups: [
                              {
                                  elementNamePattern: String.raw`^\$schema$`,
                                  groupName: '$schema',
                              },
                              {elementNamePattern: '^id$', groupName: 'id'},
                              {elementNamePattern: '^env$', groupName: 'env'},
                              {elementNamePattern: '^files$', groupName: 'files'},
                              {elementNamePattern: '^parser$', groupName: 'parser'},
                              {elementNamePattern: '^plugins$', groupName: 'plugins'},
                              {elementNamePattern: '^extends$', groupName: 'extends'},
                              {elementNamePattern: '^rules$', groupName: 'rules'},
                              {elementNamePattern: '^overrides$', groupName: 'overrides'},
                          ],
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
