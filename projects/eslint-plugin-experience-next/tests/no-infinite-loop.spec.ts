import parser from '@typescript-eslint/parser';

import {rule} from '../rules/no-infinite-loop';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({languageOptions: {parser}});

ruleTester.run('no-infinite-loop', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                while (true) {
                    process();
                }
            `,
            errors: [{messageId: 'whileLoop'}],
        },
        {
            code: 'while (((true))) { process(); }',
            errors: [{messageId: 'whileLoop'}],
        },
        {
            code: /* TypeScript */ `
                for (;;) {
                    process();
                }
            `,
            errors: [{messageId: 'forLoop'}],
        },
        {
            code: /* TypeScript */ `
                for (let index = 0; ; index++) {
                    process(index);
                }
            `,
            errors: [{messageId: 'forLoop'}],
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                while (isRunning) {
                    process();
                }
            `,
        },
        {
            code: /* TypeScript */ `
                for (; isRunning; ) {
                    process();
                }
            `,
        },
        {
            code: /* TypeScript */ `
                for (let index = 0; index < items.length; index++) {
                    process(items[index]);
                }
            `,
        },
        {
            code: /* TypeScript */ `
                do {
                    process();
                } while (true);
            `,
        },
    ],
});
