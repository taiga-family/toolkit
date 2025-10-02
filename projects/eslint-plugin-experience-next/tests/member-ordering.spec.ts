import {rules} from '@typescript-eslint/eslint-plugin';

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

const rule = rules['member-ordering'];

// Member ordering configuration from recommended.ts
const memberOrderingConfig = {
    default: [
        'signature',
        'readonly-signature',
        'public-static-field',
        'protected-static-field',
        '#private-static-field',
        'private-static-field',
        'private-decorated-field',
        'protected-abstract-field',
        'public-abstract-field',
        '#private-instance-field',
        'private-decorated-field',
        'private-instance-field',
        ['protected-decorated-field', 'public-decorated-field'],
        ['protected-instance-field', 'public-instance-field'],
        'private-constructor',
        'protected-constructor',
        'public-constructor',
        'public-static-method',
        'protected-static-method',
        'private-static-method',
        '#private-static-method',
        'public-abstract-get',
        'public-abstract-set',
        'protected-abstract-get',
        'protected-abstract-set',
        'public-abstract-method',
        'protected-abstract-method',
        ['public-decorated-set', 'public-decorated-get'],
        ['public-set', 'public-get'],
        'public-decorated-method',
        'public-instance-method',
        ['protected-decorated-set', 'protected-decorated-get'],
        ['protected-set', 'protected-get'],
        'protected-decorated-method',
        'protected-instance-method',
        ['private-decorated-set', 'private-decorated-get'],
        ['private-set', 'private-get'],
        'private-decorated-method',
        'private-instance-method',
        '#private-instance-method',
    ],
};

ruleTester.run('member-ordering with public|protected-instance-field', rule, {
    invalid: [
        {
            code: `
                class TestClass {
                    public field1 = 'value';
                    private field2 = 'value';
                }
            `,
            errors: [{messageId: 'incorrectGroupOrder'}],
            options: [memberOrderingConfig],
        },
        {
            code: `
                class TestClass {
                    protected field1 = 'value';
                    private field2 = 'value';
                }
            `,
            errors: [{messageId: 'incorrectGroupOrder'}],
            options: [memberOrderingConfig],
        },
    ],
    valid: [
        {
            code: `
                class TestClass {
                    private field1 = 'value';
                    public field2 = 'value';
                }
            `,
            options: [memberOrderingConfig],
        },
        {
            code: `
                class TestClass {
                    private field1 = 'value';
                    protected field2 = 'value';
                }
            `,
            options: [memberOrderingConfig],
        },
        {
            code: `
                class TestClass {
                    private field1 = 'value';
                    public field2 = 'value';
                    protected field3 = 'value';
                }
            `,
            options: [memberOrderingConfig],
        },
        {
            code: `
                class TestClass {
                    private field1 = 'value';
                    protected field2 = 'value';
                    public field3 = 'value';
                }
            `,
            options: [memberOrderingConfig],
        },
        {
            code: `
                class TestClass {
                    private field1 = 'value';
                    public field2 = 'value';
                    protected field3 = 'value';
                    public field4 = 'value';
                }
            `,
            options: [memberOrderingConfig],
        },
        {
            code: `
                class TestClass {
                    private field1 = 'value';
                    protected field2 = 'value';
                    public field3 = 'value';
                    protected field4 = 'value';
                }
            `,
            options: [memberOrderingConfig],
        },
    ],
});
