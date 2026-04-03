import parser from '@typescript-eslint/parser';

import {rule} from '../rules/no-string-literal-concat';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser,
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
        // Concat as direct template expression: inline into outer template
        {
            code: /* TypeScript */ `
                const a: string = 'hello';
                const b: string = 'world';
                const c = \`\${a + b}\`;
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
                const a: string = 'hello';
                const b: string = 'world';
                const c = \`prefix \${a + b} suffix\`;
            `,
            errors: [{messageId: 'useTemplate'}],
            output: /* TypeScript */ `
                const a: string = 'hello';
                const b: string = 'world';
                const c = \`prefix \${a}\${b} suffix\`;
            `,
        },
        {
            code: /* TypeScript */ `
                const a: string = 'hello';
                const b: string = 'world';
                const c = \`\${x}\${a + b}\${y}\`;
            `,
            errors: [{messageId: 'useTemplate'}],
            output: /* TypeScript */ `
                const a: string = 'hello';
                const b: string = 'world';
                const c = \`\${x}\${a}\${b}\${y}\`;
            `,
        },
        // Literal concat as direct template expression: merge into quasi
        {
            code: "`${'hello' + ' world'}`",
            errors: [{messageId: 'mergeLiterals'}],
            output: '`hello world`',
        },
        {
            code: "`prefix${'foo' + 'bar'}suffix`",
            errors: [{messageId: 'mergeLiterals'}],
            output: '`prefixfoobarsuffix`',
        },
        // Nested template literal: flatten into parent
        {
            code: '`${`${dateMode}${dateTimeSeparator}`}HH:MM`',
            errors: [{messageId: 'flattenTemplate'}],
            output: '`${dateMode}${dateTimeSeparator}HH:MM`',
        },
        {
            code: '`outer${`${a}${b}`}rest`',
            errors: [{messageId: 'flattenTemplate'}],
            output: '`outer${a}${b}rest`',
        },
        {
            code: '`${`hello`}world`',
            errors: [{messageId: 'flattenTemplate'}],
            output: '`helloworld`',
        },
        {
            code: '`${`${a}`}`',
            errors: [{messageId: 'flattenTemplate'}],
            output: '`${a}`',
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
        // Concat nested inside a template expression (not direct child) — would
        // produce ugly nested templates like \`\${\`\${a}\${b}\`.method()}\`, so skip
        {
            code: /* TypeScript */ `
                const a: string = 'hello';
                const b: string = 'world';
                const c = \`\${(a + b).toLowerCase()}\`;
            `,
        },
        {
            code: /* TypeScript */ `
                const a: string = 'hello';
                const b: string = 'world';
                const c = \`prefix\${someFunc(a + b)}suffix\`;
            `,
        },
        // Concatenation with inline comments — must not be touched
        {
            code: /* TypeScript */ `
                const re =
                    String.raw\`^([a-zA-Z]+:\\/\\/)?\` + // protocol
                    String.raw\`((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|localhost)\` + // domain
                    String.raw\`(\\:\\d+)?(\\/[-a-z\\d%_.~+\\:]*)*\`; // port and path
            `,
        },
        // Tagged nested template — must not be touched
        {code: 'html`${css`color: red`}`'},
        {
            code: /* TypeScript */ `
                const link: string = 'https://example.com';
                const pkg: string = 'myPkg';
                const header: string = 'MyComponent';
                const result = \`\${link}/\${pkg.toLowerCase()}/src/\${(header.slice(0, 1).toLowerCase() + header.slice(1)).replaceAll(/[A-Z]/g, (m) => \`-\${m.toLowerCase()}\`)}\`;
            `,
        },
    ],
});
