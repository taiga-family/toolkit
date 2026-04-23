import {rule} from '../rules/recommended/no-repeated-signal-in-conditional';

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
        }
        function signal<T>(initialValue: T): WritableSignal<T>;
    }
`;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {projectService: {allowDefaultProject: ['*.ts*']}},
    },
});

ruleTester.run('no-repeated-signal-in-conditional', rule, {
    invalid: [
        {
            // ternary: nullable signal (T|null) repeated with TSAsExpression cast
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                declare function tuiIsNumber(v: unknown): v is number;
                declare function tuiPx(v: number): string;
                class Cmp {
                    readonly height = signal<number | null>(null);
                    get hostHeight() {
                        return tuiIsNumber(this.height())
                            ? tuiPx(this.height() as number)
                            : this.height();
                    }
                }
            `,
            errors: [{messageId: 'noRepeatedSignalInConditional'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                declare function tuiIsNumber(v: unknown): v is number;
                declare function tuiPx(v: number): string;
                class Cmp {
                    readonly height = signal<number | null>(null);
                    get hostHeight() {
                        const height = this.height();

                        return tuiIsNumber(height)
                            ? tuiPx(height)
                            : height;
                    }
                }
            `,
        },
        {
            // ternary: nullable signal (T|undefined) repeated in test + consequent with cast
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                const name = signal<string | undefined>(undefined);
                declare function format(v: string): string;
                const r = name() ? format(name() as string) : 'unknown';
            `,
            errors: [{messageId: 'noRepeatedSignalInConditional'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                const name = signal<string | undefined>(undefined);
                declare function format(v: string): string;
                const nameVal = name();

                const r = nameVal ? format(nameVal) : 'unknown';
            `,
        },
        {
            // ternary: nested ternary fires on its own visit (nullable x() repeated)
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                const x = signal<boolean | null>(null);
                declare function a(): string;
                declare function b(): string;
                declare function c(): string;
                function test() {
                    return a() ? b() : (x() ? c() : x());
                }
            `,
            errors: [{messageId: 'noRepeatedSignalInConditional'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                const x = signal<boolean | null>(null);
                declare function a(): string;
                declare function b(): string;
                declare function c(): string;
                function test() {
                    const xVal = x();

                    return a() ? b() : (xVal ? c() : xVal);
                }
            `,
        },
        {
            // if: nullable signal in test + if body with cast
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                declare function tuiPx(v: number): string;
                class Cmp {
                    readonly height = signal<number | null>(null);
                    method() {
                        if (this.height()) {
                            tuiPx(this.height() as number);
                        }
                    }
                }
            `,
            errors: [{messageId: 'noRepeatedSignalInConditional'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                declare function tuiPx(v: number): string;
                class Cmp {
                    readonly height = signal<number | null>(null);
                    method() {
                        const height = this.height();

                        if (height) {
                            tuiPx(height);
                        }
                    }
                }
            `,
        },
        {
            // if: nullable signal in test + else body
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                const value = signal<string | null>(null);
                declare function process(v: string): void;
                declare function fallback(): void;
                function test() {
                    if (value()) {
                        process(value() as string);
                    } else {
                        fallback();
                    }
                }
            `,
            errors: [{messageId: 'noRepeatedSignalInConditional'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                const value = signal<string | null>(null);
                declare function process(v: string): void;
                declare function fallback(): void;
                function test() {
                    const valueVal = value();

                    if (valueVal) {
                        process(valueVal);
                    } else {
                        fallback();
                    }
                }
            `,
        },
    ],
    valid: [
        {
            // non-nullable signal repeated in ternary — not reported
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                const flag = signal(false);
                declare function on(): string;
                const r = flag() ? on() : flag();
            `,
        },
        {
            // non-nullable signal repeated in if test + body — not reported
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                const flag = signal(true);
                declare function doSomething(v: boolean): void;
                function test() {
                    if (flag()) {
                        doSomething(flag());
                    }
                }
            `,
        },
        {
            // nullable signal appears only once in ternary — OK
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                const flag = signal<boolean | null>(null);
                const r = flag() ? 'yes' : 'no';
            `,
        },
        {
            // nullable signal appears only once in if — OK
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                const flag = signal<boolean | null>(null);
                function test() {
                    if (flag()) {
                        doSomething();
                    }
                }
                declare function doSomething(): void;
            `,
        },
        {
            // all three are different nullable signals — OK
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                class Cmp {
                    readonly w = signal<number | null>(null);
                    readonly h = signal<number | null>(null);
                    readonly d = signal<number | null>(null);
                    get area() {
                        return this.w() ? this.h() : this.d();
                    }
                }
            `,
        },
        {
            // regular (non-signal) function returning nullable — not reported
            code: /* TypeScript */ `
                declare function getValue(): number | null;
                const r = getValue() ? getValue() : getValue();
            `,
        },
    ],
});
