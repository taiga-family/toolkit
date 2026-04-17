import {rule} from '../rules/no-signal-reads-after-await-in-reactive-context';

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
        function effect(
            effectFn: (...args: unknown[]) => unknown,
            options?: {manualCleanup?: boolean},
        ): void;
        function computed<T>(computation: () => T): Signal<T>;
        interface AbortSignal {
            readonly aborted: boolean;
        }
        function resource<T, P>(options: {
            params: () => P;
            loader: (args: {params: P; abortSignal: AbortSignal}) => Promise<T>;
        }): {
            value: Signal<T | undefined>;
        };
        function untracked<T>(value: (() => T) | Signal<T>): T;
    }
`;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {projectService: {allowDefaultProject: ['*.ts*']}},
    },
});

ruleTester.run('no-signal-reads-after-await-in-reactive-context', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const theme = signal('dark');
                async function fetchUserData(): Promise<void> {}
                effect(async () => {
                    await fetchUserData();
                    console.log(theme());
                });
            `,
            errors: [{messageId: 'readAfterAwait'}],
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, resource} from '@angular/core';
                const userId = signal('42');
                const locale = signal('ru');
                const userResource = resource({
                    params: () => ({id: userId()}),
                    loader: async ({params}) => {
                        await Promise.resolve(params.id);
                        return locale();
                    },
                });
                console.log(userResource);
            `,
            errors: [{messageId: 'readAfterAwait'}],
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const theme = signal('dark');
                async function fetchUserData(): Promise<void> {}
                effect(async () => {
                    const currentTheme = theme();

                    await fetchUserData();
                    console.log(currentTheme);
                });
            `,
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, computed} from '@angular/core';
                const theme = signal('dark');
                const label = computed(() => theme().toUpperCase());
                console.log(label);
            `,
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const theme = signal('dark');
                async function fetchUserData(): Promise<void> {}
                effect(async () => {
                    await fetchUserData();
                    console.log(untracked(theme));
                });
            `,
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, resource, untracked} from '@angular/core';
                const locale = signal('ru');
                const userResource = resource({
                    params: () => '42',
                    loader: async ({params}) => {
                        await Promise.resolve(params);

                        return untracked(locale);
                    },
                });
                console.log(userResource);
            `,
        },
    ],
});
