import {rule} from '../rules/no-side-effects-in-computed';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const PREAMBLE = /* TypeScript */ `
    declare const ɵSIGNAL: unique symbol;
    declare module '@angular/core' {
        interface Signal<T> {
            (): T;
            readonly [ɵSIGNAL]: unknown;
        }
        interface WritableSignal<T> extends Signal<T> {
            set(value: T): void;
            update(updateFn: (value: T) => T): void;
            mutate(mutateFn: (value: T) => void): void;
        }
        function signal<T>(initialValue: T): WritableSignal<T>;
        function computed<T>(computation: () => T): Signal<T>;
        function untracked<T>(nonReactiveReadsFn: () => T): T;
    }
`;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {projectService: {allowDefaultProject: ['*.ts*']}},
    },
});

ruleTester.run('no-side-effects-in-computed', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, signal} from '@angular/core';
                const source = signal(0);
                const target = signal(0);
                const derived = computed(() => {
                    target.set(source() + 1);

                    return target();
                });
                console.log(derived);
            `,
            errors: [{messageId: 'sideEffectInComputed'}],
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, signal, untracked} from '@angular/core';
                const source = signal(0);
                const target = signal(0);
                const derived = computed(() => {
                    untracked(() => {
                        target.update((value) => value + source());
                    });

                    return source();
                });
                console.log(derived);
            `,
            errors: [{messageId: 'sideEffectInComputed'}],
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, signal} from '@angular/core';
                const source = signal(0);
                let cache = 0;
                const derived = computed(() => {
                    cache = source();

                    return cache;
                });
                console.log(derived);
            `,
            errors: [{messageId: 'sideEffectInComputed'}],
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, signal} from '@angular/core';
                const source = signal(0);
                const state = {value: 0};
                const derived = computed(() => {
                    state.value += source();

                    return state.value;
                });
                console.log(derived);
            `,
            errors: [{messageId: 'sideEffectInComputed'}],
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, signal} from '@angular/core';
                class Test {
                    private readonly source = signal(0);
                    private readonly state = {count: 0};

                    readonly derived = computed(() => {
                        delete this.state.count;

                        return this.source();
                    });
                }

                console.log(new Test().derived);
            `,
            errors: [{messageId: 'sideEffectInComputed'}],
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, signal} from '@angular/core';
                const source = signal(0);
                let counter = 0;
                const derived = computed(() => {
                    ++counter;

                    return source() + counter;
                });
                console.log(derived);
            `,
            errors: [{messageId: 'sideEffectInComputed'}],
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, signal} from '@angular/core';
                const source = signal(0);
                let counter = 0;
                const derived = computed(() =>
                    (() => {
                        counter += 1;

                        return source() + counter;
                    })(),
                );
                console.log(derived);
            `,
            errors: [{messageId: 'sideEffectInComputed'}],
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, signal} from '@angular/core';
                const source = signal(0);
                const derived = computed(() => source() * 2);
                console.log(derived);
            `,
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, signal} from '@angular/core';
                const source = signal(0);
                const derived = computed(() => {
                    let total = 0;

                    total += source();
                    total += 1;

                    return total;
                });
                console.log(derived);
            `,
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, signal} from '@angular/core';
                const source = signal(0);
                const derived = computed(() => {
                    const result = {value: 0};

                    result.value = source() + 1;

                    return result.value;
                });
                console.log(derived);
            `,
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, signal, untracked} from '@angular/core';
                const source = signal(0);
                const snapshot = signal(1);
                const derived = computed(() => source() + untracked(() => snapshot()));
                console.log(derived);
            `,
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, signal} from '@angular/core';
                const source = signal(0);
                let counter = 0;
                const increment = (): void => {
                    counter += 1;
                };
                const derived = computed(() => source() * 2);
                increment();
                console.log({counter, derived});
            `,
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                const source = {value: 0};
                function computed<T>(computation: () => T): T {
                    return computation();
                }
                const derived = computed(() => {
                    source.value += 1;

                    return source.value;
                });
                console.log(derived);
            `,
        },
    ],
});
