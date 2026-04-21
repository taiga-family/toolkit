import {rule} from '../rules/recommended/injection-token-description';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
        },
    },
});

ruleTester.run('injection-token-description', rule, {
    invalid: [
        {
            code: /* TypeScript */ "const TEST_TOKEN = new InjectionToken('some description');",
            errors: [{messageId: 'invalid-injection-token-description'}],
            output: /* TypeScript */ "declare const ngDevMode: boolean;\n\nconst TEST_TOKEN = new InjectionToken(ngDevMode ? '[TEST_TOKEN]: some description' : '');",
        },
        {
            code: /* TypeScript */ 'const SERVICE_TOKEN = new InjectionToken(`some ${variable} description`);',
            errors: [{messageId: 'invalid-injection-token-description'}],
            output: /* TypeScript */ `declare const ngDevMode: boolean;

const SERVICE_TOKEN = new InjectionToken(ngDevMode ? \`[SERVICE_TOKEN]: some \${variable} description\` : '');`,
        },
        {
            code: /* TypeScript */ "import {InjectionToken} from '@angular/core';\n\nexport const TUI_ICON_START = new InjectionToken('Token', {\n    factory: () => '',\n});",
            errors: [{messageId: 'invalid-injection-token-description'}],
            output: /* TypeScript */ "import {InjectionToken} from '@angular/core';\n\ndeclare const ngDevMode: boolean;\n\nexport const TUI_ICON_START = new InjectionToken(ngDevMode ? '[TUI_ICON_START]: Token' : '', {\n    factory: () => '',\n});",
        },
        {
            code: /* TypeScript */ "declare const ngDevMode: boolean;\n\nconst TUI_ICON_START = new InjectionToken(ngDevMode ? 'Token' : '', {\n    factory: () => '',\n});",
            errors: [{messageId: 'invalid-injection-token-description'}],
            output: /* TypeScript */ "declare const ngDevMode: boolean;\n\nconst TUI_ICON_START = new InjectionToken(ngDevMode ? '[TUI_ICON_START]: Token' : '', {\n    factory: () => '',\n});",
        },
    ],
    valid: [
        {
            code: /* TypeScript */ "const TEST_TOKEN = new InjectionToken('[TEST_TOKEN]: some description');",
        },
        {
            code: /* TypeScript */ "const testToken = new InjectionToken('testToken description');",
        },
        {
            code: /* TypeScript */ "const MY_SERVICE_TOKEN = new InjectionToken('Service for MY_SERVICE_TOKEN');",
        },
        {
            code: /* TypeScript */ 'const API_TOKEN = new InjectionToken(`[API_TOKEN]: ${someVar}`);',
        },
        {
            code: /* TypeScript */ "export const TUI_ICON_START = new InjectionToken(\n    ngDevMode ? 'TUI_ICON_START' : '',\n    {\n        factory: () => '',\n    },\n);",
        },
        {
            code: /* TypeScript */ "export const TUI_ICON_START = new InjectionToken(\n    ngDevMode ? '[TUI_ICON_START]: hello' : '',\n    {\n        factory: () => '',\n    },\n);",
        },
        {code: /* TypeScript */ "new InjectionToken('some description');"},
    ],
});
