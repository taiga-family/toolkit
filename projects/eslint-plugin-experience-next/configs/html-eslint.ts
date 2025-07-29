import html from '@html-eslint/eslint-plugin';
import htmlParser from '@html-eslint/parser';

export default [
    {
        ignores: [
            '**/tests-report/**',
            '**/snapshots/**',
            '**/test-results/**',
            '**/.nx/**',
            '**/node_modules/**',
            '**/coverage/**',
        ],
    },
    {
        ...html.configs['flat/recommended'],
        files: ['**/*.html'],
        plugins: {
            '@html-eslint': html,
        },

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
                    attrPatterns: ['iconStart', 'iconEnd', 'icon'],
                    attrValuePatterns: ['@tui'],
                    message:
                        'Icons must be configured, for example: \n<button tuiIconButton [iconStart]="options.iconStart" [iconEnd]="options.iconEnd" /> \n<tui-icon [icon]="options.icon" />',
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
