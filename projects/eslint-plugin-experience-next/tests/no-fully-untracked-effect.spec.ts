import {rule} from '../rules/no-fully-untracked-effect';

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

ruleTester.run('no-fully-untracked-effect', rule, {
    invalid: [
        // Real-world pattern: read + conditional write, both inside untracked
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const routeEvents = signal(null);
                const open = signal(false);
                effect(() => {
                    untracked(() => {
                        routeEvents() && open.set(false);
                    });
                });
            `,
            errors: [{messageId: 'noTrackedReads'}],
        },
        // Read only — no write, but still not tracked
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const val = signal(0);
                effect(() => {
                    untracked(() => {
                        console.log(val());
                    });
                });
            `,
            errors: [{messageId: 'noTrackedReads'}],
        },
        // Multiple untracked blocks, all reads inside them
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const a = signal(0);
                const b = signal(0);
                const out = signal(0);
                effect(() => {
                    untracked(() => {
                        out.set(a());
                    });
                    untracked(() => {
                        out.set(b());
                    });
                });
            `,
            errors: [{messageId: 'noTrackedReads'}],
        },
        // Reads in cleanup callbacks are not tracked dependencies of the effect
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const cleanupSignal = signal(0);
                const source = signal(0);
                effect((onCleanup) => {
                    onCleanup(() => {
                        console.log(cleanupSignal());
                    });
                    untracked(() => {
                        console.log(source());
                    });
                });
            `,
            errors: [{messageId: 'noTrackedReads'}],
        },
        // Same broken pattern inside computed()
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, computed, untracked} from '@angular/core';
                const source = signal(0);
                const derived = computed(() => untracked(() => source() + 1));
                console.log(derived);
            `,
            errors: [{messageId: 'noTrackedReads'}],
        },
        // Class-based effect with all reads hidden in untracked
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly routeEvents = signal(false);
                    private readonly open = signal(false);

                    constructor() {
                        effect(() => {
                            untracked(() => {
                                this.routeEvents() && this.open.set(false);
                            });
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'noTrackedReads'}],
        },
        // Class field computed() with the only dependency hidden in untracked
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, computed, untracked} from '@angular/core';
                class Test {
                    private readonly source = signal(0);
                    readonly derived = computed(() => untracked(() => this.source() + 1));
                }

                console.log(new Test().derived);
            `,
            errors: [{messageId: 'noTrackedReads'}],
        },
        // Class field linkedSignal() with the only dependency hidden in untracked
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, linkedSignal, untracked} from '@angular/core';
                class Test {
                    private readonly source = signal(0);
                    readonly derived = linkedSignal(
                        () => untracked(() => this.source() + 1),
                    );
                }

                console.log(new Test().derived);
            `,
            errors: [{messageId: 'noTrackedReads'}],
        },
        // linkedSignal().source is its own reactive scope
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, linkedSignal, untracked} from '@angular/core';
                class Test {
                    private readonly trigger = signal(0);
                    readonly derived = linkedSignal({
                        source: () => untracked(() => this.trigger()),
                        computation: (source) => source,
                    });
                }

                console.log(new Test().derived);
            `,
            errors: [{messageId: 'noTrackedReads'}],
        },
        // linkedSignal().computation with all reads hidden in untracked
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, linkedSignal, untracked} from '@angular/core';
                class Test {
                    private readonly trigger = signal(0);
                    private readonly snapshot = signal(1);
                    readonly derived = linkedSignal({
                        source: () => this.trigger(),
                        computation: () => untracked(() => this.snapshot()),
                    });
                }

                console.log(new Test().derived);
            `,
            errors: [{messageId: 'noTrackedReads'}],
        },
        // resource().params is also reactive and should not hide all reads
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, resource, untracked} from '@angular/core';
                class Test {
                    private readonly requestId = signal(0);
                    readonly derived = resource({
                        params: () => untracked(() => this.requestId()),
                        loader: async ({params}) => params,
                    });
                }

                console.log(new Test().derived);
            `,
            errors: [{messageId: 'noTrackedReads'}],
        },
        // resource().loader should not hide every signal read inside untracked
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, resource, untracked} from '@angular/core';
                class Test {
                    private readonly requestId = signal(0);
                    private readonly snapshot = signal(1);
                    readonly derived = resource({
                        params: () => this.requestId(),
                        loader: async ({params}) => params + untracked(() => this.snapshot()),
                    });
                }

                console.log(new Test().derived);
            `,
            errors: [{messageId: 'noTrackedReads'}],
        },
        // afterRenderEffect() callback form is another reactive scope
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, afterRenderEffect, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    constructor() {
                        afterRenderEffect(() => {
                            untracked(() => {
                                console.log(this.phase());
                            });
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'noTrackedReads'}],
        },
        // afterRenderEffect().read phase should be covered too
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, afterRenderEffect, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    constructor() {
                        afterRenderEffect({
                            read: () => {
                                untracked(() => {
                                    console.log(this.phase());
                                });
                            },
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'noTrackedReads'}],
        },
    ],
    valid: [
        // Read outside untracked — effect is properly reactive
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const routeEvents = signal(null);
                const open = signal(false);
                effect(() => {
                    if (routeEvents()) {
                        untracked(() => { open.set(false); });
                    }
                });
            `,
        },
        // Read outside untracked (conditional short-circuit)
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const source = signal(0);
                const target = signal(0);
                effect(() => {
                    source() && untracked(() => target.set(0));
                });
            `,
        },
        // No reads at all — different concern, not flagged by this rule
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const counter = signal(0);
                effect(() => {
                    untracked(() => { counter.set(42); });
                });
            `,
        },
        // At least one tracked read alongside untracked reads
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const trigger = signal(0);
                const snapshot = signal(0);
                const out = signal(0);
                effect(() => {
                    trigger();
                    out.set(untracked(() => snapshot()) + 1);
                });
            `,
        },
        // Computed with at least one tracked dependency remains valid
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, computed, untracked} from '@angular/core';
                const source = signal(0);
                const snapshot = signal(1);
                const derived = computed(() => source() + untracked(() => snapshot()));
                console.log(derived);
            `,
        },
        // Creating effect() under untracked should not make computed() look like
        // it has untracked signal reads of its own
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {computed, effect, signal, untracked} from '@angular/core';
                const source = signal(0);
                const derived = computed(() => {
                    untracked(() => {
                        effect(() => {
                            console.log(source());
                        });
                    });

                    return 0;
                });
                console.log(derived);
            `,
        },
        // effect outside module — no @angular/core import, rule does not apply
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                const val = {reads: () => 0};
                function effect(fn: () => void) { fn(); }
                function untracked(fn: () => unknown) { return fn(); }
                effect(() => { untracked(() => { val.reads(); }); });
            `,
        },
        // Class-based effect with tracked read outside untracked
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly routeEvents = signal(false);
                    private readonly open = signal(false);

                    constructor() {
                        effect(() => {
                            if (this.routeEvents()) {
                                untracked(() => {
                                    this.open.set(false);
                                });
                            }
                        });
                    }
                }

                new Test();
            `,
        },
        // Class field computed() with a tracked dependency alongside untracked
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, computed, untracked} from '@angular/core';
                class Test {
                    private readonly source = signal(0);
                    private readonly snapshot = signal(1);
                    readonly derived = computed(
                        () => this.source() + untracked(() => this.snapshot()),
                    );
                }

                console.log(new Test().derived);
            `,
        },
        // Class field linkedSignal() with a tracked dependency alongside untracked
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, linkedSignal, untracked} from '@angular/core';
                class Test {
                    private readonly source = signal(0);
                    private readonly snapshot = signal(1);
                    readonly derived = linkedSignal(
                        () => this.source() + untracked(() => this.snapshot()),
                    );
                }

                console.log(new Test().derived);
            `,
        },
        // linkedSignal() should not treat nested effect() reads as untracked reads
        // of the outer reactive callback
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

                        return 0;
                    });
                }

                console.log(new Test().derived);
            `,
        },
        // linkedSignal().source stays valid when at least one read is tracked
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, linkedSignal, untracked} from '@angular/core';
                class Test {
                    private readonly trigger = signal(0);
                    private readonly snapshot = signal(1);
                    readonly derived = linkedSignal({
                        source: () => this.trigger() + untracked(() => this.snapshot()),
                        computation: (source) => source,
                    });
                }

                console.log(new Test().derived);
            `,
        },
        // linkedSignal().computation remains valid with a tracked dependency
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, linkedSignal, untracked} from '@angular/core';
                class Test {
                    private readonly trigger = signal(0);
                    private readonly factor = signal(1);
                    private readonly snapshot = signal(2);
                    readonly derived = linkedSignal({
                        source: () => this.trigger(),
                        computation: (source) =>
                            source + this.factor() + untracked(() => this.snapshot()),
                    });
                }

                console.log(new Test().derived);
            `,
        },
        // resource().params should remain valid with a tracked read
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, resource, untracked} from '@angular/core';
                class Test {
                    private readonly requestId = signal(0);
                    private readonly snapshot = signal(1);
                    readonly derived = resource({
                        params: () => this.requestId() + untracked(() => this.snapshot()),
                        loader: async ({params}) => params,
                    });
                }

                console.log(new Test().derived);
            `,
        },
        // resource().loader remains valid with a tracked signal read
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, resource, untracked} from '@angular/core';
                class Test {
                    private readonly requestId = signal(0);
                    private readonly factor = signal(1);
                    private readonly snapshot = signal(2);
                    readonly derived = resource({
                        params: () => this.requestId(),
                        loader: async ({params}) =>
                            params + this.factor() + untracked(() => this.snapshot()),
                    });
                }

                console.log(new Test().derived);
            `,
        },
        // afterRenderEffect() callback form with tracked reads is valid
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, afterRenderEffect, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    constructor() {
                        afterRenderEffect(() => {
                            const phase = this.phase();
                            untracked(() => {
                                console.log(phase);
                            });
                        });
                    }
                }

                new Test();
            `,
        },
        // afterRenderEffect() should not treat nested effect() reads as untracked
        // reads of the render callback itself
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
        // afterRenderEffect().read phase with a tracked read is valid
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, afterRenderEffect, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    constructor() {
                        afterRenderEffect({
                            read: () => {
                                const phase = this.phase();
                                untracked(() => {
                                    console.log(phase);
                                });
                            },
                        });
                    }
                }

                new Test();
            `,
        },
    ],
});
