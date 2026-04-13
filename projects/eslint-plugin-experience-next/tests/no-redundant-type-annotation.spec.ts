import {rule} from '../rules/no-redundant-type-annotation';
import {RuleTester} from '@typescript-eslint/rule-tester';

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
        {
            code: /* TypeScript */ `
                type SelectionRange = readonly [from: number, to: number];
                interface ElementState {
                    readonly value: string;
                    readonly selection: SelectionRange;
                }
                declare const state: ElementState;
                declare const flag: boolean;
                const initialElementState: ElementState = flag
                    ? {value: 'test', selection: [0, 0]}
                    : state;
            `,
            errors: [{messageId: 'redundantTypeAnnotation'}],
            options: [{ignoreTupleContextualTyping: false}],
            output: /* TypeScript */ `
                type SelectionRange = readonly [from: number, to: number];
                interface ElementState {
                    readonly value: string;
                    readonly selection: SelectionRange;
                }
                declare const state: ElementState;
                declare const flag: boolean;
                const initialElementState = flag
                    ? {value: 'test', selection: [0, 0]}
                    : state;
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
            code: /* TypeScript */ `
                function getValue<T>(): T {
                    return undefined as any;
                }

                const value: number = getValue();
            `,
        },
        {
            code: /* TypeScript */ `
                declare const node: unknown;

                const decorators: any[] = Array.from((node as any).decorators ?? []);
            `,
        },
        {
            code: /* TypeScript */ `
                const EMPTY_COORDINATES: [number, number] = [0, 0];
            `,
        },
        {
            code: /* TypeScript */ `
                type SelectionRange = readonly [from: number, to: number];
                interface ElementState {
                    readonly value: string;
                    readonly selection: SelectionRange;
                }
                declare const state: ElementState;
                declare const flag: boolean;
                const initialElementState: ElementState = flag
                    ? {value: 'test', selection: [0, 0]}
                    : state;
            `,
        },
        {
            code: /* TypeScript */ `
                type SelectionRange = readonly [from: number, to: number];
                interface ElementState {
                    readonly value: string;
                    readonly selection: SelectionRange;
                }
                const initialElementState: ElementState = {
                    value: 'test',
                    selection: [0, 0],
                };
            `,
        },
        {
            code: /* TypeScript */ `
                export const projectRoot: () => string = () =>
                    process.env['ROOT_PATH'] || '/';
            `,
        },
        {
            code: /* TypeScript */ `
                export const getRoot: () => string = function () {
                    return process.env['ROOT_PATH'] || '/';
                };
            `,
        },
    ],
});
