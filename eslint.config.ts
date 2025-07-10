import taiga from '@taiga-ui/eslint-plugin-experience-next';

export default [
    ...taiga.configs.recommended,
    {
        ignores: [
            // TypeScript will ignore files with duplicate filenames in the same folder
            // (for example, src/file.ts and src/file.js). TypeScript purposely ignore
            // all but one of the files, only keeping the one file
            // with the highest priority extension
            '**/jest-preset.js',
            '**/jest.config.js',
            '**/eslint.config.js',
            '.release-it.js',
            '**/*.spec.js',
        ],
    },
    {
        files: ['**/*.js', '**/*.ts'],
        rules: {
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
