import {rule} from '../rules/recommended/at-compat';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {projectService: {allowDefaultProject: ['*.ts*']}},
    },
});

function withCrLf(value: string): string {
    return value.replaceAll('\n', '\r\n');
}

ruleTester.run('at-compat', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values.at(2);
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values[2];
            `,
        },
        {
            code: /* TypeScript */ `
                const values: ReadonlyArray<string> = ['first', 'second'];

                const value = values.at(-1);
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                const values: ReadonlyArray<string> = ['first', 'second'];

                const value = values[values.length - 1];
            `,
        },
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6] as const;

                const value = values.at(2);
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                const values = [4, 5, 6] as const;

                const value = values[2];
            `,
        },
        {
            code: /* TypeScript */ `
                const values: string[] | null = [];

                const value = values?.['at'](0);
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                const values: string[] | null = [];

                const value = values?.[0];
            `,
        },
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values.at();
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values[0];
            `,
        },
        {
            code: /* TypeScript */ `
                const text = 'Taiga';

                const value = text.at(0);
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                const text = 'Taiga';

                const value = text[0];
            `,
        },
        {
            code: /* TypeScript */ `
                const text = 'Taiga';

                const value = text.at(-1);
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                const text = 'Taiga';

                const value = text[text.length - 1];
            `,
        },
        {
            code: /* TypeScript */ `
                const bytes = new Uint8Array();

                const value = bytes.at(0);
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                const bytes = new Uint8Array();

                const value = bytes[0];
            `,
        },
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values.at(index);
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: null,
        },
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values.at(0, sideEffect());
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: null,
        },
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values.at?.(0);
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: null,
        },
        {
            code: /* TypeScript */ `
                const arrayAt = Array.prototype.at;
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: null,
        },
        {
            code: /* TypeScript */ `
                class MyArray extends Array<number> {}

                const values = new MyArray();
                const value = values.at(0);
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                class MyArray extends Array<number> {}

                const values = new MyArray();
                const value = values[0];
            `,
        },
        {
            code: /* TypeScript */ `
                declare const item: string;

                const romanNumeral = item.split(' ').at(-1)!;
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                declare const item: string;

                const items = item.split(' ');
                const romanNumeral = items[items.length - 1]!;
            `,
        },
        {
            code: withCrLf(/* TypeScript */ `
                declare const item: string;

                const romanNumeral = item.split(' ').at(-1)!;
            `),
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: withCrLf(/* TypeScript */ `
                declare const item: string;

                const items = item.split(' ');
                const romanNumeral = items[items.length - 1]!;
            `),
        },
        {
            code: /* TypeScript */ `
                class Example {
                    protected readonly filter = (
                        items: readonly string[],
                        query: string,
                    ) => {
                        const filtered = items.filter((item) => {
                            const romanNumeral = item.split(' ').at(-1)!;

                            return romanNumeral === query;
                        });

                        return filtered;
                    };
                }
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                class Example {
                    protected readonly filter = (
                        items: readonly string[],
                        query: string,
                    ) => {
                        const filtered = items.filter((item) => {
                            const itemList = item.split(' ');
                            const romanNumeral = itemList[itemList.length - 1]!;

                            return romanNumeral === query;
                        });

                        return filtered;
                    };
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class Example {
                    protected readonly filter = (items: readonly string[]) =>
                        items.map((item) => item.split(' ').at(-1));
                }
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: null,
        },
        {
            code: /* TypeScript */ `
                const getValue = (item: string) => item.split(' ').at(-1);
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: null,
        },
        {
            code: /* TypeScript */ `
                declare const item: string;

                const value = item.split(' ').at(-1) ?? item.split(' ').at(-1);
            `,
            errors: [{messageId: 'atCompatAvoidAt'}, {messageId: 'atCompatAvoidAt'}],
            output: null,
        },
        {
            code: /* TypeScript */ `
                class Example {
                    protected readonly d = {
                        first: ['one'],
                        second: ['two'],
                    };

                    protected value = Object.values(this.d).at(-1) ?? null;
                }
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                class Example {
                    protected readonly d = {
                        first: ['one'],
                        second: ['two'],
                    };

                    protected readonly dValues = Object.values(this.d);

                    protected value = this.dValues[this.dValues.length - 1] ?? null;
                }
            `,
        },
        {
            code: withCrLf(/* TypeScript */ `
                class Example {
                    protected readonly d = {
                        first: ['one'],
                        second: ['two'],
                    };

                    protected value = Object.values(this.d).at(-1) ?? null;
                }
            `),
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: withCrLf(/* TypeScript */ `
                class Example {
                    protected readonly d = {
                        first: ['one'],
                        second: ['two'],
                    };

                    protected readonly dValues = Object.values(this.d);

                    protected value = this.dValues[this.dValues.length - 1] ?? null;
                }
            `),
        },
        {
            code: /* TypeScript */ `
                class Example {
                    protected static readonly d = {
                        first: ['one'],
                        second: ['two'],
                    };

                    protected static v = Object.values(this.d).at(-1) ?? null;
                }
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                class Example {
                    protected static readonly d = {
                        first: ['one'],
                        second: ['two'],
                    };

                    protected static readonly dValues = Object.values(this.d);

                    protected static v = this.dValues[this.dValues.length - 1] ?? null;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class Example {
                    #d = {
                        first: ['one'],
                        second: ['two'],
                    };

                    #value = Object.values(this.#d).at(-1) ?? null;
                }
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                class Example {
                    #d = {
                        first: ['one'],
                        second: ['two'],
                    };

                    #values = Object.values(this.#d);

                    #value = this.#values[this.#values.length - 1] ?? null;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class Example {
                    protected readonly d = {
                        first: ['one'],
                        second: ['two'],
                    };

                    protected value =
                        Object.values(this.d).at(-1) ?? Object.values(this.d).at(-1);
                }
            `,
            errors: [{messageId: 'atCompatAvoidAt'}, {messageId: 'atCompatAvoidAt'}],
            output: null,
        },
        {
            code: /* TypeScript */ `
                class Example {
                    #dValues = [];

                    protected readonly d = {
                        first: ['one'],
                        second: ['two'],
                    };

                    protected value = Object.values(this.d).at(-1) ?? null;
                }
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                class Example {
                    #dValues = [];

                    protected readonly d = {
                        first: ['one'],
                        second: ['two'],
                    };

                    protected readonly dValues2 = Object.values(this.d);

                    protected value = this.dValues2[this.dValues2.length - 1] ?? null;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                class Example {
                    protected readonly dates = ['first', 'second'];
                    protected value = this.dates.at(-1) ?? null;
                }
            `,
            errors: [{messageId: 'atCompatAvoidAt'}],
            output: /* TypeScript */ `
                class Example {
                    protected readonly dates = ['first', 'second'];
                    protected value = this.dates[this.dates.length - 1] ?? null;
                }
            `,
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                const values = [4, 5, 6];

                const value = values[2];
            `,
        },
        {
            code: /* TypeScript */ `
                const lookup = {
                    at(index: number): number {
                        return index;
                    },
                };

                const value = lookup.at(2);
            `,
        },
        {
            code: /* TypeScript */ `
                class Timeline {
                    public at(index: number): number {
                        return index;
                    }
                }

                const value = new Timeline().at(2);
            `,
        },
        {
            code: /* TypeScript */ `
                declare const lookup: {at(index: number): string};

                const value = lookup.at(2);
            `,
        },
        {
            code: /* TypeScript */ `
                declare const value: unknown;

                if (typeof value === 'object' && value !== null && 'at' in value) {
                    value.at;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                declare const values: string[] | {at(index: number): string};

                const value = values.at(0);
            `,
        },
    ],
});
