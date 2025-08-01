// @ts-ignore, cannot find module @typescript-eslint/parser or its corresponding type declarations
import * as tsParser from '@typescript-eslint/parser';
import {RuleTester} from 'eslint';

import rule from '../rules/standalone-imports-sort';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsParser,
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
