import {rule} from '../rules/recommended/class-accessibility-spacing';
import {withCrLf} from './utils/line-endings';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
    },
});

ruleTester.run('class-accessibility-spacing', rule, {
    invalid: [
        {
            code: `
                class Example {
                    private foo = 1;
                    protected bar = 2;
                }
            `,
            errors: [{messageId: 'classAccessibilitySpacing'}],
            output: `
                class Example {
                    private foo = 1;

                    protected bar = 2;
                }
            `,
        },
        {
            code: `
                class Example {
                    protected foo(): void {}
                    public bar(): void {}
                }
            `,
            errors: [{messageId: 'classAccessibilitySpacing'}],
            output: `
                class Example {
                    protected foo(): void {}

                    public bar(): void {}
                }
            `,
        },
        {
            code: `
                class Example {
                    #foo = 1;
                    protected bar = 2;
                }
            `,
            errors: [{messageId: 'classAccessibilitySpacing'}],
            output: `
                class Example {
                    #foo = 1;

                    protected bar = 2;
                }
            `,
        },
        {
            code: `
                class Example {
                    private foo = 1;
                    protected bar = 2;
                    public baz = 3;
                }
            `,
            errors: [
                {messageId: 'classAccessibilitySpacing'},
                {messageId: 'classAccessibilitySpacing'},
            ],
            output: `
                class Example {
                    private foo = 1;

                    protected bar = 2;

                    public baz = 3;
                }
            `,
        },
        {
            code: `
                class Example {
                    private constructor() {}
                    protected static create(): Example { return new Example(); }
                }
            `,
            errors: [{messageId: 'classAccessibilitySpacing'}],
            output: `
                class Example {
                    private constructor() {}

                    protected static create(): Example { return new Example(); }
                }
            `,
        },
        {
            code: `
                class Example {
                    private accessor foo = 1;
                    protected get bar(): number { return 2; }
                }
            `,
            errors: [{messageId: 'classAccessibilitySpacing'}],
            output: `
                class Example {
                    private accessor foo = 1;

                    protected get bar(): number { return 2; }
                }
            `,
        },
        {
            code: withCrLf(`
                class Example {
                    private foo = 1;
                    protected bar = 2;
                }
            `),
            errors: [{messageId: 'classAccessibilitySpacing'}],
            output: withCrLf(`
                class Example {
                    private foo = 1;

                    protected bar = 2;
                }
            `),
        },
        {
            code: `
                class Example {
                    private foo = 1;
                    // keep this comment attached to bar
                    protected bar = 2;
                }
            `,
            errors: [{messageId: 'classAccessibilitySpacing'}],
            output: null,
        },
    ],
    valid: [
        {
            code: `
                class Example {
                    private foo = 1;
                    private bar = 2;

                    protected baz = 3;

                    public qux = 4;
                    implicitPublic = 5;
                }
            `,
        },
        {
            code: `
                class Example {
                    #foo = 1;
                    private bar = 2;

                    protected baz = 3;
                }
            `,
        },
        {
            code: `
                class Example {
                    private foo(): void {}
                    private bar(): void {}

                    protected baz(): void {}

                    qux(): void {}
                }
            `,
        },
        {
            code: `
                class Example {
                    protected foo = 1;


                    public bar = 2;
                }
            `,
        },
        {
            code: `
                class Example {
                    public foo = 1;
                    bar = 2;
                }
            `,
        },
        {
            code: `
                abstract class Example {
                    protected abstract foo(): void;
                    protected abstract accessor bar: string;

                    public abstract baz: number;
                }
            `,
        },
        {
            code: `
                class Example {
                    private foo = 1;

                    // keep this comment attached to bar
                    protected bar = 2;
                }
            `,
        },
    ],
});
