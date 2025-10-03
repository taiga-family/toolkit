import {rules} from '@typescript-eslint/eslint-plugin';

import {TUI_MEMBER_ORDERING_CONVENTION} from '../rules/convention';

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

const config = {
    default: TUI_MEMBER_ORDERING_CONVENTION,
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
            options: [config],
        },
        {
            code: `
                class TestClass {
                    protected field1 = 'value';
                    private field2 = 'value';
                }
            `,
            errors: [{messageId: 'incorrectGroupOrder'}],
            options: [config],
        },
        {
            code: `
                class TestClass {
                    @Input() public field1 = 'value';
                    private field2 = 'value';
                }
            `,
            errors: [{messageId: 'incorrectGroupOrder'}],
            options: [config],
        },
        {
            code: `
                class TestClass {
                    @Input() protected field1 = 'value';
                    private field2 = 'value';
                }
            `,
            errors: [{messageId: 'incorrectGroupOrder'}],
            options: [config],
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
            options: [config],
        },
        {
            code: `
                class TestClass {
                    private field1 = 'value';
                    protected field2 = 'value';
                }
            `,
            options: [config],
        },
        {
            code: `
                class TestClass {
                    private field1 = 'value';
                    public field2 = 'value';
                    protected field3 = 'value';
                }
            `,
            options: [config],
        },
        {
            code: `
                class TestClass {
                    private field1 = 'value';
                    protected field2 = 'value';
                    public field3 = 'value';
                }
            `,
            options: [config],
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
            options: [config],
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
            options: [config],
        },
        {
            code: `
                class TestClass {
                    private field1 = 'value';
                    public field2 = 'value';
                    protected field3 = 'value';
                    
                    @Input()
                    public field4 = 'value';
                    
                    @Input()
                    protected field5 = 'value';
                }
            `,
            options: [config],
        },
        {
            code: `
                class TestClass {
                    private field1 = 'value';
                    protected field2 = 'value';
                    public field3 = 'value';
                    
                    @Input()
                    protected field4 = 'value';
                    
                    @Input()
                    public field5 = 'value';
                }
            `,
            options: [config],
        },
        {
            code: `
                class TestClass {
                    private field1 = 'value';
                   
                    @Input()
                    protected field2 = 'value';
                    
                    @Input()
                    public field3 = 'value';
                    
                    public field4 = 'value';
                    protected field5 = 'value';
                    
                }
            `,
            options: [config],
        },
    ],
});
