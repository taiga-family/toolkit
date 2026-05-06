import path from 'node:path';

import {rule} from '../rules/recommended/import-integrity';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const fixtureRoot = path.join(
    process.cwd(),
    'projects/eslint-plugin-experience-next/tests/fixtures/import-integrity',
);

function fixtureFile(name: string): string {
    return path.join(fixtureRoot, name);
}

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {
            ecmaVersion: 'latest',
            projectService: true,
            sourceType: 'module',
            tsconfigRootDir: process.cwd(),
        },
    },
});

ruleTester.run('import-integrity', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                import * as namespaceFixture from './namespace-module';

                namespaceFixture.known();
                namespaceFixture.missing();
            `,
            errors: [
                {
                    data: {
                        memberName: 'missing',
                        moduleSpecifier: './namespace-module',
                        namespaceName: 'namespaceFixture',
                    },
                    messageId: 'unknownNamespaceMember',
                },
            ],
            filename: fixtureFile('namespace-consumer.ts'),
            output: /* TypeScript */ `
                import {known, missing} from './namespace-module';

                known();
                missing();
            `,
        },
        {
            code: /* TypeScript */ `
                import * as namespaceFixture from './namespace-module';

                namespaceFixture.OnlyType;
            `,
            errors: [
                {
                    data: {
                        memberName: 'OnlyType',
                        moduleSpecifier: './namespace-module',
                        namespaceName: 'namespaceFixture',
                    },
                    messageId: 'unknownNamespaceMember',
                },
            ],
            filename: fixtureFile('namespace-consumer.ts'),
            output: /* TypeScript */ `
                import {OnlyType} from './namespace-module';

                OnlyType;
            `,
        },
        {
            code: /* TypeScript */ `
                import {known} from './namespace-module';
                import type {OnlyType} from './namespace-module';

                known();
            `,
            errors: [
                {
                    data: {moduleSpecifier: './namespace-module'},
                    messageId: 'duplicateImport',
                },
                {
                    data: {moduleSpecifier: './namespace-module'},
                    messageId: 'duplicateImport',
                },
            ],
            filename: fixtureFile('namespace-consumer.ts'),
            output: /* TypeScript */ `
                import {known, type OnlyType} from './namespace-module';

                known();
            `,
        },
        {
            code: /* TypeScript */ `
                import type {known} from './namespace-module';
                import {known} from './namespace-module';

                known();
            `,
            errors: [
                {
                    data: {moduleSpecifier: './namespace-module'},
                    messageId: 'duplicateImport',
                },
                {
                    data: {moduleSpecifier: './namespace-module'},
                    messageId: 'duplicateImport',
                },
            ],
            filename: fixtureFile('namespace-consumer.ts'),
            output: /* TypeScript */ `
                import {known} from './namespace-module';

                known();
            `,
        },
        {
            code: /* TypeScript */ `
                import './namespace-module';
                import {known} from './namespace-module';

                known();
            `,
            errors: [
                {
                    data: {moduleSpecifier: './namespace-module'},
                    messageId: 'duplicateImport',
                },
                {
                    data: {moduleSpecifier: './namespace-module'},
                    messageId: 'duplicateImport',
                },
            ],
            filename: fixtureFile('namespace-consumer.ts'),
            output: /* TypeScript */ `
                import {known} from './namespace-module';

                known();
            `,
        },
        {
            code: /* TypeScript */ `
                import * as first from './namespace-module';
                import * as second from './namespace-module';

                first.known();
                second.known();
            `,
            errors: [
                {
                    data: {moduleSpecifier: './namespace-module'},
                    messageId: 'duplicateImport',
                },
                {
                    data: {moduleSpecifier: './namespace-module'},
                    messageId: 'duplicateImport',
                },
            ],
            filename: fixtureFile('namespace-consumer.ts'),
            output: null,
        },
        {
            code: /* TypeScript */ `
                import {self} from './self-import';

                export const value = self;
            `,
            errors: [{messageId: 'selfImport'}],
            filename: fixtureFile('self-import.ts'),
            options: [{checkCycles: false}],
        },
        {
            code: "const self = require('./self-import');",
            errors: [{messageId: 'selfImport'}],
            filename: fixtureFile('self-import.ts'),
        },
        {
            code: /* TypeScript */ `
                import {known} from '././namespace-module';

                known();
            `,
            errors: [
                {
                    data: {
                        moduleSpecifier: '././namespace-module',
                        proposedPath: './namespace-module',
                    },
                    messageId: 'uselessPathSegments',
                },
            ],
            filename: fixtureFile('namespace-consumer.ts'),
            output: /* TypeScript */ `
                import {known} from './namespace-module';

                known();
            `,
        },
        {
            code: /* TypeScript */ `
                import {indexed} from './indexed/index';

                indexed;
            `,
            errors: [
                {
                    data: {
                        moduleSpecifier: './indexed/index',
                        proposedPath: './indexed',
                    },
                    messageId: 'uselessPathSegments',
                },
            ],
            filename: fixtureFile('namespace-consumer.ts'),
            output: /* TypeScript */ `
                import {indexed} from './indexed';

                indexed;
            `,
        },
        {
            code: /* TypeScript */ `
                import {known} from '../import-integrity/namespace-module';

                known();
            `,
            errors: [
                {
                    data: {
                        moduleSpecifier: '../import-integrity/namespace-module',
                        proposedPath: './namespace-module',
                    },
                    messageId: 'uselessPathSegments',
                },
            ],
            filename: fixtureFile('excess-parent-consumer.ts'),
            output: /* TypeScript */ `
                import {known} from './namespace-module';

                known();
            `,
        },
        {
            code: /* TypeScript */ `
                import {cycleB} from './cycle-b';

                export const cycleA = cycleB;
            `,
            errors: [{messageId: 'importCycle'}],
            filename: fixtureFile('cycle-a.ts'),
        },
        {
            code: /* TypeScript */ `
                import {DiCycleBClass} from './di-inject-cycle-b';

                export const token = DiCycleBClass;
            `,
            errors: [{messageId: 'importCycle'}],
            filename: fixtureFile('di-inject-cycle-a.ts'),
        },
        {
            code: /* TypeScript */ `
                import {DiCycleBClass} from './di-inject-cycle-b';

                export class DiCycleAClass {
                    // @ts-ignore
                    readonly b = inject(DiCycleBClass);

                    static readonly exported = DiCycleBClass;
                }
            `,
            errors: [{messageId: 'importCycle'}],
            filename: fixtureFile('di-inject-cycle-a.ts'),
        },
        {
            code: "export {reexportB} from './reexport-b';",
            errors: [{messageId: 'importCycle'}],
            filename: fixtureFile('reexport-a.ts'),
        },
        {
            // barrel-a re-exports barrel-b and barrel-c; barrel-c imports barrel-consumer,
            // which imports back through barrel-a — a barrel-mediated cycle.
            // The fix redirects to the direct source file (barrel-b) to break the cycle.
            code: "import {bValue} from './barrel-a';\nexport const barrelConsumerValue = bValue;",
            errors: [{messageId: 'importCycle'}],
            filename: fixtureFile('barrel-consumer.ts'),
            output: "import {bValue} from './barrel-b';\nexport const barrelConsumerValue = bValue;",
        },
        {
            code: /* TypeScript */ `
                import {cycleB} from './cycle-b';

                export class CycleA {
                    // Static fields are evaluated at class definition time (module load),
                    // so they ARE a runtime cycle edge.
                    static readonly field = cycleB;
                }
            `,
            errors: [{messageId: 'importCycle'}],
            filename: fixtureFile('cycle-a.ts'),
        },
        {
            code: "import bar from './default-bar';",
            errors: [
                {
                    data: {moduleSpecifier: './default-bar'},
                    messageId: 'missingDefaultExport',
                },
            ],
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: "import baz from './default-baz';",
            errors: [
                {
                    data: {moduleSpecifier: './default-baz'},
                    messageId: 'missingDefaultExport',
                },
            ],
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: "import bar from './named-as-default-module';",
            errors: [
                {
                    data: {name: 'bar'},
                    messageId: 'namedAsDefault',
                },
            ],
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: "export {default as bar} from './named-as-default-module';",
            errors: [
                {
                    data: {name: 'bar'},
                    messageId: 'namedAsDefault',
                },
            ],
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: /* TypeScript */ `
                import foo from './named-as-default-module';

                foo.bar;
            `,
            errors: [
                {
                    data: {
                        defaultName: 'foo',
                        memberName: 'bar',
                        moduleSpecifier: './named-as-default-module',
                    },
                    messageId: 'namedAsDefaultMember',
                },
            ],
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: /* TypeScript */ `
                import foo from './named-as-default-module';

                const {bar} = foo;
            `,
            errors: [
                {
                    data: {
                        defaultName: 'foo',
                        memberName: 'bar',
                        moduleSpecifier: './named-as-default-module',
                    },
                    messageId: 'namedAsDefaultMember',
                },
            ],
            filename: fixtureFile('default-consumer.ts'),
        },
    ],
    valid: [
        {
            code: "import foo from './named-as-default-module';",
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: "export {default as foo} from './named-as-default-module';",
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: "import bar from './named-as-default-module';",
            filename: fixtureFile('default-consumer.ts'),
            options: [{checkNamedAsDefault: false}],
        },
        {
            code: /* TypeScript */ `
                import {known} from './namespace-module';
                import type {OnlyType} from './namespace-module';

                known();
            `,
            filename: fixtureFile('namespace-consumer.ts'),
            options: [{checkDuplicateImports: false}],
        },
        {
            code: /* TypeScript */ `
                import './namespace-module?raw';
                import './namespace-module?url';
            `,
            filename: fixtureFile('namespace-consumer.ts'),
        },
        {
            code: /* TypeScript */ `
                import * as namespaceFixture from './namespace-module';
                import {known} from './namespace-module';

                namespaceFixture.known();
                known();
            `,
            filename: fixtureFile('namespace-consumer.ts'),
        },
        {
            code: /* TypeScript */ `
                import {self} from './self-import';

                export const value = self;
            `,
            filename: fixtureFile('self-import.ts'),
            options: [{checkCycles: false, checkSelfImports: false}],
        },
        {
            code: "import './self-import?raw';",
            filename: fixtureFile('self-import.ts'),
        },
        {
            code: "import {indexed} from './indexed';",
            filename: fixtureFile('namespace-consumer.ts'),
        },
        {
            code: "void import('./indexed?raw');",
            filename: fixtureFile('namespace-consumer.ts'),
        },
        {
            code: "void import('./indexed/index?raw');",
            filename: fixtureFile('namespace-consumer.ts'),
        },
        {
            code: "import './indexed/index?raw';",
            filename: fixtureFile('namespace-consumer.ts'),
        },
        {
            code: "import {indexed} from './indexed/index.js';",
            filename: fixtureFile('namespace-consumer.ts'),
        },
        {
            code: "import {indexed} from './indexed/index.ts';",
            filename: fixtureFile('namespace-consumer.ts'),
        },
        {
            code: "void import('./indexed/index.ts?raw');",
            filename: fixtureFile('namespace-consumer.ts'),
        },
        {
            code: "import {indexed} from './indexed/index';",
            filename: fixtureFile('namespace-consumer.ts'),
            options: [{checkUselessPathSegments: false}],
        },
        {
            code: /* TypeScript */ `
                import foo from './named-as-default-module';

                foo.default;
                foo.baz;
            `,
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: /* TypeScript */ `
                import foo from './named-as-default-module';

                foo.bar;
            `,
            filename: fixtureFile('default-consumer.ts'),
            options: [{checkNamedAsDefaultMembers: false}],
        },
        {
            code: /* TypeScript */ `
                import foo from './named-as-default-module';

                function run(foo: {readonly bar: string}): string {
                    return foo.bar;
                }
            `,
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: "import foo from './default-foo';",
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: "import foo from './default-reexport';",
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: "import packageJson from './package.json' with {type: 'json'};\npackageJson.name;",
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: "import * as packageJson from './package.json' with {type: 'json'};\npackageJson.name;",
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: "import externalDefault from 'some-module';",
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: "import bar from './default-bar';",
            filename: fixtureFile('default-consumer.ts'),
            options: [{checkDefaultImports: false}],
        },
        {
            code: /* TypeScript */ `
                import * as namespaceFixture from './namespace-module';

                namespaceFixture.known();
                namespaceFixture['value'];
            `,
            filename: fixtureFile('namespace-consumer.ts'),
        },
        {
            code: /* TypeScript */ `
                import * as namespaceFixture from './namespace-module';

                function run(namespaceFixture: {missing(): void}): void {
                    namespaceFixture.missing();
                }
            `,
            filename: fixtureFile('namespace-consumer.ts'),
        },
        {
            code: /* TypeScript */ `
                import * as namespaceFixture from './namespace-module';

                namespaceFixture.missing();
            `,
            filename: fixtureFile('namespace-consumer.ts'),
            options: [{checkNamespaceMembers: false}],
        },
        {
            code: /* TypeScript */ `
                import {acyclicB} from './acyclic-b';

                export const acyclicA = acyclicB;
            `,
            filename: fixtureFile('acyclic-a.ts'),
        },
        {
            code: /* TypeScript */ `
                import type {TypeOnlyB} from './type-only-b';

                export interface TypeOnlyA {
                    readonly b: TypeOnlyB;
                }
            `,
            filename: fixtureFile('type-only-a.ts'),
        },
        {
            code: /* TypeScript */ `
                import {cycleB} from './cycle-b';

                export const cycleA = cycleB;
            `,
            filename: fixtureFile('cycle-a.ts'),
            options: [{checkCycles: false}],
        },
        {
            code: /* TypeScript */ `
                import {DiCycleBClass} from './di-inject-cycle-b';

                export class DiCycleAClass {
                    // @ts-ignore
                    readonly b = inject(DiCycleBClass);
                }
            `,
            filename: fixtureFile('di-inject-cycle-a.ts'),
        },
        {
            code: /* TypeScript */ `
                import {DiCycleAClass} from './di-inject-cycle-a';

                export class DiCycleBClass {
                    // @ts-ignore
                    readonly children = contentChildren(DiCycleAClass);
                }
            `,
            filename: fixtureFile('di-inject-cycle-b.ts'),
        },
        {
            code: /* TypeScript */ `
                import {DiCycleAClass} from './di-inject-cycle-a';

                export class DiCycleBClass {
                    // @ts-ignore
                    readonly child = viewChild.required(DiCycleAClass);
                }
            `,
            filename: fixtureFile('di-inject-cycle-b.ts'),
        },
        {
            code: /* TypeScript */ `
                import {DiCycleAClass} from './di-inject-cycle-a';

                export class DiCycleBClass {
                    // @ts-ignore
                    readonly children = contentChildren(DiCycleAClass);

                    method(_item: DiCycleAClass): void {}
                }
            `,
            filename: fixtureFile('di-inject-cycle-b.ts'),
        },
        {
            code: /* TypeScript */ `
                import {DiCycleBClass} from './di-inject-cycle-b';

                export class DiCycleAClass {
                    // @ts-ignore
                    readonly b = inject(DiCycleBClass);

                    method(_item: DiCycleBClass): void {}
                }
            `,
            filename: fixtureFile('di-inject-cycle-a.ts'),
        },
        {
            code: /* TypeScript */ `
                import {cycleB} from './cycle-b';

                export const TOKEN = {factory: () => cycleB};
            `,
            filename: fixtureFile('cycle-a.ts'),
        },
        {
            code: /* TypeScript */ `
                import {cycleB} from './cycle-b';

                // @ts-ignore
                @SomeDecorator({providers: [cycleB]})
                export class CycleA {}
            `,
            filename: fixtureFile('cycle-a.ts'),
        },
        {
            code: /* TypeScript */ `
                import {cycleB} from './cycle-b';

                export class CycleA {
                    readonly field = cycleB;
                }
            `,
            filename: fixtureFile('cycle-a.ts'),
        },
        {
            code: /* TypeScript */ `
                import {cycleB} from './cycle-b';

                export class CycleA {
                    method() {
                        return cycleB;
                    }
                }
            `,
            filename: fixtureFile('cycle-a.ts'),
        },
    ],
});
