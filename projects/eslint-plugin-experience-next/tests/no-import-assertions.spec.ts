import {rule} from '../rules/recommended/no-import-assertions';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {ecmaVersion: 'latest', sourceType: 'module'},
    },
});

ruleTester.run('no-import-assertions', rule, {
    invalid: [
        {
            code: "import data from './file.json' assert {type: 'json'};",
            errors: [{messageId: 'useWithImportAttributes'}],
            output: "import data from './file.json' with {type: 'json'};",
        },
        {
            code: "import data from './file.json' assert { type: 'json' };",
            errors: [{messageId: 'useWithImportAttributes'}],
            output: "import data from './file.json' with { type: 'json' };",
        },
    ],
    valid: [
        {code: "import data from './file.json' with {type: 'json'};"},
        {code: "import {value} from './file';"},
    ],
});
