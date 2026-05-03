import {rule} from '../rules/recommended/single-line-variable-spacing';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
    },
});

ruleTester.run('single-line-variable-spacing', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                let a = 1;
                const b = Math.max(
                    validatedTimeString.length - value.length - paddedZeroes,
                    0,
                );
                let c = 3;
            `,
            errors: [
                {messageId: 'missingBlankLineBeforeMultilineVariable'},
                {messageId: 'missingBlankLineAfterMultilineVariable'},
            ],
            output: `
                let a = 1;

                const b = Math.max(
                    validatedTimeString.length - value.length - paddedZeroes,
                    0,
                );

                let c = 3;
            `,
        },
        {
            code: /* TypeScript */ `
                let a = 1;

                let b = 2;

                const c = 3;
            `,
            errors: [
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'},
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'},
            ],
            output: `
                let a = 1;
                let b = 2;
                const c = 3;
            `,
        },
        {
            code: /* TypeScript */ `
                let a = require('path');

                let b = 2;

                const c = 3;
            `,
            errors: [{messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'}],
            output: `
                let a = require('path');

                let b = 2;
                const c = 3;
            `,
        },
        {
            code: /* TypeScript */ `
                export const a = 1;

                export let b = 2;

                var c = 3;
            `,
            errors: [{messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'}],
            output: `
                export const a = 1;
                export let b = 2;

                var c = 3;
            `,
        },
        {
            code: /* TypeScript */ `
                export const a1 = 1;

                export const a2 = 1;

                export const a3 = 1;

                let b1 = 2;

                let b2 = 2;

                let b3 = 2;
            `,
            errors: [
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'},
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'},
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'},
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'},
            ],
            output: `
                export const a1 = 1;
                export const a2 = 1;
                export const a3 = 1;

                let b1 = 2;
                let b2 = 2;
                let b3 = 2;
            `,
        },
        {
            code: /* TypeScript */ `
                export const a1 = 1;

                const a2 = 1;

                const a3 = 1;

                export let b1 = 2;

                export let b2 = 2;

                let b3 = 2;
            `,
            errors: [
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'},
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'},
            ],
            output: `
                export const a1 = 1;

                const a2 = 1;
                const a3 = 1;

                export let b1 = 2;
                export let b2 = 2;

                let b3 = 2;
            `,
        },
        {
            code: /* TypeScript */ `
                export const a = 1;
                const b = 2;
            `,
            errors: [{messageId: 'missingBlankLineBetweenVariableGroups'}],
            output: `
                export const a = 1;

                const b = 2;
            `,
        },
        {
            code: /* TypeScript */ `
                if (enabled) {
                    const a = 1;

                    let b = 2;
                }
            `,
            errors: [{messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'}],
            output: `
                if (enabled) {
                    const a = 1;
                    let b = 2;
                }
            `,
        },
        {
            code: `
                class Example {
                    static {
                        const a = 1;
                        const b = Math.max(
                            value,
                            0,
                        );
                    }
                }
            `,
            errors: [{messageId: 'missingBlankLineBeforeMultilineVariable'}],
            output: `
                class Example {
                    static {
                        const a = 1;

                        const b = Math.max(
                            value,
                            0,
                        );
                    }
                }
            `,
        },
        {
            code: /* TypeScript */ `
                namespace Example {
                    const a = 1;

                    let b = 2;
                }
            `,
            errors: [{messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'}],
            output: `
                namespace Example {
                    const a = 1;
                    let b = 2;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                switch (value) {
                    case 1:
                        const a = 1;

                        let b = 2;
                        break;
                }
            `,
            errors: [{messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'}],
            output: `
                switch (value) {
                    case 1:
                        const a = 1;
                        let b = 2;
                        break;
                }
            `,
        },
        {
            // The fixer inserts only the blank line between declarations.
            code: `
                const a = compute(
                    value,
                );
                const b = computeMore(
                    value,
                );
            `,
            errors: [{messageId: 'missingBlankLineAfterMultilineVariable'}],
            output: `
                const a = compute(
                    value,
                );

                const b = computeMore(
                    value,
                );
            `,
        },
        {
            // Mixed declarations are not import boundaries, even when one initializer uses require().
            code: `
                const a = require('path'), b = 1;

                const c = 2;
            `,
            errors: [{messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'}],
            output: `
                const a = require('path'), b = 1;
                const c = 2;
            `,
        },
        {
            code: 'let a = 1;\r\n\r\nlet b = 2;\r\n',
            errors: [{messageId: 'unexpectedBlankLineBeforeNextSingleLineVariable'}],
            output: 'let a = 1;\r\nlet b = 2;\r\n',
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                let a = 1;

                const b = Math.max(
                    validatedTimeString.length - value.length - paddedZeroes,
                    0,
                );

                let c = 3;
            `,
        },
        {
            code: /* TypeScript */ `
                let a = 1;
                let b = 2;
                const c = 3;
            `,
        },
        {
            code: /* TypeScript */ `
                export const a1 = 1;

                const a2 = 1;

                export const a3 = 1;

                let b1 = 2;

                export let b2 = 2;

                let b3 = 2;
            `,
        },
        {
            code: /* TypeScript */ `
                const dependency = require('path');
                let value = 2;
            `,
        },
        {
            code: /* TypeScript */ `
                const dependency = require('path');

                let value = 2;
            `,
        },
        {
            code: /* TypeScript */ `
                const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

                const ruleTester = new RuleTester({languageOptions: {}});
            `,
        },
        {
            code: /* TypeScript */ `
                const dependency = import('./dependency');
                let value = 2;
            `,
        },
        {
            code: /* TypeScript */ `
                const dependency = import('./dependency').then(({value}) => value);

                let value = 2;
            `,
        },
        {
            code: /* TypeScript */ `
                let a = 1;

                // keep this comment near the next declaration
                let b = 2;
            `,
        },
        {
            code: /* TypeScript */ `
                for (let index = 0; index < 3; index++) {
                    run(index);
                }
            `,
        },
    ],
});
