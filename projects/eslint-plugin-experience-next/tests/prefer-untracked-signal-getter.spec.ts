import {rule} from '../rules/prefer-untracked-signal-getter';

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
        interface ModelSignal<T> extends WritableSignal<T> {}
        interface InputSignalWithTransform<T, TransformT> extends Signal<T> {}
        function signal<T>(initialValue: T): WritableSignal<T>;
        function model<T>(initialValue: T): ModelSignal<T>;
        function untracked<T>(value: (() => T) | Signal<T>): T;
    }
`;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {projectService: {allowDefaultProject: ['*.ts*']}},
    },
});

ruleTester.run('prefer-untracked-signal-getter', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                const counter = signal(0);
                const snapshot = untracked(() => counter());
                console.log(snapshot);
            `,
            errors: [{messageId: 'preferGetterForm'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                const counter = signal(0);
                const snapshot = untracked(counter);
                console.log(snapshot);
            `,
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked as snapshot} from '@angular/core';
                const counter = signal(0);
                const value = snapshot(() => counter());
                console.log(value);
            `,
            errors: [{messageId: 'preferGetterForm'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked as snapshot} from '@angular/core';
                const counter = signal(0);
                const value = snapshot(counter);
                console.log(value);
            `,
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                class Test {
                    protected readonly value = signal('ok');

                    protected readonly snapshot = untracked(() => this.value());
                }
                console.log(Test);
            `,
            errors: [{messageId: 'preferGetterForm'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                class Test {
                    protected readonly value = signal('ok');

                    protected readonly snapshot = untracked(this.value);
                }
                console.log(Test);
            `,
        },
        // Nested member access: untracked(() => this.table.sorter()) with inline class
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                class Table {
                    readonly sorter = signal(0);
                }
                class Test {
                    protected readonly table = new Table();

                    protected readonly snapshot = untracked(() => this.table.sorter());
                }
                console.log(Test);
            `,
            errors: [{messageId: 'preferGetterForm'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                class Table {
                    readonly sorter = signal(0);
                }
                class Test {
                    protected readonly table = new Table();

                    protected readonly snapshot = untracked(this.table.sorter);
                }
                console.log(Test);
            `,
        },
        // Nested member access via declared class with Signal (read-only, as returned by computed())
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                import type {Signal} from '@angular/core';
                declare class TableComponent {
                    readonly sorter: Signal<number>;
                }
                class Test {
                    protected readonly table: TableComponent = null!;

                    protected readonly snapshot = untracked(() => this.table.sorter());
                }
                console.log(Test);
            `,
            errors: [{messageId: 'preferGetterForm'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                import type {Signal} from '@angular/core';
                declare class TableComponent {
                    readonly sorter: Signal<number>;
                }
                class Test {
                    protected readonly table: TableComponent = null!;

                    protected readonly snapshot = untracked(this.table.sorter);
                }
                console.log(Test);
            `,
        },
        // Nested member access via declared class with WritableSignal
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                import type {WritableSignal} from '@angular/core';
                declare class TableComponent {
                    readonly sorter: WritableSignal<number>;
                }
                class Test {
                    protected readonly table: TableComponent = null!;

                    protected readonly snapshot = untracked(() => this.table.sorter());
                }
                console.log(Test);
            `,
            errors: [{messageId: 'preferGetterForm'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                import type {WritableSignal} from '@angular/core';
                declare class TableComponent {
                    readonly sorter: WritableSignal<number>;
                }
                class Test {
                    protected readonly table: TableComponent = null!;

                    protected readonly snapshot = untracked(this.table.sorter);
                }
                console.log(Test);
            `,
        },
        // InputSignalWithTransform — "Signal" mid-word must still be detected
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {untracked} from '@angular/core';
                declare const sortable: import('@angular/core').InputSignalWithTransform<boolean, unknown>;
                const snapshot = untracked(() => sortable());
            `,
            errors: [{messageId: 'preferGetterForm'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {untracked} from '@angular/core';
                declare const sortable: import('@angular/core').InputSignalWithTransform<boolean, unknown>;
                const snapshot = untracked(sortable);
            `,
        },
        // ModelSignal (model()) — compound type name must be detected
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {model, untracked} from '@angular/core';
                class Test {
                    protected readonly value = model(0);

                    protected readonly snapshot = untracked(() => this.value());
                }
                console.log(Test);
            `,
            errors: [{messageId: 'preferGetterForm'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {model, untracked} from '@angular/core';
                class Test {
                    protected readonly value = model(0);

                    protected readonly snapshot = untracked(this.value);
                }
                console.log(Test);
            `,
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                const counter = signal(0);
                const snapshot = untracked(counter);
                console.log(snapshot);
            `,
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                const counter = signal(0);
                const snapshot = untracked(() => counter() + 1);
                console.log(snapshot);
            `,
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                class Test {
                    protected readonly value = signal('ok');

                    protected get signalGetter() {
                        return this.value;
                    }

                    protected readonly snapshot = untracked(() => this.signalGetter());
                }
                console.log(Test);
            `,
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {untracked} from '@angular/core';
                class Test {
                    protected get myGetter(): number {
                        return 42;
                    }

                    protected readonly snapshot = untracked(() => this.myGetter);
                }
                console.log(Test);
            `,
        },
    ],
});
