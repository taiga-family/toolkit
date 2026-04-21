import {rule} from '../rules/recommended/no-useless-untracked';

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

ruleTester.run('no-useless-untracked', rule, {
    invalid: [
        // Block body with only a write — no reads inside untracked
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const dropdown = signal('');
                effect(() => {
                    untracked(() => {
                        dropdown.set('foo');
                    });
                });
            `,
            errors: [{messageId: 'uselessUntracked'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const dropdown = signal('');
                effect(() => {
                    dropdown.set('foo');
                });
            `,
        },
        // Aliased untracked import should also be removed by autofix
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked as snapshot} from '@angular/core';
                const dropdown = signal('');
                effect(() => {
                    snapshot(() => {
                        dropdown.set('foo');
                    });
                });
            `,
            errors: [{messageId: 'uselessUntracked'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const dropdown = signal('');
                effect(() => {
                    dropdown.set('foo');
                });
            `,
        },
        // Expression body with update — no reads
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const count = signal(0);
                effect(() => {
                    untracked(() => count.update((n) => n + 1));
                });
            `,
            errors: [{messageId: 'uselessUntracked'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const count = signal(0);
                effect(() => {
                    count.update((n) => n + 1);
                });
            `,
        },
        // Expression body with literal write
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const writable = signal(0);
                effect(() => {
                    untracked(() => writable.set(123));
                });
            `,
            errors: [{messageId: 'uselessUntracked'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const writable = signal(0);
                effect(() => {
                    writable.set(123);
                });
            `,
        },
        // Block body with multiple writes — untracked removed, import trimmed
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const a = signal(0);
                const b = signal('');
                effect(() => {
                    untracked(() => {
                        a.set(1);
                        b.set('hello');
                    });
                });
            `,
            errors: [{messageId: 'uselessUntracked'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const a = signal(0);
                const b = signal('');
                effect(() => {
                    a.set(1);
                    b.set('hello');
                });
            `,
        },
        // Captured variable (not a signal read) passed to write inside untracked
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const template = signal('');
                const dropdown = signal('');
                effect(() => {
                    const tpl = template();
                    untracked(() => {
                        dropdown.set(tpl);
                    });
                });
            `,
            errors: [{messageId: 'uselessUntracked'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                const template = signal('');
                const dropdown = signal('');
                effect(() => {
                    const tpl = template();
                    dropdown.set(tpl);
                });
            `,
        },
        // untracked kept in import when still used elsewhere
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const pos = signal(0);
                const a = signal(0);
                const b = signal(0);
                effect(() => {
                    untracked(() => a.set(1));
                });
                const snapshot = untracked(() => pos());
            `,
            errors: [{messageId: 'uselessUntracked'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const pos = signal(0);
                const a = signal(0);
                const b = signal(0);
                effect(() => {
                    a.set(1);
                });
                const snapshot = untracked(() => pos());
            `,
        },
        // Same useless wrapper inside computed()
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, computed, untracked} from '@angular/core';
                const source = signal(0);
                const derived = computed(() => {
                    untracked(() => source.set(1));

                    return source();
                });
                console.log(derived);
            `,
            errors: [{messageId: 'uselessUntracked'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, computed} from '@angular/core';
                const source = signal(0);
                const derived = computed(() => {
                    source.set(1);

                    return source();
                });
                console.log(derived);
            `,
        },
        // Class-based useless wrapper should also be removed
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly count = signal(0);

                    constructor() {
                        effect(() => {
                            untracked(() => {
                                this.count.set(1);
                            });
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'uselessUntracked'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect} from '@angular/core';
                class Test {
                    private readonly count = signal(0);

                    constructor() {
                        effect(() => {
                            this.count.set(1);
                        });
                    }
                }

                new Test();
            `,
        },
    ],
    valid: [
        // Signal read inside untracked body — wrapper is justified
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const position = signal({x: 0, y: 0});
                const count = signal(0);
                effect(() => {
                    untracked(() => {
                        const pos = position();
                        count.set(pos.x);
                    });
                });
            `,
        },
        // Signal read directly inside untracked with non-write use
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const val = signal(0);
                effect(() => {
                    untracked(() => {
                        const v = val();
                        console.log(v);
                    });
                });
            `,
        },
        // Angular guide: wrapping external code is a valid use-case even when
        // the callback body itself contains no direct signal reads
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const currentUser = signal('Alex');
                const loggingService = {log(_msg: string): void {}};
                effect(() => {
                    const user = currentUser();
                    untracked(() => {
                        loggingService.log(\`User set to \${user}\`);
                    });
                });
            `,
        },
        // Reads inside nested async callbacks are outside the synchronous
        // reactive context, so they should not make the outer untracked "useless"
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const source = signal(0);
                const target = signal(0);
                effect(() => {
                    untracked(() => {
                        queueMicrotask(() => console.log(source()));
                        target.set(1);
                    });
                });
            `,
        },
        // Creating effect() from inside a reactive callback may need untracked
        // to escape the ambient reactive context and avoid NG0602
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, effect, signal, untracked} from '@angular/core';
                class Test {
                    constructor() {
                        const s = signal(0);

                        const c = computed(() => {
                            untracked(() => {
                                effect(() => {
                                    console.log(s());
                                });
                            });

                            return s();
                        });

                        console.log(c());
                    }
                }

                new Test();
            `,
        },
        // linkedSignal() may also use untracked to escape the ambient reactive
        // context when creating an effect()
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {effect, linkedSignal, signal, untracked} from '@angular/core';
                class Test {
                    private readonly source = signal(0);
                    readonly derived = linkedSignal(() => {
                        untracked(() => {
                            effect(() => {
                                console.log(this.source());
                            });
                        });

                        return this.source();
                    });
                }

                console.log(new Test().derived);
            `,
        },
        // linkedSignal().computation may also use untracked for effect() creation
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {effect, linkedSignal, signal, untracked} from '@angular/core';
                class Test {
                    private readonly trigger = signal(0);
                    private readonly snapshot = signal(1);
                    readonly derived = linkedSignal({
                        source: () => this.trigger(),
                        computation: (source) => {
                            untracked(() => {
                                effect(() => {
                                    console.log(this.snapshot());
                                });
                            });

                            return source + this.snapshot();
                        },
                    });
                }

                console.log(new Test().derived);
            `,
        },
        // afterRenderEffect() may also use untracked to escape the ambient
        // reactive context when creating an effect()
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {afterRenderEffect, effect, signal, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    constructor() {
                        afterRenderEffect(() => {
                            untracked(() => {
                                effect(() => {
                                    console.log(this.phase());
                                });
                            });
                        });
                    }
                }

                new Test();
            `,
        },
        // afterRenderEffect().read may also use untracked for effect() creation
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {afterRenderEffect, effect, signal, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    constructor() {
                        afterRenderEffect({
                            read: () => {
                                untracked(() => {
                                    effect(() => {
                                        console.log(this.phase());
                                    });
                                });
                            },
                        });
                    }
                }

                new Test();
            `,
        },
        // untracked outside effect — out of scope for this rule
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                const value = signal(0);
                const result = untracked(() => value());
            `,
        },
        // Getter access inside untracked — getter may internally read signals
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, untracked} from '@angular/core';
                class Foo {
                    get match(): boolean { return true; }
                    readonly bar = computed(() => untracked(() => this.match));
                }
            `,
        },
        // Getter backed by a signal read is opaque and should keep untracked
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, computed, untracked} from '@angular/core';
                class Test {
                    private readonly source = signal(1);

                    get someSignalValue(): number {
                        return this.source();
                    }

                    readonly derived = computed(
                        () => untracked(() => this.someSignalValue),
                    );
                }

                console.log(new Test().derived);
            `,
        },
        // Class-based signal read inside untracked keeps the wrapper meaningful
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly position = signal({x: 0, y: 0});
                    private readonly count = signal(0);

                    constructor() {
                        effect(() => {
                            untracked(() => {
                                const pos = this.position();
                                this.count.set(pos.x);
                            });
                        });
                    }
                }

                new Test();
            `,
        },
        // Snapshot passed through into a write is a valid incidental read
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly value = signal<number | null>(null);
                    private readonly month = signal(0);

                    constructor() {
                        effect(() => {
                            const value = untracked(() => this.value());

                            this.month.set(value ?? 0);
                        });
                    }
                }

                new Test();
            `,
        },
        // Snapshot that influences control flow is still a valid incidental read
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly showAdjacent = signal(false);
                    private readonly value = signal<number | null>(null);
                    private readonly month = signal(0);

                    constructor() {
                        effect(() => {
                            const value = untracked(() => this.value());

                            if (this.showAdjacent() && value !== null) {
                                this.month.set(value);
                            }
                        });
                    }
                }

                new Test();
            `,
        },
        // Focus-driven effect may use snapshot reads to decide blur cleanup
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly strict = signal(true);
                    private readonly value = signal<string | null>(null);
                    private readonly input = {value: signal('')};
                    private readonly host = {focused: signal(false)};
                    private readonly cleanup = signal(false);

                    constructor() {
                        effect(() => {
                            const incomplete = untracked(
                                () => this.strict() && this.input.value() && this.value() === null,
                            );

                            if (!this.host.focused() && incomplete) {
                                this.cleanup.set(true);
                            }
                        });
                    }
                }

                new Test();
            `,
        },
        // Snapshot reads may still feed branching in focus/blur flows
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly value = signal<string | null>(null);
                    private readonly interactive = signal(true);
                    private readonly allowText = signal(false);
                    private readonly nonRemovablePrefix = signal('+7 ');
                    private readonly input = {value: signal('')};
                    private readonly host = {focused: signal(false)};

                    constructor() {
                        effect(() => {
                            const incomplete = untracked(() => !this.value());
                            const prefix = incomplete && this.interactive() && !this.allowText();

                            if (!this.host.focused() && incomplete) {
                                this.input.value.set('');
                            } else if (this.host.focused() && prefix) {
                                this.input.value.set(untracked(this.nonRemovablePrefix));
                            }
                        });
                    }
                }

                new Test();
            `,
        },
        // linkedSignal fallback based on an untracked snapshot may be intentional
        // state seeding, so the rule should not flag it
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, linkedSignal, untracked} from '@angular/core';
                class Test {
                    private readonly year = signal<number | null>(null);
                    private readonly value = signal<number | null>(null);

                    readonly activeYear = linkedSignal(() => {
                        const year = this.year();

                        if (year !== null) {
                            return year;
                        }

                        const value = untracked(() => this.value());

                        if (value !== null) {
                            return value;
                        }

                        return 0;
                    });
                }

                console.log(new Test().activeYear());
            `,
        },
    ],
});
