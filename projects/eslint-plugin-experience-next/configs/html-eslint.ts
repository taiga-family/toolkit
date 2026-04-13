import html from '@html-eslint/eslint-plugin';
import htmlParser from '@html-eslint/parser';
import {defineConfig} from 'eslint/config';

export default defineConfig([
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
        files: ['**/*.html'],
        plugins: {html},
        extends: ['html/recommended'],
        language: 'html/html',
        languageOptions: {
            parser: htmlParser,
            parserOptions: {templateEngineSyntax: {'{{': '}}'}},
        },
        rules: {
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
            'html/require-img-alt': ['error', {substitute: ['[alt]', '[attr.alt]']}],
            'html/use-baseline': 'off',
        },
    },
    {
        files: ['**/demo/**/*.html'],
        rules: {'html/no-restricted-attr-values': 'off'},
    },
]);
