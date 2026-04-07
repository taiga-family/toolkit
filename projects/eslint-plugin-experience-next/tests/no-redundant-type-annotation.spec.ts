import {rule} from '../rules/no-redundant-type-annotation';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {projectService: {allowDefaultProject: ['*.ts*']}},
    },
});

ruleTester.run('no-redundant-type-annotation', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                class MyClass {}
                function create(): MyClass {
                    return new MyClass();
                }
                class Container {
                    x: MyClass = create();
                }
            `,
            errors: [{messageId: 'redundantTypeAnnotation'}],
            output: /* TypeScript */ `
                class MyClass {}
                function create(): MyClass {
                    return new MyClass();
                }
                class Container {
                    x = create();
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class Options {}
                function getOptions(): Options {
                    return new Options();
                }
                class Service {
                    private readonly options: Options = getOptions();
                }
            `,
            errors: [{messageId: 'redundantTypeAnnotation'}],
            output: /* TypeScript */ `
                class Options {}
                function getOptions(): Options {
                    return new Options();
                }
                class Service {
                    private readonly options = getOptions();
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class MyClass {}
                function create(): MyClass {
                    return new MyClass();
                }
                const x: MyClass = create();
            `,
            errors: [{messageId: 'redundantTypeAnnotation'}],
            output: /* TypeScript */ `
                class MyClass {}
                function create(): MyClass {
                    return new MyClass();
                }
                const x = create();
            `,
        },
        {
            code: /* TypeScript */ `
                function getCount(): number {
                    return 42;
                }
                class Counter {
                    count: number = getCount();
                }
            `,
            errors: [{messageId: 'redundantTypeAnnotation'}],
            output: /* TypeScript */ `
                function getCount(): number {
                    return 42;
                }
                class Counter {
                    count = getCount();
                }
            `,
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                class MyClass {}
                function create(): MyClass {
                    return new MyClass();
                }
                class Container {
                    x = create();
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class MyClass {}
                class Container {
                    x: MyClass;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class MyClass {}
                function create(): MyClass {
                    return new MyClass();
                }
                class Container {
                    x: MyClass | null = create();
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class Animal {}
                class Dog extends Animal {}
                function getDog(): Dog {
                    return new Dog();
                }
                class Container {
                    x: Animal = getDog();
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getText(): string {
                    return 'hello';
                }
                class Container {
                    x?: string = getText();
                }
            `,
        },
        {
            // Generic function without explicit type args: T is inferred from the
            // contextual return type of the annotation. Removing the annotation
            // changes T → unknown.
            code: /* TypeScript */ `
                function getValue<T>(): T {
                    return undefined as any;
                }

                const value: number = getValue();
            `,
        },
        {
            // Array.from is generic; without the annotation T → unknown[].
            code: /* TypeScript */ `
                declare const node: unknown;

                const decorators: any[] = Array.from((node as any).decorators ?? []);
            `,
        },
        {
            // Arrow function without its own return type: the variable annotation
            // is the only explicit return type declaration and satisfies
            // @typescript-eslint/explicit-function-return-type via
            // allowTypedFunctionExpressions. Must not be removed.
            code: /* TypeScript */ `
                export const projectRoot: () => string = () =>
                    process.env['ROOT_PATH'] || '/';
            `,
        },
        {
            // Same for function expressions.
            code: /* TypeScript */ `
                export const getRoot: () => string = function () {
                    return process.env['ROOT_PATH'] || '/';
                };
            `,
        },
    ],
});
