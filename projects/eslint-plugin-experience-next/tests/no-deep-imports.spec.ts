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
            code: /* TypeScript */ "import {TuiButton} from '@taiga-ui/core/components/button';",
            errors: [{messageId: 'no-deep-imports'}],
            output: /* TypeScript */ "import {TuiButton} from '@taiga-ui/core';",
        },
        {
            code: /* TypeScript */ "import {helper} from '@taiga-ui/kit/utils/format/helper';",
            errors: [{messageId: 'no-deep-imports'}],
            output: /* TypeScript */ "import {helper} from '@taiga-ui/kit';",
        },
        {
            code: /* TypeScript */ "import {TuiService} from '@taiga-ui/addon-commerce/services/payment/stripe';",
            errors: [{messageId: 'no-deep-imports'}],
            output: /* TypeScript */ "import {TuiService} from '@taiga-ui/addon-commerce';",
        },
    ],
    valid: [
        {code: /* TypeScript */ "import {TuiButton} from '@taiga-ui/core';"},
        {code: /* TypeScript */ "import {Component} from '@angular/core';"},
        {
            code: /* TypeScript */ "import {TuiComponent} from '@taiga-ui/core/components/button';",
            options: [{ignoreImports: ['@taiga-ui/core/components/button']}],
        },
        {
            code: /* TypeScript */ "import {TuiComponent} from '@taiga-ui/core/components/button';",
            filename: '/projects/core/src/components/test.ts',
            options: [{currentProject: 'core'}],
        },
    ],
});
