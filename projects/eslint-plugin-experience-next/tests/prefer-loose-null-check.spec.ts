import {rule} from '../rules/recommended/prefer-loose-null-check';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@typescript-eslint/parser')},
});

ruleTester.run('prefer-loose-null-check', rule, {
    invalid: [
        // ── !== ───────────────────────────────────────────────────────────────

        // Standalone x !== null / x !== undefined
        {
            code: 'x !== null',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x != null',
        },
        {
            code: 'null !== x',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x != null',
        },
        {
            code: 'x !== undefined',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x != null',
        },
        {
            code: 'undefined !== x',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x != null',
        },
        // Combined !== pair → single != null
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
            code: 'null !== x && undefined !== x',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x != null',
        },
        // !== in chains with unrelated conditions
        {
            code: "x !== null && b == 'c'",
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: "x != null && b == 'c'",
        },
        {
            code: "x !== undefined && b == 'c'",
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: "x != null && b == 'c'",
        },
        {
            code: "b == 'c' && x !== null",
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: "b == 'c' && x != null",
        },
        {
            code: "x !== null && b == 'c' && x !== undefined",
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: "x != null && b == 'c'",
        },
        // Multiple pairs in one chain
        {
            code: 'a !== null && a !== undefined && b !== null && b !== undefined',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'a != null && b != null',
        },
        // Mixed pair + standalone
        {
            code: 'x !== null && y !== null && y !== undefined',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x != null && y != null',
        },
        // In if condition
        {
            code: 'if (x !== null && x !== undefined) {}',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'if (x != null) {}',
        },
        {
            code: 'if (x !== null) {}',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'if (x != null) {}',
        },
        // Member expression
        {
            code: 'obj.value !== null && obj.value !== undefined',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'obj.value != null',
        },

        // ── === ───────────────────────────────────────────────────────────────

        // Standalone x === null / x === undefined
        {
            code: 'x === null',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x == null',
        },
        {
            code: 'null === x',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x == null',
        },
        {
            code: 'x === undefined',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x == null',
        },
        {
            code: 'undefined === x',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'x == null',
        },
        // Combined === pair → single == null
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
        // === in chains with unrelated conditions
        {
            code: "x === null && b == 'c'",
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: "x == null && b == 'c'",
        },
        {
            code: "x === undefined && b == 'c'",
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: "x == null && b == 'c'",
        },
        {
            code: "x === null && b == 'c' && x === undefined",
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: "x == null && b == 'c'",
        },
        // In if condition
        {
            code: 'if (x === null) {}',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'if (x == null) {}',
        },
        {
            code: 'if (x === undefined) {}',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'if (x == null) {}',
        },
        // Member expression
        {
            code: 'obj.value === null && obj.value === undefined',
            errors: [{messageId: 'preferLooseNullCheck'}],
            output: 'obj.value == null',
        },
    ],
    valid: [
        {code: 'x != null'},
        {code: 'x == null'},
        {code: 'x != null && x > 0'},
        {code: 'x == null && doSomething()'},
        {code: 'a > 0 && b < 10'},
    ],
});
