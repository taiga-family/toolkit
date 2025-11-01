import {rule} from '../rules/strict-tui-doc-example';

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

ruleTester.run('strict-tui-doc-example', rule, {
    invalid: [
        {
            code: `
                class TestComponent {
                    private examples: TuiDocExample = {
                        TypeScript: import('./example.html')
                    };
                }
            `,
            errors: [
                {
                    messageId: 'strict-doc-example-extensions-invalid-value',
                },
            ],
            output: `
                class TestComponent {
                    private examples: TuiDocExample = {
                        TypeScript: import('./example.ts')
                    };
                }
            `,
        },
        {
            code: `
                class TestComponent {
                    private examples: TuiDocExample = {
                        HTML: import('./example.ts')
                    };
                }
            `,
            errors: [
                {
                    messageId: 'strict-doc-example-extensions-invalid-value',
                },
            ],
            output: `
                class TestComponent {
                    private examples: TuiDocExample = {
                        HTML: import('./example.html')
                    };
                }
            `,
        },
        {
            code: `
                class TestComponent {
                    private examples: TuiDocExample = {
                        InvalidKey: import('./example.ts')
                    };
                }
            `,
            errors: [
                {
                    messageId: 'strict-doc-example-extensions-invalid-key',
                },
            ],
        },
        {
            code: `
                class TestComponent {
                    private examples: TuiDocExample = {
                        './components/test.ts': import('./components/test.html')
                    };
                }
            `,
            errors: [
                {
                    messageId: 'strict-doc-example-extensions-invalid-value',
                },
            ],
            output: `
                class TestComponent {
                    private examples: TuiDocExample = {
                        './components/test.ts': import('./components/test.ts')
                    };
                }
            `,
        },
    ],
    valid: [
        {
            code: `
                class TestComponent {
                    private examples = {
                        TypeScript: import('./example.html')
                    };
                }
            `,
        },
        {
            code: `
                class TestComponent {
                    private examples: TuiDocExample = {
                        TypeScript: import('./example.ts')
                    };
                }
            `,
        },
        {
            code: `
                class TestComponent {
                    private examples: TuiDocExample = {
                        HTML: import('./example.html')
                    };
                }
            `,
        },
        {
            code: `
                class TestComponent {
                    private examples: TuiDocExample = {
                        './components/test.ts': import('./components/test.ts')
                    };
                }
            `,
        },
        {
            code: `
                class TestComponent {
                    private examples: TuiDocExample = {
                        TypeScript: import('./example.ts?raw')
                    };
                }
            `,
        },
    ],
});
