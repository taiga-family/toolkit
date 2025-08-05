import * as tsParser from '@typescript-eslint/parser';
import {RuleTester} from 'eslint';

import rule from '../rules/no-private-esnext-fields';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
        },
    },
});

ruleTester.run('no-private-esnext-fields', rule, {
    invalid: [
        {
            code: `
                class TestClass {
                    #privateField = 'value';
                }
            `,
            errors: [
                {
                    message:
                        'Please don\'t use "#privateField" instead of "private privateField"',
                },
            ],
        },
        {
            code: `
                class TestClass {
                    #privateMethod() {
                        return 'test';
                    }
                }
            `,
            errors: [
                {
                    message:
                        'Please don\'t use "#privateMethod" instead of "private privateMethod"',
                },
            ],
        },
        {
            code: `
                class TestClass {
                    #field1 = 'value1';
                    #field2 = 'value2';
                }
            `,
            errors: [
                {
                    message: 'Please don\'t use "#field1" instead of "private field1"',
                },
                {
                    message: 'Please don\'t use "#field2" instead of "private field2"',
                },
            ],
        },
    ],
    valid: [
        {
            code: `
                class TestClass {
                    private field = 'value';
                    private method() {}
                }
            `,
        },
        {
            code: `
                class TestClass {
                    public field = 'value';
                    field2 = 'value2';
                }
            `,
        },
        {
            code: `
                class TestClass {
                    constructor() {}
                }
            `,
        },
    ],
});
