import {rule} from '../rules/recommended/no-infinite-loop';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@typescript-eslint/parser')},
});

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
        {
            code: /* TypeScript */ `
                do {
                    process();
                } while (true);
            `,
            errors: [{messageId: 'doWhileLoop'}],
        },
        {
            code: /* TypeScript */ `
                while (1) {
                    process();
                }
            `,
            errors: [{messageId: 'whileLoop'}],
        },
        {
            code: 'while (((1))) { process(); }',
            errors: [{messageId: 'whileLoop'}],
        },
        {
            code: /* TypeScript */ `
                do {
                    process();
                } while (1);
            `,
            errors: [{messageId: 'doWhileLoop'}],
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
                } while (isRunning);
            `,
        },
        {
            code: /* TypeScript */ `
                do {
                    process();
                } while (index < items.length);
            `,
        },
        {
            code: /* TypeScript */ `
                while (count) {
                    process();
                }
            `,
        },
        {
            code: /* TypeScript */ `
                do {
                    process();
                } while (count);
            `,
        },
    ],
});
