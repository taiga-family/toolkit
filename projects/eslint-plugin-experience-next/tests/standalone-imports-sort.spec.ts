import rule from '../rules/standalone-imports-sort';

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

ruleTester.run('standalone-imports-sort', rule, {
    invalid: [
        {
            code: `
                @Component({
                    standalone: true,
                    imports: [RouterModule, CommonModule, FormsModule]
                })
                class TestComponent {}
            `,
            errors: [
                {
                    message:
                        'Order in imports should be [CommonModule, FormsModule, RouterModule]',
                },
            ],
            output: `
                @Component({
                    standalone: true,
                    imports: [CommonModule, FormsModule, RouterModule]
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    standalone: true,
                    imports: [ZModule, AModule, BModule]
                })
                class TestComponent {}
            `,
            errors: [
                {
                    message: 'Order in imports should be [AModule, BModule, ZModule]',
                },
            ],
            output: `
                @Component({
                    standalone: true,
                    imports: [AModule, BModule, ZModule]
                })
                class TestComponent {}
            `,
        },
    ],
    valid: [
        {
            code: `
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    selector: 'app-test'
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    standalone: true,
                    selector: 'app-test'
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    standalone: true,
                    imports: [CommonModule, FormsModule, RouterModule]
                })
                class TestComponent {}
            `,
        },
        {
            code: `
                @Component({
                    standalone: true,
                    imports: [CommonModule]
                })
                class TestComponent {}
            `,
        },
    ],
});
