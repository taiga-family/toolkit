import {rule} from '../rules/prefer-multi-arg-push';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@typescript-eslint/parser')},
});

ruleTester.run('prefer-multi-arg-push', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                output.push('# Getting Started');
                output.push('');
            `,
            errors: [
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
            ],
            output: /* TypeScript */ `
                output.push('# Getting Started', '');
            `,
        },
        {
            code: /* TypeScript */ `
                output.push('a');
                output.push('b');
                output.push('c');
            `,
            errors: [
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
            ],
            output: /* TypeScript */ `
                output.push('a', 'b', 'c');
            `,
        },
        {
            code: /* TypeScript */ `
                function build() {
                    output.push('hello');
                    output.push('world');
                }
            `,
            errors: [
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
            ],
            output: /* TypeScript */ `
                function build() {
                    output.push('hello', 'world');
                }
            `,
        },
        {
            code: /* TypeScript */ `
                lines.push('first');
                lines.push('second');
                other.push('x');
                other.push('y');
            `,
            errors: [
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
            ],
            output: /* TypeScript */ `
                lines.push('first', 'second');
                other.push('x', 'y');
            `,
        },
        {
            code: /* TypeScript */ `
                result.push(a, b);
                result.push(c);
            `,
            errors: [
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
            ],
            output: /* TypeScript */ `
                result.push(a, b, c);
            `,
        },
        {
            code: /* TypeScript */ `
                this.list.push('a');
                this.list.push('b');
            `,
            errors: [
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
            ],
            output: /* TypeScript */ `
                this.list.push('a', 'b');
            `,
        },
    ],
    valid: [
        {code: /* TypeScript */ "output.push('# Getting Started', '');"},
        {
            code: /* TypeScript */ `
                output.push('a');
                console.log('b');
                output.push('c');
            `,
        },
        {
            code: /* TypeScript */ `
                arr1.push('x');
                arr2.push('y');
            `,
        },
        {code: /* TypeScript */ "output.push('only one');"},
    ],
});
