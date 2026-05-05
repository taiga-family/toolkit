import {rule} from '../rules/recommended/prefer-loose-null-check';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@typescript-eslint/parser')},
});

ruleTester.run('prefer-loose-null-check', rule, {
    invalid: [
        {
            code: 'x !== null && x !== undefined',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x != null',
        },
        {
            code: 'x !== undefined && x !== null',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x != null',
        },
        {
            code: "x !== null && y === 'C' && x !== undefined",
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: "x != null && y === 'C'",
        },
        {
            code: "x !== undefined && y === 'C' && x !== null",
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: "x != null && y === 'C'",
        },
        {
            code: 'null !== x && undefined !== x',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x != null',
        },
        {
            code: 'x === null && x === undefined',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x == null',
        },
        {
            code: 'x === undefined && x === null',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x == null',
        },
        {
            code: "x === null && y === 'C' && x === undefined",
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: "x == null && y === 'C'",
        },
        {
            code: "x === undefined && y === 'C' && x === null",
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: "x == null && y === 'C'",
        },
        {
            code: 'null === x && undefined === x',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x == null',
        },
        {
            code: 'obj.value !== null && obj.value !== undefined',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'obj.value != null',
        },
        {
            code: 'if (getValue() === null && getValue() === undefined) {}',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'if (getValue() == null) {}',
        },
    ],
    valid: [
        {code: 'x != null'},
        {code: 'x == null'},
        {code: 'x !== null'},
        {code: 'x !== undefined'},
        {code: 'x === null'},
        {code: 'x === undefined'},
        {code: 'x !== null && y !== undefined'},
        {code: 'x === null && y === undefined'},
        {code: 'x !== null && x === undefined'},
        {code: 'x === null || x === undefined'},
        {code: 'a > 0 && b < 10'},
    ],
});
