import {rule} from '../rules/taiga-specific/flat-exports';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {projectService: {allowDefaultProject: ['*.ts*']}},
    },
});

ruleTester.run('flat-exports', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                class TuiTextfieldDirective {}
                class TuiInputDirective {}

                export const TuiTextfield = [TuiTextfieldDirective] as const;
                export const TuiInput = [TuiTextfield, TuiInputDirective] as const;
            `,
            errors: [{data: {name: 'TuiTextfield'}, messageId: 'spreadArrays'}],
            output: /* TypeScript */ `
                class TuiTextfieldDirective {}
                class TuiInputDirective {}

                export const TuiTextfield = [TuiTextfieldDirective] as const;
                export const TuiInput = [...TuiTextfield, TuiInputDirective] as const;
            `,
        },
        {
            code: /* TypeScript */ `
                class A {}
                class B {}
                class C {}

                export const X = [A] as const;
                export const Y = [X, B] as const;
                export const Z = [Y, C] as const;
            `,
            errors: [
                {data: {name: 'X'}, messageId: 'spreadArrays'},
                {data: {name: 'Y'}, messageId: 'spreadArrays'},
            ],
            output: /* TypeScript */ `
                class A {}
                class B {}
                class C {}

                export const X = [A] as const;
                export const Y = [...X, B] as const;
                export const Z = [...Y, C] as const;
            `,
        },
        {
            code: /* TypeScript */ `
                class A {}
                class B {}

                export const First = [A] as const;
                export const Second = [First, B] as const;
            `,
            errors: [{data: {name: 'First'}, messageId: 'spreadArrays'}],
            output: /* TypeScript */ `
                class A {}
                class B {}

                export const First = [A] as const;
                export const Second = [...First, B] as const;
            `,
        },
        {
            code: /* TypeScript */ `
                class A {}
                class B {}
                class C {}

                export const One = [A] as const;
                export const Two = [One, B] as const;
                export const Three = [Two, C] as const;
            `,
            errors: [
                {data: {name: 'One'}, messageId: 'spreadArrays'},
                {data: {name: 'Two'}, messageId: 'spreadArrays'},
            ],
            output: /* TypeScript */ `
                class A {}
                class B {}
                class C {}

                export const One = [A] as const;
                export const Two = [...One, B] as const;
                export const Three = [...Two, C] as const;
            `,
        },
        {
            code: /* TypeScript */ `
                class A {}
                class B {}
                class C {}

                export const Base = [A, B] as const;
                export const Combo = [Base, C] as const;
            `,
            errors: [{data: {name: 'Base'}, messageId: 'spreadArrays'}],
            output: /* TypeScript */ `
                class A {}
                class B {}
                class C {}

                export const Base = [A, B] as const;
                export const Combo = [...Base, C] as const;
            `,
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                export const A = ['abc'] as const;
                export const B = [A, 123] as const;
            `,
        },
        {
            code: /* TypeScript */ `
                export const A = ['abc'] as const;
                export const B = [A, class C {}] as const;
            `,
        },
        {
            code: /* TypeScript */ `
                class A {}
                class B {}

                export const X = [A] as const;
                export const Y = [...X, B] as const;
            `,
        },
        {
            code: /* TypeScript */ `
                class A {}
                class B {}

                export const X = [A];
                export const Y = [X, B];
            `,
        },
        {
            code: /* TypeScript */ `
                class A {}
                class B {}

                export const X = [A] as const;
                export const Z = ['dirty']; // not as const
                export const Y = [X, Z] as const;
            `,
        },
        {
            code: /* TypeScript */ `
                class A {}
                class B {}

                export const X = [A, 'abc'];
            `,
        },
        {
            code: /* TypeScript */ `
                class A {}
                class B {}
                class C {}

                export const List = [A, B, C] as const;
            `,
        },
        {
            code: /* TypeScript */ `
                class A {}
                export const Inner = ['x'] as const;
                export const Outer = [Inner, A] as const;
            `,
        },
        {
            code: /* TypeScript */ `
                export const A = ['abc'] as const;
                export const B = [A] as const;
                export const C = [B] as const;
            `,
        },
    ],
});
