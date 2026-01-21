import {rule} from '../rules/no-deep-imports';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
        },
    },
});

ruleTester.run('no-deep-imports', rule, {
    invalid: [
        {
            code: "import {TuiButton} from '@taiga-ui/core/components/button';",
            errors: [{messageId: 'no-deep-imports'}],
            output: "import {TuiButton} from '@taiga-ui/core';",
        },
        {
            code: "import {helper} from '@taiga-ui/kit/utils/format/helper';",
            errors: [{messageId: 'no-deep-imports'}],
            output: "import {helper} from '@taiga-ui/kit';",
        },
        {
            code: "import {TuiService} from '@taiga-ui/addon-commerce/services/payment/stripe';",
            errors: [{messageId: 'no-deep-imports'}],
            output: "import {TuiService} from '@taiga-ui/addon-commerce';",
        },
    ],
    valid: [
        {code: "import {TuiButton} from '@taiga-ui/core';"},
        {code: "import {Component} from '@angular/core';"},
        {
            code: "import {TuiComponent} from '@taiga-ui/core/components/button';",
            options: [{ignoreImports: ['@taiga-ui/core/components/button']}],
        },
        {
            code: "import {TuiComponent} from '@taiga-ui/core/components/button';",
            filename: '/projects/core/src/components/test.ts',
            options: [{currentProject: 'core'}],
        },
    ],
});
