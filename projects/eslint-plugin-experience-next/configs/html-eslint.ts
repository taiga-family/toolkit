import html from '@html-eslint/eslint-plugin';
import htmlParser from '@html-eslint/parser';

export default [
    {
        ...html.configs['flat/recommended'],
        files: ['**/*.html'],
        plugins: {
            '@html-eslint': html,
        },
        ignores: [
            '**/tests-report/**',
            '**/snapshots/**',
            '**/test-results/**',
            '**/.nx/**',
            '**/node_modules/**',
            '**/coverage/**',
        ],
        languageOptions: {
            parser: htmlParser,
        },
        rules: {
            ...html.configs['flat/recommended'].rules,
            '@html-eslint/indent': 'off', // prettier conflicts
            '@html-eslint/no-extra-spacing-attrs': 'off', // prettier conflicts
            '@html-eslint/no-multiple-h1': 'off',
            '@html-eslint/no-restricted-attr-values': [
                'error',
                {
                    attrPatterns: ['iconStart', 'iconEnd'],
                    attrValuePatterns: ['@tui'],
                    message:
                        'Icons must be configured, for example: <button tuiIconButton [iconStart]="options.iconStart" [iconEnd]="options.iconEnd" />',
                },
            ],
            '@html-eslint/require-closing-tags': 'off', // prettier conflicts
            '@html-eslint/require-img-alt': [
                'error',
                {
                    substitute: ['[alt]', '[attr.alt]'],
                },
            ],
            '@html-eslint/use-baseline': 'off',
        },
    },
    {
        files: ['**/demo/**/*.html'],
        rules: {
            '@html-eslint/no-restricted-attr-values': 'off',
        },
    },
];
