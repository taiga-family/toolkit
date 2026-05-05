import {rule} from '../rules/recommended/prefer-conditional-return';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {parser: require('@typescript-eslint/parser')},
});

ruleTester.run('prefer-conditional-return', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                function next(): IteratorResult<number> {
                    if (index < count) {
                        return {value: index++, done: false};
                    }

                    return {value: undefined, done: true};
                }
            `,
            errors: [{messageId: 'preferConditionalReturn'}],
            output: /* TypeScript */ `
                function next(): IteratorResult<number> {
                    return index < count
                        ? {value: index++, done: false}
                        : {value: undefined, done: true};
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getValue() {
                    if (isReady) {
                        return value;
                    }

                    return fallback;
                }
            `,
            errors: [{messageId: 'preferConditionalReturn'}],
            output: /* TypeScript */ `
                function getValue() {
                    return isReady ? value : fallback;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getValue() {
                    if (enabled) return primary;

                    return fallback;
                }
            `,
            errors: [{messageId: 'preferConditionalReturn'}],
            output: /* TypeScript */ `
                function getValue() {
                    return enabled ? primary : fallback;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getValue() {
                    if (first ? second : third) {
                        return value as Result;
                    }

                    return fallback;
                }
            `,
            errors: [{messageId: 'preferConditionalReturn'}],
            output: /* TypeScript */ `
                function getValue() {
                    return (first ? second : third) ? (value as Result) : fallback;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getValue() {
                    if (isReady) {
                        return value as Result;
                    }

                    return fallback;
                }
            `,
            errors: [{messageId: 'preferConditionalReturn'}],
            output: /* TypeScript */ `
                function getValue() {
                    return isReady ? (value as Result) : fallback;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getValue(type: string) {
                    switch (type) {
                        case 'primary':
                            if (isReady) {
                                return value;
                            }

                            return fallback;
                        default:
                            return null;
                    }
                }
            `,
            errors: [{messageId: 'preferConditionalReturn'}],
            output: /* TypeScript */ `
                function getValue(type: string) {
                    switch (type) {
                        case 'primary':
                            return isReady ? value : fallback;
                        default:
                            return null;
                    }
                }
            `,
        },
        {
            code: /* TypeScript */ `
                if (isReady) {
                    return value;
                }

                return fallback;
            `,
            errors: [{messageId: 'preferConditionalReturn'}],
            languageOptions: {parserOptions: {sourceType: 'script'}},
            output: /* TypeScript */ `
                return isReady ? value : fallback;
            `,
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                function getValue() {
                    if (condition) {
                        return first;
                    }

                    return second ? third : fourth;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getValue() {
                    if (condition) {
                        return first;
                    }

                    return (second ? third : fourth) as Result;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getValue() {
                    if (isReady) {
                        return first ? second : third;
                    }

                    return fallback;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getValue() {
                    if (isReady) {
                        return (first ? second : third) as Result;
                    }

                    return fallback;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getValue() {
                    if (condition) {
                        return;
                    }

                    return fallback;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getValue() {
                    if (condition) {
                        return value;
                    }

                    return;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getValue() {
                    if (condition) {
                        return value;
                    } else {
                        return fallback;
                    }

                    return next;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getValue() {
                    if (condition) {
                        return value;
                    }

                    track();

                    return fallback;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getValue() {
                    if (condition) {
                        return value;
                    }

                    // keep this branch separate
                    return fallback;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                function getValue() {
                    if (condition) {
                        // keep this explanation near the branch
                        return value;
                    }

                    return fallback;
                }
            `,
        },
    ],
});
