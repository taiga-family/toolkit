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
            '@taiga-ui/experience-next/no-href-with-router-link': 'error',
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
            'html/no-restricted-attrs': [
                'error',
                {
                    attrPatterns: [
                        String.raw`\[style\.left(\.[a-z]+)?\]`,
                        String.raw`\[style\.right(\.[a-z]+)?\]`,
                        String.raw`\[style\.top(\.[a-z]+)?\]`,
                        String.raw`\[style\.bottom(\.[a-z]+)?\]`,
                        String.raw`\[style\.margin-left(\.[a-z]+)?\]`,
                        String.raw`\[style\.margin-right(\.[a-z]+)?\]`,
                        String.raw`\[style\.margin-top(\.[a-z]+)?\]`,
                        String.raw`\[style\.margin-bottom(\.[a-z]+)?\]`,
                        String.raw`\[style\.padding-left(\.[a-z]+)?\]`,
                        String.raw`\[style\.padding-right(\.[a-z]+)?\]`,
                        String.raw`\[style\.padding-top(\.[a-z]+)?\]`,
                        String.raw`\[style\.padding-bottom(\.[a-z]+)?\]`,
                        String.raw`\[style\.border-left(\.[a-z]+)?\]`,
                        String.raw`\[style\.border-right(\.[a-z]+)?\]`,
                        String.raw`\[style\.border-top(\.[a-z]+)?\]`,
                        String.raw`\[style\.border-bottom(\.[a-z]+)?\]`,
                    ],
                    message: `
Use logical CSS properties instead of directional properties. Replace:
• left → inset-inline-start
• right → inset-inline-end
• top → inset-block-start
• bottom → inset-block-end
• margin-left → margin-inline-start
• margin-right → margin-inline-end
• margin-top → margin-block-start
• margin-bottom → margin-block-end
• padding-left → padding-inline-start
• padding-right → padding-inline-end
• padding-top → padding-block-start
• padding-bottom → padding-block-end
• border-left → border-inline-start
• border-right → border-inline-end
• border-top → border-block-start
• border-bottom → border-block-end
`,
                    tagPatterns: ['.*'],
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
