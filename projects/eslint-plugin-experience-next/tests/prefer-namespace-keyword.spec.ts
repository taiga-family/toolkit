import {rule} from '../rules/prefer-namespace-keyword';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {ecmaVersion: 'latest', sourceType: 'module'},
    },
});

ruleTester.run('prefer-namespace-keyword', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                module Foo {
                    export const value = 1;
                }
            `,
            errors: [{messageId: 'useNamespaceKeyword'}],
            output: /* TypeScript */ `
                namespace Foo {
                    export const value = 1;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                declare module Foo.Bar {
                    export type Value = string;
                }
            `,
            errors: [{messageId: 'useNamespaceKeyword'}],
            output: /* TypeScript */ `
                declare namespace Foo.Bar {
                    export type Value = string;
                }
            `,
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                namespace Foo {
                    export const value = 1;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                declare module 'legacy-client' {
                    export interface Options {
                        readonly value: string;
                    }
                }
            `,
        },
        {
            code: /* TypeScript */ `
                declare global {
                    interface Window {
                        readonly appReady: boolean;
                    }
                }
            `,
        },
    ],
});
