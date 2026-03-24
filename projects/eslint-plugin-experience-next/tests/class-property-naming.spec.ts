import rule from '../rules/class-property-naming';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {projectService: {allowDefaultProject: ['*.ts*']}},
    },
});

ruleTester.run('class-property-naming', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
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
            output: /* TypeScript */ `
                class Test {
                    el: Element;
                }
            `,
        },
        {
            code: /* TypeScript */ `
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
            output: /* TypeScript */ `
                class Test {
                    win: Window;
                }
            `,
        },
        {
            code: /* TypeScript */ `
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
            output: /* TypeScript */ `
                class Test {
                    doc: Document;
                }
            `,
        },
        {
            code: /* TypeScript */ `
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
            output: /* TypeScript */ `
                class Test {
                    el?: Element | undefined;
                }
            `,
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
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
            code: /* TypeScript */ `
                class Test {
                    element: string; // Not matching our types
                    window: number; // Not matching our types
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
            code: /* TypeScript */ `
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
