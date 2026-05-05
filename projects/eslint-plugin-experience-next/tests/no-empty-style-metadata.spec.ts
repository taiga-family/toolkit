import {rule} from '../rules/recommended/no-empty-style-metadata';

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

ruleTester.run('no-empty-style-metadata', rule, {
    invalid: [
        {
            code: `
                @Component({
                    styles: \`\`,
                    selector: 'app-test',
                })
                class TestClass {}
            `,
            errors: [{messageId: 'noEmptyStyleMetadata'}],
            output: `
                @Component({
                    selector: 'app-test',
                })
                class TestClass {}
            `,
        },
        {
            code: `
                @Component({
                    selector: 'app-test',
                    styleUrl: \`\`
                })
                class TestClass {}
            `,
            errors: [{messageId: 'noEmptyStyleMetadata'}],
            output: `
                @Component({
                    selector: 'app-test'
                })
                class TestClass {}
            `,
        },
        {
            code: `
                @Component({
                    selector: 'app-test',
                    styleUrls: []
                })
                class TestClass {}
            `,
            errors: [{messageId: 'noEmptyStyleMetadata'}],
            output: `
                @Component({
                    selector: 'app-test'
                })
                class TestClass {}
            `,
        },
        {
            code: `
                @Component({styleUrl: ''})
                class TestClass {}
            `,
            errors: [{messageId: 'noEmptyStyleMetadata'}],
            output: `
                @Component({})
                class TestClass {}
            `,
        },
        {
            code: `
                @Component({selector: 'app-test', styleUrl: ''})
                class TestClass {}
            `,
            errors: [{messageId: 'noEmptyStyleMetadata'}],
            output: `
                @Component({selector: 'app-test'})
                class TestClass {}
            `,
        },
        {
            code: `
                @Component({styles: '', selector: 'app-test'})
                class TestClass {}
            `,
            errors: [{messageId: 'noEmptyStyleMetadata'}],
            output: `
                @Component({ selector: 'app-test'})
                class TestClass {}
            `,
        },
        {
            code: `
                @Component({
                    styles: '', selector: 'app-test'
                })
                class TestClass {}
            `,
            errors: [{messageId: 'noEmptyStyleMetadata'}],
            output: `
                @Component({
                     selector: 'app-test'
                })
                class TestClass {}
            `,
        },
        {
            code: `
                @Component({
                    selector: 'app-test', styleUrl: ''})
                class TestClass {}
            `,
            errors: [{messageId: 'noEmptyStyleMetadata'}],
            output: `
                @Component({
                    selector: 'app-test'})
                class TestClass {}
            `,
        },
        {
            code: `
                @Component({
                    selector: 'app-test',
                    styles: '',
                    styleUrl: '',
                    styleUrls: [],
                    template: 'test',
                })
                class TestClass {}
            `,
            errors: [{messageId: 'noEmptyStyleMetadata'}],
            output: `
                @Component({
                    selector: 'app-test',
                    template: 'test',
                })
                class TestClass {}
            `,
        },
    ],
    valid: [
        {
            code: `
                @Component({
                    selector: 'app-test',
                    styles: 'test',
                    styleUrl: 'test.css',
                    styleUrls: ['test.css']
                })
                class TestClass {}
            `,
        },
        {
            code: `
                @Component({
                    selector: 'app-test',
                    styles: \`test\`,
                    styleUrl: \`test.css\`
                })
                class TestClass {}
            `,
        },
        {
            code: `
                @Directive({
                    styleUrls: []
                })
                class TestDirective {}
            `,
        },
    ],
});
