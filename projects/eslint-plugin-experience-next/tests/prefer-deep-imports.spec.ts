import * as tsParser from '@typescript-eslint/parser';
import {RuleTester} from 'eslint';

import rule from '../rules/prefer-deep-imports';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
        },
    },
});

ruleTester.run('prefer-deep-imports', rule, {
    invalid: [
        {
            code: "import {TuiButton} from '@taiga-ui/core';",
            errors: [
                {
                    messageId: 'prefer-deep-imports',
                },
            ],
            options: [
                {
                    importFilter: String.raw`/^@taiga-ui\u002F(core|cdk|kit)$/`,
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
    ],
});
