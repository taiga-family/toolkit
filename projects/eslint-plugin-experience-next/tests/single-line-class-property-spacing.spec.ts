import {rule} from '../rules/recommended/single-line-class-property-spacing';

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

ruleTester.run('single-line-class-property-spacing', rule, {
    invalid: [
        {
            code: `
                class TestClass {
                    protected readonly template = import('./template.md?raw');

                    protected readonly component = import('./component.md?raw');
                }
            `,
            errors: [{messageId: 'unexpectedBlankLineBeforeNextSingleLineField'}],
            output: `
                class TestClass {
                    protected readonly template = import('./template.md?raw');
                    protected readonly component = import('./component.md?raw');
                }
            `,
        },
        {
            code: `
                abstract class TestClass {
                    public readonly template = import('./template.md?raw');

                    protected readonly component = import('./component.md?raw');

                    private readonly styles = import('./styles.less.md?raw');

                    readonly #icons = import('./icons.json.md?raw');

                    public abstract markdown: string;
                }
            `,
            errors: [
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineField'},
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineField'},
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineField'},
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineField'},
            ],
            output: `
                abstract class TestClass {
                    public readonly template = import('./template.md?raw');
                    protected readonly component = import('./component.md?raw');
                    private readonly styles = import('./styles.less.md?raw');
                    readonly #icons = import('./icons.json.md?raw');
                    public abstract markdown: string;
                }
            `,
        },
        {
            code: `
                class TestClass {
                    protected readonly template = import('./template.md?raw');
                    protected readonly component = import('./component.md?raw');
                    protected readonly exampleIcons = import(
                        './angular-to-long-text-for-prettier.json.md?raw'
                    );
                }
            `,
            errors: [{messageId: 'missingBlankLineBeforeMultilineProperty'}],
            output: `
                class TestClass {
                    protected readonly template = import('./template.md?raw');
                    protected readonly component = import('./component.md?raw');

                    protected readonly exampleIcons = import(
                        './angular-to-long-text-for-prettier.json.md?raw'
                    );
                }
            `,
        },
        {
            code: `
                class TestClass {
                    protected readonly template = import('./template.md?raw');
                    protected readonly exampleIcons = import(
                        './angular-to-long-text-for-prettier.json.md?raw'
                    );
                    protected readonly template2 = import('./template-2.md?raw');
                }
            `,
            errors: [
                {messageId: 'missingBlankLineBeforeMultilineProperty'},
                {messageId: 'missingBlankLineAfterMultilineProperty'},
            ],
            output: `
                class TestClass {
                    protected readonly template = import('./template.md?raw');

                    protected readonly exampleIcons = import(
                        './angular-to-long-text-for-prettier.json.md?raw'
                    );

                    protected readonly template2 = import('./template-2.md?raw');
                }
            `,
        },
        {
            code: `
                class TestClass {
                    protected readonly template = import('./template.md?raw');

                    protected readonly exampleIcons = import(
                        './angular-to-long-text-for-prettier.json.md?raw'
                    );
                    protected readonly exampleIcons2 = import(
                        './angular-to-long-text-for-prettier-2.json.md?raw'
                    );
                }
            `,
            errors: [{messageId: 'missingBlankLineAfterMultilineProperty'}],
            output: `
                class TestClass {
                    protected readonly template = import('./template.md?raw');

                    protected readonly exampleIcons = import(
                        './angular-to-long-text-for-prettier.json.md?raw'
                    );

                    protected readonly exampleIcons2 = import(
                        './angular-to-long-text-for-prettier-2.json.md?raw'
                    );
                }
            `,
        },
        {
            code: `
                export default class TuiEditorStarter {
                    protected readonly template = import('./import/template.md?raw');

                    protected readonly component = import('./import/component.md?raw');

                    protected readonly exampleStyles = import('./import/styles.less.md?raw');

                    protected readonly exampleIcons = import('./import/angular.json.md?raw');

                    protected readonly exampleJson = import(
                        './import/angular-to-long-text-for-prettier.json.md?raw'
                    );

                    protected readonly isE2E = inject(TUI_IS_E2E);
                }
            `,
            errors: [
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineField'},
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineField'},
                {messageId: 'unexpectedBlankLineBeforeNextSingleLineField'},
            ],
            output: `
                export default class TuiEditorStarter {
                    protected readonly template = import('./import/template.md?raw');
                    protected readonly component = import('./import/component.md?raw');
                    protected readonly exampleStyles = import('./import/styles.less.md?raw');
                    protected readonly exampleIcons = import('./import/angular.json.md?raw');

                    protected readonly exampleJson = import(
                        './import/angular-to-long-text-for-prettier.json.md?raw'
                    );

                    protected readonly isE2E = inject(TUI_IS_E2E);
                }
            `,
        },
        {
            code: `
                class TestClass {
                    protected readonly template = import('./template.md?raw');
                    get component() { return this.template; }
                    protected readonly styles = import('./styles.less.md?raw');
                    set component(value: Promise<string>) { this.template = value; }
                    protected readonly isE2E = inject(TUI_IS_E2E);
                }
            `,
            errors: [
                {messageId: 'missingBlankLineAroundAccessor'},
                {messageId: 'missingBlankLineAroundAccessor'},
                {messageId: 'missingBlankLineAroundAccessor'},
                {messageId: 'missingBlankLineAroundAccessor'},
            ],
            output: `
                class TestClass {
                    protected readonly template = import('./template.md?raw');

                    get component() { return this.template; }

                    protected readonly styles = import('./styles.less.md?raw');

                    set component(value: Promise<string>) { this.template = value; }

                    protected readonly isE2E = inject(TUI_IS_E2E);
                }
            `,
        },
        {
            code: `
                class TestClass {
                    protected readonly template = import(
                        './template.md?raw'
                    );
                    get component() { return this.template; }
                    protected readonly styles = import(
                        './styles.less.md?raw'
                    );
                }
            `,
            errors: [
                {messageId: 'missingBlankLineAroundAccessor'},
                {messageId: 'missingBlankLineAroundAccessor'},
            ],
            output: `
                class TestClass {
                    protected readonly template = import(
                        './template.md?raw'
                    );

                    get component() { return this.template; }

                    protected readonly styles = import(
                        './styles.less.md?raw'
                    );
                }
            `,
        },
    ],
    valid: [
        {
            code: `
                class TestClass {
                    protected readonly template = import('./template.md?raw');
                    protected readonly component = import('./component.md?raw');

                    protected readonly exampleIcons = import(
                        './angular-to-long-text-for-prettier.json.md?raw'
                    );

                    protected readonly isE2E = inject(TUI_IS_E2E);
                }
            `,
        },
        {
            code: `
                class TestClass {
                    protected readonly template = import('./template.md?raw');

                    protected readonly exampleIcons = import(
                        './angular-to-long-text-for-prettier.json.md?raw'
                    );
                }
            `,
        },
        {
            code: `
                abstract class TestClass {
                    public readonly template = import('./template.md?raw');
                    protected readonly component = import('./component.md?raw');
                    private readonly styles = import('./styles.less.md?raw');
                    readonly #icons = import('./icons.json.md?raw');
                    public abstract markdown: string;

                    get component() { return this.template; }

                    set component(value: Promise<string>) { this.template = value; }

                    protected readonly isE2E = inject(TUI_IS_E2E);
                }
            `,
        },
        {
            code: `
                class TestClass {
                    protected readonly template = import('./template.md?raw');
                    // keep the explanatory comment next to the next field
                    protected readonly component = import('./component.md?raw');
                }
            `,
        },
    ],
});
