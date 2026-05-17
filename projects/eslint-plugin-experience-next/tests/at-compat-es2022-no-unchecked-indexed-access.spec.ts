import {rule} from '../rules/recommended/at-compat';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {
            project:
                './projects/eslint-plugin-experience-next/tests/fixtures/at-compat/tsconfig.es2022-no-unchecked-indexed-access.json',
            tsconfigRootDir: process.cwd(),
        },
    },
});

const filename =
    'projects/eslint-plugin-experience-next/tests/fixtures/at-compat/es2022.ts';

ruleTester.run('at-compat with noUncheckedIndexedAccess', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                const rows: number[] = [1, 2, 3];

                const firstRow = rows[0];
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                const rows: number[] = [1, 2, 3];

                const firstRow = rows.at(0);
            `,
        },
        {
            code: /* TypeScript */ `
                const rows: number[] = [1, 2, 3];

                const firstRow = rows[0];

                if (!firstRow) {
                    noop();
                }
            `,
            errors: [{messageId: 'atCompatPreferAt'}],
            filename,
            output: /* TypeScript */ `
                const rows: number[] = [1, 2, 3];

                const firstRow = rows.at(0);

                if (!firstRow) {
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

                const value = values.at(0);
            `,
        },
        {
            code: /* TypeScript */ `
                const DEFAULT: [number, number, number, number] = [0, 0, 0, 1];
                const parsed: number[] = [];

                const color: [number, number, number, number] = [
                    parsed[0] ?? DEFAULT[0],
                    parsed[1] ?? DEFAULT[1],
                    parsed[2] ?? DEFAULT[2],
                    parsed[3] ?? DEFAULT[3],
                ];
            `,
            errors: [
                {messageId: 'atCompatPreferAt'},
                {messageId: 'atCompatPreferAt'},
                {messageId: 'atCompatPreferAt'},
                {messageId: 'atCompatPreferAt'},
            ],
            filename,
            output: /* TypeScript */ `
                const DEFAULT: [number, number, number, number] = [0, 0, 0, 1];
                const parsed: number[] = [];

                const color: [number, number, number, number] = [
                    parsed.at(0) ?? DEFAULT[0],
                    parsed.at(1) ?? DEFAULT[1],
                    parsed.at(2) ?? DEFAULT[2],
                    parsed.at(3) ?? DEFAULT[3],
                ];
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
                const DEFAULT: [number, number, number, number] = [0, 0, 0, 1];

                const alpha = DEFAULT[3];
            `,
            filename,
        },
        {
            code: /* TypeScript */ `
                const event = {data: new Uint8Array()};

                if (event.data[0]) {
                    event.data[0] += 16;
                }
            `,
            filename,
        },
        {
            code: /* TypeScript */ `
                const event = {data: new Uint8Array()};

                if (event.data[2]) {
                    event.data[2] = 0;
                }
            `,
            filename,
        },
    ],
});
