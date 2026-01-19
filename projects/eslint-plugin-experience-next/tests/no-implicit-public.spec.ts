import {rule} from '../rules/no-implicit-public';

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

ruleTester.run('no-implicit-public', rule, {
    invalid: [
        {
            code: `
                class TestClass {
                    method() {}
                }
            `,
            errors: [{message: 'method method should be marked as public'}],
            output: `
                class TestClass {
                     public method() {}
                }
            `,
        },
        {
            code: `
                class TestClass {
                    field = 'value';
                }
            `,
            errors: [{message: 'property field should be marked as public'}],
            output: `
                class TestClass {
                     public field = 'value';
                }
            `,
        },
        {
            code: `
                class TestClass {
                    get value() { return 'test'; }
                }
            `,
            errors: [{message: 'get value should be marked as public'}],
            output: `
                class TestClass {
                     public get value() { return 'test'; }
                }
            `,
        },
        {
            code: `
                class TestClass {
                    set value(val: string) {}
                }
            `,
            errors: [{message: 'set value should be marked as public'}],
            output: `
                class TestClass {
                     public set value(val: string) {}
                }
            `,
        },
        {
            code: `
                class TestClass {
                    @Input() field = 'value';
                }
            `,
            errors: [{message: 'property field should be marked as public'}],
            output: `
                class TestClass {
                    @Input()  public field = 'value';
                }
            `,
        },
    ],
    valid: [
        {
            code: `
                class TestClass {
                    constructor() {}
                }
            `,
        },
        {
            code: `
                class TestClass {
                    public method() {}
                    private field = 'value';
                    protected prop: string;
                }
            `,
        },
        {
            code: `
                class TestClass {
                    public readonly value = 'test';
                    public get accessor() { return 'value'; }
                    public set accessor(val: string) {}
                }
            `,
        },
    ],
});
