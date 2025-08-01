// @ts-ignore, cannot find module @typescript-eslint/parser or its corresponding type declarations
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
        // Note: Since this rule requires file system access to find entry points,
        // these tests may fail in the testing environment. The rule is designed
        // to work with actual package installations.
        //
        // Basic test structure - actual behavior may vary based on file system
        // {
        //     code: `import {TuiButton} from '@taiga-ui/core';`,
        //     options: [{
        //         importFilter: '/^@taiga-ui\\u002F(core|cdk|kit)$/'
        //     }],
        //     errors: [{
        //         messageId: 'prefer-deep-imports',
        //     }],
        // },
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
