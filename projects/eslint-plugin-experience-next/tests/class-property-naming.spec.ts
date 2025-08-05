import * as tsParser from '@typescript-eslint/parser';
import {RuleTester} from '@typescript-eslint/rule-tester';

import rule from '../rules/class-property-naming';

const ruleTester = new RuleTester({
    languageOptions: {
        parser: tsParser,
        parserOptions: {
            projectService: {
                allowDefaultProject: ['*.ts*'],
            },
        },
    },
});

ruleTester.run('class-property-naming', rule, {
    invalid: [
        {
            code: `
        class Test {
          element: Element;
        }
      `,
            errors: [{messageId: 'invalidName'}],
            options: [
                [
                    {
                        fieldNames: ['element'],
                        newFieldName: 'el',
                        withTypesSpecifier: ['Element'],
                    },
                ],
            ],
            output: `
        class Test {
          el: Element;
        }
      `,
        },
        {
            code: `
          class Test {
            window: Window;
          }
        `,
            errors: [{messageId: 'invalidName'}],
            options: [
                [
                    {
                        fieldNames: ['window'],
                        newFieldName: 'win',
                        withTypesSpecifier: ['Window'],
                    },
                ],
            ],
            output: `
          class Test {
            win: Window;
          }
        `,
        },
        {
            code: `
          class Test {
            document: Document;
          }
        `,
            errors: [{messageId: 'invalidName'}],
            options: [
                [
                    {
                        fieldNames: ['document'],
                        newFieldName: 'doc',
                        withTypesSpecifier: ['Document'],
                    },
                ],
            ],
            output: `
          class Test {
            doc: Document;
          }
        `,
        },
        {
            code: `
          class Test {
            element?: Element | undefined;
          }
        `,
            errors: [{messageId: 'invalidName'}],
            options: [
                [
                    {
                        fieldNames: ['element'],
                        newFieldName: 'el',
                        withTypesSpecifier: ['Element'],
                    },
                ],
            ],
            output: `
          class Test {
            el?: Element | undefined;
          }
        `,
        },
    ],
    valid: [
        {
            code: `
          class Test {
            el: Element;
            win: Window;
            doc: Document;
          }
        `,
            options: [
                [
                    {
                        fieldNames: ['element'],
                        newFieldName: 'el',
                        withTypesSpecifier: ['Element'],
                    },
                    {
                        fieldNames: ['window'],
                        newFieldName: 'win',
                        withTypesSpecifier: ['Window'],
                    },
                    {
                        fieldNames: ['document'],
                        newFieldName: 'doc',
                        withTypesSpecifier: ['Document'],
                    },
                ],
            ],
        },
        {
            code: `
          class Test {
            element: string; // Not matching our types
            window: number;  // Not matching our types
          }
        `,
            options: [
                [
                    {
                        fieldNames: ['element'],
                        newFieldName: 'el',
                        withTypesSpecifier: ['Element'],
                    },
                    {
                        fieldNames: ['window'],
                        newFieldName: 'win',
                        withTypesSpecifier: ['Window'],
                    },
                    {
                        fieldNames: ['document'],
                        newFieldName: 'doc',
                        withTypesSpecifier: ['Document'],
                    },
                ],
            ],
        },
        {
            code: `
          class Test {
            private el: Element;
            protected win: Window;
            public doc: Document;
          }
        `,
            options: [
                [
                    {
                        fieldNames: ['element'],
                        newFieldName: 'el',
                        withTypesSpecifier: ['Element'],
                    },
                    {
                        fieldNames: ['window'],
                        newFieldName: 'win',
                        withTypesSpecifier: ['Window'],
                    },
                    {
                        fieldNames: ['document'],
                        newFieldName: 'doc',
                        withTypesSpecifier: ['Document'],
                    },
                ],
            ],
        },
    ],
});
