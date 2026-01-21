import {rule} from '../rules/injection-token-description';

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
            code: "const TEST_TOKEN = new InjectionToken('some description');",
            errors: [{messageId: 'invalid-injection-token-description'}],
            output: "const TEST_TOKEN = new InjectionToken('[TEST_TOKEN]: some description');",
        },
        {
            code: 'const SERVICE_TOKEN = new InjectionToken(`some ${variable} description`);',
            errors: [{messageId: 'invalid-injection-token-description'}],
            output: 'const SERVICE_TOKEN = new InjectionToken(`[SERVICE_TOKEN]: some ${variable} description`);',
        },
    ],
    valid: [
        {
            code: "const TEST_TOKEN = new InjectionToken('[TEST_TOKEN]: some description');",
        },
        {code: "const testToken = new InjectionToken('testToken description');"},
        {
            code: "const MY_SERVICE_TOKEN = new InjectionToken('Service for MY_SERVICE_TOKEN');",
        },
        {code: 'const API_TOKEN = new InjectionToken(`[API_TOKEN]: ${someVar}`);'},
        {code: "new InjectionToken('some description');"},
    ],
});
