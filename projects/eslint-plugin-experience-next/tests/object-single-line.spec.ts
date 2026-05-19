import {rule} from '../rules/recommended/object-single-line';
import {withCrLf} from './utils/line-endings';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@typescript-eslint/parser')},
});

ruleTester.run('object-single-line', rule, {
    invalid: [
        {
            code: withCrLf(/* TypeScript */ `
                const value = {
                    item: true,
                };
            `),
            errors: [{messageId: 'oneLine'}],
            output: withCrLf(/* TypeScript */ `
                const value = {item: true};
            `),
        },
    ],
    valid: [
        {
            code: /* TypeScript */ 'const value = {item: true};',
        },
        {
            code: /* TypeScript */ `
                const value = {
                    first: true,
                    second: false,
                };
            `,
        },
    ],
});
