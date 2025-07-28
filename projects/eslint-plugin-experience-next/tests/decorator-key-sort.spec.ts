// @ts-ignore, cannot find module @typescript-eslint/parser or its corresponding type declarations
import * as tsParser from '@typescript-eslint/parser';
import {RuleTester} from 'eslint';

import rule from '../rules/decorator-key-sort';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
        },
    },
});

ruleTester.run('decorator-key-sort', rule, {
    invalid: [
        {
            code: `
                @Component({
                    template: 'test',
                    selector: 'app-test'
                })
                class TestClass {}
            `,
            errors: [
                {
                    message:
                        'Incorrect order keys in @Component decorator, please sort by [selector -> template]',
                },
            ],
            options: [
                {
                    Component: ['selector', 'template'],
                },
            ],
            output: `
                @Component({selector: 'app-test',template: 'test'})
                class TestClass {}
            `,
        },
        {
            code: `
                @Component({
                    styleUrls: ['test.css'],
                    selector: 'app-test',
                    template: 'test',
                    extra: 'value'
                })
                class TestClass {}
            `,
            errors: [
                {
                    message:
                        'Incorrect order keys in @Component decorator, please sort by [selector -> template -> styleUrls]',
                },
            ],
            options: [
                {
                    Component: ['selector', 'template', 'styleUrls'],
                },
            ],
            output: `
                @Component({selector: 'app-test',template: 'test',styleUrls: ['test.css'],extra: 'value'})
                class TestClass {}
            `,
        },
    ],
    valid: [
        {
            code: `
                class TestClass {
                    method() {}
                }
            `,
            options: [{}],
        },
        {
            code: `
                @UnknownDecorator({b: 1, a: 2})
                class TestClass {}
            `,
            options: [{}],
        },
        {
            code: `
                @Component({
                    selector: 'app-test',
                    template: 'test',
                    styleUrls: ['test.css']
                })
                class TestClass {}
            `,
            options: [
                {
                    Component: ['selector', 'template', 'styleUrls'],
                },
            ],
        },
        {
            code: `
                @Component({
                    selector: 'app-test',
                    styleUrls: ['test.css']
                })
                class TestClass {}
            `,
            options: [
                {
                    Component: ['selector', 'template', 'styleUrls'],
                },
            ],
        },
    ],
});
