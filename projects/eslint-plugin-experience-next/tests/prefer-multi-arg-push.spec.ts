import {rule} from '../rules/prefer-multi-arg-push';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@typescript-eslint/parser')},
});

ruleTester.run('prefer-multi-arg-push', rule, {
    invalid: [
        {
            code: `
                output.push('# Getting Started');
                output.push('');
            `,
            errors: [
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
            ],
            output: `
                output.push('# Getting Started', '');
            `,
        },
        {
            code: `
                output.push('a');
                output.push('b');
                output.push('c');
            `,
            errors: [
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
            ],
            output: `
                output.push('a', 'b', 'c');
            `,
        },
        {
            code: `
                function build() {
                    output.push('hello');
                    output.push('world');
                }
            `,
            errors: [
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
            ],
            output: `
                function build() {
                    output.push('hello', 'world');
                }
            `,
        },
        {
            code: `
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
            output: `
                lines.push('first', 'second');
                other.push('x', 'y');
            `,
        },
        {
            code: `
                result.push(a, b);
                result.push(c);
            `,
            errors: [
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
            ],
            output: `
                result.push(a, b, c);
            `,
        },
        {
            code: `
                this.list.push('a');
                this.list.push('b');
            `,
            errors: [
                {messageId: 'preferMultiArgPush'},
                {messageId: 'preferMultiArgPush'},
            ],
            output: `
                this.list.push('a', 'b');
            `,
        },
    ],
    valid: [
        {code: "output.push('# Getting Started', '');"},
        {
            code: `
                output.push('a');
                console.log('b');
                output.push('c');
            `,
        },
        {
            code: `
                arr1.push('x');
                arr2.push('y');
            `,
        },
        {code: "output.push('only one');"},
    ],
});
