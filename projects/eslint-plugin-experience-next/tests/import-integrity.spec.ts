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
            code: "export {reexportB} from './reexport-b';",
            errors: [{messageId: 'importCycle'}],
            filename: fixtureFile('reexport-a.ts'),
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
            code: "import foo from './default-foo';",
            filename: fixtureFile('default-consumer.ts'),
        },
        {
            code: "import foo from './default-reexport';",
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
    ],
});
