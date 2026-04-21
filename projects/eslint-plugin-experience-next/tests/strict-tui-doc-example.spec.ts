import {rule} from '../rules/taiga-specific/strict-tui-doc-example';

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
            code: /* TypeScript */ `
                class TestComponent {
                    private examples: TuiDocExample = {
                        TypeScript: import('./example.html'),
                    };
                }
            `,
            errors: [{messageId: 'strict-doc-example-extensions-invalid-value'}],
            output: /* TypeScript */ `
                class TestComponent {
                    private examples: TuiDocExample = {
                        TypeScript: import('./example.ts'),
                    };
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class TestComponent {
                    private examples: TuiDocExample = {
                        HTML: import('./example.ts'),
                    };
                }
            `,
            errors: [{messageId: 'strict-doc-example-extensions-invalid-value'}],
            output: /* TypeScript */ `
                class TestComponent {
                    private examples: TuiDocExample = {
                        HTML: import('./example.html'),
                    };
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class TestComponent {
                    private examples: TuiDocExample = {
                        InvalidKey: import('./example.ts'),
                    };
                }
            `,
            errors: [{messageId: 'strict-doc-example-extensions-invalid-key'}],
        },
        {
            code: /* TypeScript */ `
                class TestComponent {
                    private examples: TuiDocExample = {
                        './components/test.ts': import('./components/test.html'),
                    };
                }
            `,
            errors: [{messageId: 'strict-doc-example-extensions-invalid-value'}],
            output: /* TypeScript */ `
                class TestComponent {
                    private examples: TuiDocExample = {
                        './components/test.ts': import('./components/test.ts'),
                    };
                }
            `,
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                class TestComponent {
                    private examples = {
                        TypeScript: import('./example.html'),
                    };
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class TestComponent {
                    private examples: TuiDocExample = {
                        TypeScript: import('./example.ts'),
                    };
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class TestComponent {
                    private examples: TuiDocExample = {
                        HTML: import('./example.html'),
                    };
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class TestComponent {
                    private examples: TuiDocExample = {
                        './components/test.ts': import('./components/test.ts'),
                    };
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class TestComponent {
                    private examples: TuiDocExample = {
                        TypeScript: import('./example.ts?raw'),
                    };
                }
            `,
        },
    ],
});
