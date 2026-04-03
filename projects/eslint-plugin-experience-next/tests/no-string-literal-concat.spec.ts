import {rule} from '../rules/no-string-literal-concat';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {projectService: {allowDefaultProject: ['*.ts*']}},
    },
});

ruleTester.run('no-string-literal-concat', rule, {
    invalid: [
        // Literal + literal: merge
        {
            code: "'foo' + 'bar'",
            errors: [{messageId: 'mergeLiterals'}],
            output: "'foobar'",
        },
        {
            code: '"foo" + "bar"',
            errors: [{messageId: 'mergeLiterals'}],
            output: "'foobar'",
        },
        {
            code: "'foo' + 'bar' + 'baz'",
            errors: [{messageId: 'mergeLiterals'}],
            output: "'foobarbaz'",
        },
        {
            code: /* TypeScript */ `
                it(
                    'TuiDay if {month: -1} was passed (for the last day of month,' +
                        'when the current month has less days than the final month)',
                    () => {},
                );
            `,
            errors: [{messageId: 'mergeLiterals'}],
            output: `
                it(
                    'TuiDay if {month: -1} was passed (for the last day of month,when the current month has less days than the final month)',
                    () => {},
                );
            `,
        },
        {
            code: String.raw`'it\'s' + ' done'`,
            errors: [{messageId: 'mergeLiterals'}],
            output: '"it\'s done"',
        },
        {
            code: String.raw`'line1\n' + 'line2'`,
            errors: [{messageId: 'mergeLiterals'}],
            output: String.raw`'line1\nline2'`,
        },
        // Variable + variable: use template literal
        {
            code: /* TypeScript */ `
                const a: string = 'hello';
                const b: string = 'world';
                const c = a + b;
            `,
            errors: [{messageId: 'useTemplate'}],
            output: /* TypeScript */ `
                const a: string = 'hello';
                const b: string = 'world';
                const c = \`\${a}\${b}\`;
            `,
        },
        {
            code: /* TypeScript */ `
                const a = 'hello';
                const b = 'world';
                const c = a + b;
            `,
            errors: [{messageId: 'useTemplate'}],
            output: /* TypeScript */ `
                const a = 'hello';
                const b = 'world';
                const c = \`\${a}\${b}\`;
            `,
        },
        {
            code: /* TypeScript */ `
                const a = 'hello';
                const b = 'world';
                const c = a + b + a;
            `,
            errors: [{messageId: 'useTemplate'}],
            output: /* TypeScript */ `
                const a = 'hello';
                const b = 'world';
                const c = \`\${a}\${b}\${a}\`;
            `,
        },
    ],
    valid: [
        {code: "'foobar'"},
        {code: 'a + b'},
        {code: "'foo' + a"},
        {code: "a + 'foo'"},
        {code: /* TypeScript */ '`foo` + `bar`'},
        {code: '1 + 2'},
        {
            code: /* TypeScript */ `
                const a: number = 1;
                const b: number = 2;
                const c = a + b;
            `,
        },
    ],
});
