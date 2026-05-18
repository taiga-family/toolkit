import {rule} from '../rules/recommended/at-compat';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {
            project:
                './projects/eslint-plugin-experience-next/tests/fixtures/at-compat/tsconfig.es2022-es2021-lib.json',
            tsconfigRootDir: process.cwd(),
        },
    },
});

const filename =
    'projects/eslint-plugin-experience-next/tests/fixtures/at-compat/es2022.ts';

ruleTester.run('at-compat with ES2022 target and ES2021 lib', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values.at(2);
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            filename,
            output: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values[2];
            `,
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values[2];
            `,
            filename,
        },
    ],
});
