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
        ...html.configs.recommended,
        files: ['**/*.html'],
        plugins: {html},
        language: 'html/html',
        languageOptions: {
            parser: htmlParser,
        },
        rules: {
            ...html.configs.recommended.rules,
            'html/indent': 'off', // prettier conflicts
            'html/no-extra-spacing-attrs': 'off', // prettier conflicts
            'html/no-multiple-h1': 'off',
            'html/no-restricted-attr-values': [
                'error',
                {
                    attrPatterns: ['iconStart', 'iconEnd', 'icon'],
                    attrValuePatterns: ['@tui'],
                    message:
                        'Icons must be configured, for example: \n<button tuiIconButton [iconStart]="options.iconStart" [iconEnd]="options.iconEnd" /> \n<tui-icon [icon]="options.icon" />',
                },
            ],
            'html/require-closing-tags': 'off', // prettier conflicts
            'html/require-img-alt': [
                'error',
                {
                    substitute: ['[alt]', '[attr.alt]'],
                },
            ],
            'html/use-baseline': 'off',
        },
    },
    {
        files: ['**/demo/**/*.html'],
        rules: {
            'html/no-restricted-attr-values': 'off',
        },
    },
];
