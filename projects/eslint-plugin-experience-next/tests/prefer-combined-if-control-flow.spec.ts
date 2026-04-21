import {rule} from '../rules/recommended/prefer-combined-if-control-flow';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@typescript-eslint/parser')},
});

ruleTester.run('prefer-combined-if-control-flow', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                if (a || b) {
                    return;
                }

                if (c) {
                    return;
                }
            `,
            errors: [
                {messageId: 'preferCombinedIfControlFlow'},
                {messageId: 'preferCombinedIfControlFlow'},
            ],
            output: /* TypeScript */ `
                if (a || b || c) {
                    return;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                if (a || b) {
                    return x;
                }

                if (c && d) {
                    return x;
                }
            `,
            errors: [
                {messageId: 'preferCombinedIfControlFlow'},
                {messageId: 'preferCombinedIfControlFlow'},
            ],
            output: /* TypeScript */ `
                if (a || b || (c && d)) {
                    return x;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                if (a) {
                    return value;
                }

                if (b && c) {
                    return value;
                }

                if (d) {
                    return value;
                }
            `,
            errors: [
                {messageId: 'preferCombinedIfControlFlow'},
                {messageId: 'preferCombinedIfControlFlow'},
                {messageId: 'preferCombinedIfControlFlow'},
            ],
            output: /* TypeScript */ `
                if (a || (b && c) || d) {
                    return value;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                if (a) return;

                if (b && c) return;
            `,
            errors: [
                {messageId: 'preferCombinedIfControlFlow'},
                {messageId: 'preferCombinedIfControlFlow'},
            ],
            output: /* TypeScript */ `
                if (a || (b && c)) return;
            `,
        },
        {
            code: /* TypeScript */ `
                while (true) {
                    if (a) break;

                    if (b && c) break;
                }
            `,
            errors: [
                {messageId: 'preferCombinedIfControlFlow'},
                {messageId: 'preferCombinedIfControlFlow'},
            ],
            output: /* TypeScript */ `
                while (true) {
                    if (a || (b && c)) break;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                if (isFatal) throw error;

                if (isRecoverable && shouldAbort) throw error;
            `,
            errors: [
                {messageId: 'preferCombinedIfControlFlow'},
                {messageId: 'preferCombinedIfControlFlow'},
            ],
            output: /* TypeScript */ `
                if (isFatal || (isRecoverable && shouldAbort)) throw error;
            `,
        },
        {
            code: /* TypeScript */ `
                outer: while (true) {
                    while (true) {
                        if (a) continue outer;

                        if (b && c) continue outer;
                    }
                }
            `,
            errors: [
                {messageId: 'preferCombinedIfControlFlow'},
                {messageId: 'preferCombinedIfControlFlow'},
            ],
            output: /* TypeScript */ `
                outer: while (true) {
                    while (true) {
                        if (a || (b && c)) continue outer;
                    }
                }
            `,
        },
        {
            code: /* TypeScript */ `
                while (true) {
                    if (a) continue;

                    if (b && c) continue;
                }
            `,
            errors: [
                {messageId: 'preferCombinedIfControlFlow'},
                {messageId: 'preferCombinedIfControlFlow'},
            ],
            output: /* TypeScript */ `
                while (true) {
                    if (a || (b && c)) continue;
                }
            `,
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                if (a || b) {
                    return;
                }

                if (e) {
                    return x;
                }

                if (c) {
                    return;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                if (a || b) {
                    return;
                }

                // something
                console.log('Something');

                if (c) {
                    return;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                if (a) {
                    return value;
                }

                // keep this explanation near the branch
                if (b) {
                    return value;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                if (a) {
                    return value;
                } else {
                    doSomething();
                }

                if (b) {
                    return value;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                while (true) {
                    if (a) break;

                    if (b) throw error;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                loop: while (true) {
                    if (a) break;

                    if (b) break loop;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                while (true) {
                    if (a) continue;

                    if (b) break;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                outer: while (true) {
                    while (true) {
                        if (a) continue;

                        if (b) continue outer;
                    }
                }
            `,
        },
    ],
});
