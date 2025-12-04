import rule from '../rules/prefer-deep-imports';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {
            projectService: {
                allowDefaultProject: ['*.ts*'],
            },
        },
    },
});

ruleTester.run('prefer-deep-imports', rule, {
    invalid: [
        {
            code: "import {TuiButton} from '@taiga-ui/core';",
            errors: [{messageId: 'prefer-deep-imports'}],
            options: [
                {
                    importFilter: String.raw`/^@taiga-ui\u002F(core)$/`,
                    mockPaths: {
                        '@taiga-ui/core': '/mock/core/public-api.ts',
                    },
                },
            ],
        },
        {
            code: "import {TuiButton} from '@taiga-ui/core/components';",
            errors: [{messageId: 'prefer-deep-imports'}],
            options: [
                {
                    importFilter: String.raw`/^@taiga-ui\u002F(core)$/`,
                    mockPaths: {
                        '@taiga-ui/core/components': '/mock/core/components/index.ts',
                        '@taiga-ui/core/components/button':
                            '/mock/core/components/button/index.ts',
                    },
                    strict: true,
                },
            ],
        },
        {
            code: "import {TuiX} from '@taiga-ui/core/unknown';",
            errors: [{messageId: 'prefer-deep-imports'}],
            options: [
                {
                    importFilter: String.raw`/^@taiga-ui\u002F(core)(?:\u002F.*)?$/`,
                    mockPaths: {
                        '@taiga-ui/core/unknown': '/mock/core/unknown/index.ts',
                    },
                },
            ],
        },
    ],
    valid: [
        {
            code: "import {Component} from '@angular/core';",
            options: [
                {
                    importFilter: String.raw`/^@taiga-ui\u002F(core|cdk|kit)$/`,
                },
            ],
        },
        {
            code: "import {TuiButton} from '@taiga-ui/core/components/button';",
            options: [
                {
                    importFilter: String.raw`/^@taiga-ui\u002F(core|cdk|kit)\u002Fcomponents$/`,
                },
            ],
        },
        {
            code: "import {TuiButton} from '@taiga-ui/core';",
            options: [
                {
                    importFilter: String.raw`/^@taiga-ui\u002F(addon-commerce)$/`,
                },
            ],
        },
        {
            code: "import {TuiButton} from '@taiga-ui/core/components/button';",
            options: [
                {
                    importFilter: String.raw`/^@taiga-ui\u002F(core)$/`,
                    mockPaths: {
                        '@taiga-ui/core/components/button':
                            '/mock/core/components/button/index.ts',
                    },
                },
            ],
        },
        {
            code: "import {TuiButton} from '@taiga-ui/core/components';",
            options: [
                {
                    importFilter: String.raw`/^@taiga-ui\u002F(core)$/`,
                    mockPaths: {
                        '@taiga-ui/core/components':
                            '/mock/core/components/public-api.ts',
                    },
                    strict: false,
                },
            ],
        },
        {
            code: "import {TuiButton} from '@taiga-ui/core/components';",
            options: [
                {
                    importFilter: String.raw`/^@taiga-ui\u002F(core)$/`,
                    mockPaths: {
                        '@taiga-ui/core/components':
                            '/mock/core/components/public-api.ts',
                    },
                    strict: true,
                },
            ],
        },
        {
            code: "import {Q} from '@taiga-ui/core/unknown/path';",
            options: [
                {
                    importFilter: String.raw`/^@taiga-ui\u002F(core)$/`,
                },
            ],
        },
    ],
});
