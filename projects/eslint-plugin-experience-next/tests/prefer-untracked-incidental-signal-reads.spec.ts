import {rule} from '../rules/recommended/prefer-untracked-incidental-signal-reads';

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
        function linkedSignal<T>(computation: () => T): WritableSignal<T>;
        function linkedSignal<S, T>(options: {
            source: () => S;
            computation: (source: S, previous?: {source: S; value: T}) => T;
        }): WritableSignal<T>;
        function afterRenderEffect(
            callbackOrPhases:
                | ((...args: unknown[]) => unknown)
                | {
                      earlyRead?: (...args: unknown[]) => unknown;
                      write?: (...args: unknown[]) => unknown;
                      mixedReadWrite?: (...args: unknown[]) => unknown;
                      read?: (...args: unknown[]) => unknown;
                  },
        ): void;
        interface AbortSignal {
            readonly aborted: boolean;
        }
        function resource<T, P>(options: {
            params: () => P;
            loader: (args: {params: P; abortSignal: AbortSignal}) => Promise<T>;
        }): {
            value: Signal<T | undefined>;
        };
        function untracked<T>(nonReactiveReadsFn: () => T): T;
    }
`;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {projectService: {allowDefaultProject: ['*.ts*']}},
    },
});

ruleTester.run('prefer-untracked-incidental-signal-reads', rule, {
    invalid: [
        // Signal read passed as direct argument to .set()
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const mousePosition = signal({x: 0, y: 0});
                const position = signal({x: 0, y: 0});
                const isOpen = signal(false);
                effect(() => {
                    if (isOpen()) {
                        position.set(mousePosition());
                    }
                });
            `,
            errors: [{messageId: 'incidentalRead'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const mousePosition = signal({x: 0, y: 0});
                const position = signal({x: 0, y: 0});
                const isOpen = signal(false);
                effect(() => {
                    if (isOpen()) {
                        position.set(untracked(() => mousePosition()));
                    }
                });
            `,
        },
        // Existing alias import should be reused in autofix
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked as snapshot} from '@angular/core';
                const mousePosition = signal({x: 0, y: 0});
                const position = signal({x: 0, y: 0});
                const isOpen = signal(false);
                effect(() => {
                    if (isOpen()) {
                        position.set(mousePosition());
                    }
                });
            `,
            errors: [{messageId: 'incidentalRead'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked as snapshot} from '@angular/core';
                const mousePosition = signal({x: 0, y: 0});
                const position = signal({x: 0, y: 0});
                const isOpen = signal(false);
                effect(() => {
                    if (isOpen()) {
                        position.set(snapshot(() => mousePosition()));
                    }
                });
            `,
        },
        // Signal read as argument to .set() with another tracked dependency and
        // a preceding type-only import from @angular/core
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import type {Signal} from '@angular/core';
                import {signal, effect} from '@angular/core';
                const user = signal('');
                const snapshot = signal('');
                const output = signal('');
                const alias: Signal<string> = snapshot;
                effect(() => {
                    user();
                    output.set(snapshot());
                });
            `,
            errors: [{messageId: 'incidentalRead'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import type {Signal} from '@angular/core';
                import {signal, effect, untracked} from '@angular/core';
                const user = signal('');
                const snapshot = signal('');
                const output = signal('');
                const alias: Signal<string> = snapshot;
                effect(() => {
                    user();
                    output.set(untracked(() => snapshot()));
                });
            `,
        },
        // Local const alias should be treated the same as an inline signal read
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const options = signal(['a']);
                const stringified = signal('value');
                const input = signal('');
                effect(() => {
                    if (options().length) {
                        const value = stringified();

                        input.set(value);
                    }
                });
            `,
            errors: [{messageId: 'incidentalRead'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const options = signal(['a']);
                const stringified = signal('value');
                const input = signal('');
                effect(() => {
                    if (options().length) {
                        const value = untracked(() => stringified());

                        input.set(value);
                    }
                });
            `,
        },
        // Class field signal read passed directly to a write should be wrapped
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                class Test {
                    private readonly mousePosition = signal({x: 0, y: 0});
                    private readonly position = signal({x: 0, y: 0});
                    private readonly isOpen = signal(false);

                    constructor() {
                        effect(() => {
                            if (this.isOpen()) {
                                this.position.set(this.mousePosition());
                            }
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'incidentalRead'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly mousePosition = signal({x: 0, y: 0});
                    private readonly position = signal({x: 0, y: 0});
                    private readonly isOpen = signal(false);

                    constructor() {
                        effect(() => {
                            if (this.isOpen()) {
                                this.position.set(untracked(() => this.mousePosition()));
                            }
                        });
                    }
                }

                new Test();
            `,
        },
        // Class local alias should be treated the same way
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                class Test {
                    private readonly options = signal(['a']);
                    private readonly stringified = signal('value');
                    private readonly input = signal('');

                    constructor() {
                        effect(() => {
                            if (this.options().length) {
                                const value = this.stringified();

                                this.input.set(value);
                            }
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'incidentalRead'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly options = signal(['a']);
                    private readonly stringified = signal('value');
                    private readonly input = signal('');

                    constructor() {
                        effect(() => {
                            if (this.options().length) {
                                const value = untracked(() => this.stringified());

                                this.input.set(value);
                            }
                        });
                    }
                }

                new Test();
            `,
        },
        // Awaited DOM side-effect call should treat options-like reads as incidental
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                class Test {
                    private readonly root = signal<HTMLElement | null>(null);
                    private readonly isOpen = signal(false);
                    private readonly options = signal<FullscreenOptions>({
                        navigationUI: 'auto',
                    });

                    constructor() {
                        effect(async () => {
                            if (this.isOpen()) {
                                await this.root()?.requestFullscreen(this.options());
                            }
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'incidentalRead'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly root = signal<HTMLElement | null>(null);
                    private readonly isOpen = signal(false);
                    private readonly options = signal<FullscreenOptions>({
                        navigationUI: 'auto',
                    });

                    constructor() {
                        effect(async () => {
                            if (this.isOpen()) {
                                await this.root()?.requestFullscreen(untracked(() => this.options()));
                            }
                        });
                    }
                }

                new Test();
            `,
        },
        // Local alias for a DOM side-effect call should be fixed at the read site
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                class Test {
                    private readonly root = signal<HTMLElement | null>(null);
                    private readonly isOpen = signal(false);
                    private readonly options = signal<FullscreenOptions>({
                        navigationUI: 'auto',
                    });

                    constructor() {
                        effect(async () => {
                            if (this.isOpen()) {
                                const options = this.options();

                                await this.root()?.requestFullscreen(options);
                            }
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'incidentalRead'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly root = signal<HTMLElement | null>(null);
                    private readonly isOpen = signal(false);
                    private readonly options = signal<FullscreenOptions>({
                        navigationUI: 'auto',
                    });

                    constructor() {
                        effect(async () => {
                            if (this.isOpen()) {
                                const options = untracked(() => this.options());

                                await this.root()?.requestFullscreen(options);
                            }
                        });
                    }
                }

                new Test();
            `,
        },
    ],
    valid: [
        // Read already inside untracked — not flagged
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const mousePosition = signal({x: 0, y: 0});
                const position = signal({x: 0, y: 0});
                const isOpen = signal(false);
                effect(() => {
                    if (isOpen()) {
                        position.set(untracked(() => mousePosition()));
                    }
                });
            `,
        },
        // If wrapping the read would leave the effect without any tracked
        // dependencies, do not suggest it
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const snapshot = signal('');
                const output = signal('');
                effect(() => {
                    output.set(snapshot());
                });
            `,
        },
        // Read tracked intentionally — effect should re-run when source changes
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const source = signal(0);
                const doubled = signal(0);
                effect(() => {
                    doubled.set(source() * 2);
                });
            `,
        },
        // Nested callbacks run outside the current reactive scope and should not
        // be treated as incidental reads of the effect itself
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const snapshot = signal('');
                const output = signal('');
                const button = {
                    addEventListener(_event: string, callback: () => void): void {
                        callback();
                    },
                };
                effect(() => {
                    button.addEventListener('click', () => {
                        output.set(snapshot());
                    });
                });
            `,
        },
        // Non-signal function call — not flagged
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const target = signal('');
                function getText(): string { return 'hi'; }
                effect(() => {
                    target.set(getText());
                });
            `,
        },
        // Write outside effect — not our concern
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal} from '@angular/core';
                const source = signal(0);
                const target = signal(0);
                target.set(source());
            `,
        },
        // Literal value write — nothing to wrap
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const counter = signal(0);
                effect(() => {
                    counter.set(42);
                });
            `,
        },
        // Arrow function as arg to update — the function itself is the arg,
        // not a direct signal read
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const base = signal(1);
                const total = signal(0);
                effect(() => {
                    total.update((prev) => prev + base());
                });
            `,
        },
        // Class-based tracked dependency should not be treated as incidental
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                class Test {
                    private readonly source = signal(0);
                    private readonly doubled = signal(0);

                    constructor() {
                        effect(() => {
                            this.doubled.set(this.source() * 2);
                        });
                    }
                }

                new Test();
            `,
        },
        // Local alias that also drives control flow is not a snapshot-only read
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                class Test {
                    private readonly showAdjacent = signal(false);
                    private readonly value = signal<number | null>(null);
                    private readonly month = signal<number | null>(null);

                    constructor() {
                        effect(() => {
                            const value = this.value();

                            if (this.showAdjacent() && value !== null) {
                                this.month.set(value);
                            }
                        });
                    }
                }

                new Test();
            `,
        },
        // Getter access is opaque and should not be treated as a direct signal read
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                class Test {
                    private readonly trigger = signal(false);
                    private readonly source = signal(1);
                    private readonly target = signal(0);

                    get someSignalValue(): number {
                        return this.source();
                    }

                    constructor() {
                        effect(() => {
                            if (this.trigger()) {
                                this.target.set(this.someSignalValue);
                            }
                        });
                    }
                }

                new Test();
            `,
        },
        // Reads inside the same DOM call should not count as the "other"
        // tracked dependency required for this rule
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                class Test {
                    private readonly root = signal<HTMLElement | null>(null);
                    private readonly options = signal<FullscreenOptions>({
                        navigationUI: 'auto',
                    });

                    constructor() {
                        effect(async () => {
                            await this.root()?.requestFullscreen(this.options());
                        });
                    }
                }

                new Test();
            `,
        },
        // Non-DOM awaited side-effect calls are intentionally out of scope for
        // this rule to keep confidence high
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const service = {
                    sync(_value: string): Promise<void> {
                        return Promise.resolve();
                    },
                };

                class Test {
                    private readonly enabled = signal(false);
                    private readonly snapshot = signal('');

                    constructor() {
                        effect(async () => {
                            if (this.enabled()) {
                                await service.sync(this.snapshot());
                            }
                        });
                    }
                }

                new Test();
            `,
        },
    ],
});
