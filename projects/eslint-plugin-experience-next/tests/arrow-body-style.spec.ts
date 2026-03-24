import {builtinRules} from 'eslint/use-at-your-own-risk';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@typescript-eslint/parser')},
});

const rule = builtinRules.get('arrow-body-style')!;

ruleTester.run('arrow-body-style', rule, {
    invalid: [
        {
            code: /* TypeScript */ 'const fn = () => { return 1; };',
            errors: [{messageId: 'unexpectedSingleBlock'}],
            options: ['as-needed'],
            output: 'const fn = () => 1;',
        },
        {
            code: /* TypeScript */ `
                provide({
                    useFactory: () => {
                        return typeof valueOrFactory === 'function'
                            ? (valueOrFactory as () => T)()
                            : valueOrFactory;
                    },
                });
            `,
            errors: [{messageId: 'unexpectedSingleBlock'}],
            options: ['as-needed'],
            output: `
                provide({
                    useFactory: () => typeof valueOrFactory === 'function'
                            ? (valueOrFactory as () => T)()
                            : valueOrFactory,
                });
            `,
        },
        {
            code: /* TypeScript */ 'const fn = (x: number) => { return x * 2; };',
            errors: [{messageId: 'unexpectedSingleBlock'}],
            options: ['as-needed'],
            output: 'const fn = (x: number) => x * 2;',
        },
        {
            code: /* TypeScript */ 'const fn = () => { return a ?? b; };',
            errors: [{messageId: 'unexpectedSingleBlock'}],
            options: ['as-needed'],
            output: 'const fn = () => a ?? b;',
        },
    ],
    valid: [
        {
            code: /* TypeScript */ 'const fn = () => 1;',
            options: ['as-needed'],
        },
        {
            code: /* TypeScript */ 'const fn = () => a ? b : c;',
            options: ['as-needed'],
        },
        {
            code: /* TypeScript */ 'const fn = () => ({ key: value });',
            options: ['as-needed'],
        },
        {
            code: /* TypeScript */ 'const fn = () => { const x = 1; return x; };',
            options: ['as-needed'],
        },
        {
            code: /* TypeScript */ 'const fn = () => { console.log(1); return 1; };',
            options: ['as-needed'],
        },
    ],
});
