import taiga, {
    TUI_RECOMMENDED_NAMING_CONVENTION as recommended,
} from '@taiga-ui/eslint-plugin-experience-next';

export default [
    ...taiga.configs.recommended,
    ...taiga.configs['taiga-specific'],
    {
        files: ['**/*.{ts,js}'],
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
