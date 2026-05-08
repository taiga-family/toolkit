import {rule} from '../rules/recommended/no-signal-outside-class';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {projectService: {allowDefaultProject: ['*.ts*']}},
    },
});

ruleTester.run('no-signal-outside-class', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                import {signal} from '@angular/core';
                const count = signal(0);
                class CounterComponent {
                    readonly count = count;
                }
            `,
            errors: [{messageId: 'noSignalOutsideClass'}],
        },
        {
            code: /* TypeScript */ `
                import {computed, signal} from '@angular/core';
                const count = signal(0);
                const doubled = computed(() => count() * 2);
                class CounterComponent {
                    readonly count = count;
                    readonly doubled = doubled;
                }
            `,
            errors: [
                {messageId: 'noSignalOutsideClass'},
                {messageId: 'noSignalOutsideClass'},
            ],
        },
        {
            code: /* TypeScript */ `
                import {signal} from '@angular/core';
                const showLabels = signal(true);
                class CardComponent {
                    protected readonly showLabels = showLabels;
                }
            `,
            errors: [{messageId: 'noSignalOutsideClass'}],
        },
        {
            code: /* TypeScript */ `
                import {signal as sig} from '@angular/core';
                const count = sig(0);
                class CounterComponent {
                    readonly count = count;
                }
            `,
            errors: [{messageId: 'noSignalOutsideClass'}],
        },
        {
            code: /* TypeScript */ `
                import {signal} from '@angular/core';
                export const count = signal(0);
                class CounterComponent {
                    readonly count = count;
                }
            `,
            errors: [{messageId: 'noSignalOutsideClass'}],
        },
        {
            code: /* TypeScript */ `
                import {signal} from '@angular/core';
                const count = signal(0) as unknown;
                class CounterComponent {
                    readonly count = count as unknown;
                }
            `,
            errors: [{messageId: 'noSignalOutsideClass'}],
        },
        {
            code: /* TypeScript */ `
                import {signal} from '@angular/core';
                // prettier-ignore
                const count = (signal(0));
                class CounterComponent {
                    // prettier-ignore
                    readonly count = (count);
                }
            `,
            errors: [{messageId: 'noSignalOutsideClass'}],
        },
        {
            code: /* TypeScript */ `
                import {linkedSignal, signal} from '@angular/core';
                const source = signal(0);
                const linked = linkedSignal(() => source());
                class Foo {
                    readonly linked = linked;
                }
            `,
            errors: [{messageId: 'noSignalOutsideClass'}],
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                import {signal} from '@angular/core';
                class CounterComponent {
                    readonly count = signal(0);
                }
            `,
        },
        {
            code: /* TypeScript */ `
                import {computed, signal} from '@angular/core';
                class CounterService {
                    private readonly count = signal(0);
                    readonly doubled = computed(() => this.count() * 2);
                }
            `,
        },
        {
            code: /* TypeScript */ `
                import {signal} from '@angular/core';
                const count = signal(0);
                class Foo {
                    someMethod() {
                        return count();
                    }
                }
            `,
        },
        {
            code: /* TypeScript */ `
                import {signal} from '@angular/core';
                const count = signal(0);
                class Foo {
                    readonly label = 'hello';
                }
            `,
        },
        {
            code: /* TypeScript */ `
                const count = 0;
                class Foo {
                    readonly count = count;
                }
            `,
        },
        {
            code: /* TypeScript */ `
                import {signal} from 'some-other-lib';
                const count = signal(0);
                class Foo {
                    readonly count = count;
                }
            `,
        },
    ],
});
