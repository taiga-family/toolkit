import {rule} from '../rules/recommended/at-compat';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {
            project:
                './projects/eslint-plugin-experience-next/tests/fixtures/at-compat/tsconfig.es2022.json',
            tsconfigRootDir: process.cwd(),
        },
    },
});

const filename =
    'projects/eslint-plugin-experience-next/tests/fixtures/at-compat/es2022.ts';

ruleTester.run('at-compat with ES2022 target', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values[2];
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values.at(2)!;
            `,
        },
        {
            code: /* TypeScript */ `
                const rows: number[] = [1, 2, 3];

                const firstRow = rows[0];
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                const rows: number[] = [1, 2, 3];

                const firstRow = rows.at(0)!;
            `,
        },
        {
            code: /* TypeScript */ `
                const values: string[] | null = [];

                const value = values?.[0];
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                const values: string[] | null = [];

                const value = values?.at(0);
            `,
        },
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values[0] ?? 0;
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values.at(0) ?? 0;
            `,
        },
        {
            code: /* TypeScript */ `
                declare const color: readonly number[];
                declare const opacity: number;

                if (color[3] === opacity) {
                    noop();
                }
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                declare const color: readonly number[];
                declare const opacity: number;

                if (color.at(3) === opacity) {
                    noop();
                }
            `,
        },
        {
            code: /* TypeScript */ `
                const values: Array<number | undefined> = [];

                const value = values[0];
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                const values: Array<number | undefined> = [];

                const value = values.at(0)!;
            `,
        },
        {
            code: /* TypeScript */ `
                declare const values: string[] | null;

                const value = (values ?? [])?.[0] ?? null;
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                declare const values: string[] | null;

                const value = (values ?? [])?.at(0) ?? null;
            `,
        },
        {
            code: /* TypeScript */ `
                declare const values: ReadonlyArray<{id: number}> | null;

                const value = (values ?? [])?.[0] ?? null;
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                declare const values: ReadonlyArray<{id: number}> | null;

                const value = (values ?? [])?.at(0) ?? null;
            `,
        },
        {
            code: /* TypeScript */ `
                function getTestFolder(source: string): string {
                    const testFolderMatch = /demo-playwright-tests-(.+?)-/.exec(source);

                    if (testFolderMatch?.[1]) {
                        return testFolderMatch[1];
                    }

                    return '';
                }
            `,
            errors: [{messageId: 'atCompatPreferAt'}, {messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                function getTestFolder(source: string): string {
                    const testFolderMatch = /demo-playwright-tests-(.+?)-/.exec(source);

                    if (testFolderMatch?.at(1)) {
                        return testFolderMatch.at(1)!;
                    }

                    return '';
                }
            `,
        },
        {
            code: /* TypeScript */ `
                const text = 'Taiga';

                const value = text[0];
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                const text = 'Taiga';

                const value = text.at(0)!;
            `,
        },
        {
            code: /* TypeScript */ `
                const text = 'Taiga';

                const value = text[1];
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                const text = 'Taiga';

                const value = text.at(1)!;
            `,
        },
        {
            code: /* TypeScript */ `
                const bytes = new Uint8Array();

                const value = bytes[0];
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                const bytes = new Uint8Array();

                const value = bytes.at(0)!;
            `,
        },
        {
            code: /* TypeScript */ `
                const values = [true, false];

                const value = values[0];
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                const values = [true, false];

                const value = values.at(0)!;
            `,
        },
        {
            code: /* TypeScript */ `
                const values = [{id: 1}];

                const value = values[0];
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                const values = [{id: 1}];

                const value = values.at(0)!;
            `,
        },
        {
            code: `
                const values = [{id: 1}];

                const value = (values[0])!;
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: `
                const values = [{id: 1}];

                const value = (values.at(0))!;
            `,
        },
        {
            code: /* TypeScript */ `
                class MyArray extends Array<number> {}

                const values = new MyArray();
                const value = values[0];
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                class MyArray extends Array<number> {}

                const values = new MyArray();
                const value = values.at(0)!;
            `,
        },
        {
            code: /* TypeScript */ `
                declare function getValues(): string[] | null;

                const values = getValues();

                if (values) {
                    const value = values[0];
                }
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                declare function getValues(): string[] | null;

                const values = getValues();

                if (values) {
                    const value = values.at(0)!;
                }
            `,
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values.at(2);
            `,
            filename,
        },
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values[index];
            `,
            filename,
        },
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values[-1];
            `,
            filename,
        },
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6];

                values[0] = 10;
            `,
            filename,
        },
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6] as const;

                const value = values[0];
            `,
            filename,
        },
        {
            code: /* TypeScript */ `
                const point: [number, number] = [0, 1];

                const x = point[0];
            `,
            filename,
        },
        {
            code: /* TypeScript */ `
                const lookup: Record<number, string> = {};

                const value = lookup[0];
            `,
            filename,
        },
        {
            code: /* TypeScript */ `
                declare const values: string[] | Record<number, string>;

                const value = values[0];
            `,
            filename,
        },
    ],
});
