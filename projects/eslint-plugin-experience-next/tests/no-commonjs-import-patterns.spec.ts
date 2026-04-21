import {rule} from '../rules/recommended/no-commonjs-import-patterns';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {ecmaVersion: 'latest', sourceType: 'module'},
    },
});

ruleTester.run('no-commonjs-import-patterns', rule, {
    invalid: [
        {
            code: "import toolkit = require('@taiga-ui/cdk');",
            errors: [{messageId: 'avoidImportEquals'}],
        },
        {
            code: "export import toolkit = require('@taiga-ui/cdk');",
            errors: [{messageId: 'avoidImportEquals'}],
        },
        {
            code: /* TypeScript */ `
                import * as createClient from 'legacy-client';

                createClient();
            `,
            errors: [{messageId: 'avoidCallableNamespaceImport'}],
        },
        {
            code: /* TypeScript */ `
                import * as Service from 'legacy-client';

                new Service();
            `,
            errors: [{messageId: 'avoidCallableNamespaceImport'}],
        },
        {
            code: /* TypeScript */ `
                import * as html from 'legacy-html';

                html\`<div />\`;
            `,
            errors: [{messageId: 'avoidCallableNamespaceImport'}],
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                import client from 'legacy-client';

                client();
            `,
        },
        {
            code: /* TypeScript */ `
                import * as client from 'legacy-client';

                client.run();
            `,
        },
        {
            code: /* TypeScript */ `
                import * as client from 'legacy-client';

                function run(client: () => void): void {
                    client();
                }
            `,
        },
        {
            code: /* TypeScript */ `
                import client = Legacy.Client;

                client.run();
            `,
        },
    ],
});
