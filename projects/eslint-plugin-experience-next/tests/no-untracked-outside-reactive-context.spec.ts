import {rule} from '../rules/no-untracked-outside-reactive-context';

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
        class InjectionToken<T> {
            constructor(description: string, options?: {factory?: () => T});
        }
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
        interface PipeTransform {
            transform(value: unknown): unknown;
        }
        interface ControlValueAccessor {
            writeValue(obj: unknown): void;
            registerOnChange(fn: (value: unknown) => void): void;
        }
        interface Subscription {}
        interface SchedulerAction<T> {
            add(teardown: Subscription): void;
        }
        interface SchedulerLike {
            now(): number;
            schedule<T>(
                work: (this: SchedulerAction<T>, state?: T) => void,
                delay?: number,
                state?: T,
            ): Subscription;
        }
        function Pipe(metadata: {name: string; pure?: boolean}): ClassDecorator;
        function untracked<T>(value: (() => T) | Signal<T>): T;
    }
`;

const ruleTester = new RuleTester({
    languageOptions: {
        parser: require('@typescript-eslint/parser'),
        parserOptions: {projectService: {allowDefaultProject: ['*.ts*']}},
    },
});

ruleTester.run('no-untracked-outside-reactive-context', rule, {
    invalid: [
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                const count = signal(0);
                const snapshot = untracked(count);
                console.log(snapshot);
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        // Outer untracked wrapper around a reactive call is removable
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {effect, signal, untracked} from '@angular/core';
                const count = signal(0);

                untracked(() => {
                    effect(() => {
                        console.log(count());
                    });
                });
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {effect, signal} from '@angular/core';
                const count = signal(0);

                effect(() => {
                    console.log(count());
                });
            `,
        },
        // Expression-body wrapper around a reactive call is also removable
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {effect, signal, untracked as snapshot} from '@angular/core';
                const count = signal(0);
                const ref = snapshot(() => effect(() => console.log(count())));
                console.log(ref);
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
            output: /* TypeScript */ `
                ${PREAMBLE}
                import {effect, signal} from '@angular/core';
                const count = signal(0);
                const ref = effect(() => console.log(count()));
                console.log(ref);
            `,
        },
        // Block-body wrappers are not autofixed in expression position when
        // that would change the callback return value from undefined
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {effect, signal, untracked} from '@angular/core';
                const count = signal(0);
                const ref = untracked(() => {
                    effect(() => {
                        console.log(count());
                    });
                });
                console.log(ref);
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        // transform() outside @Pipe is still outside any allowed context
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                const count = signal(0);
                class Test {
                    public transform(): number {
                        return untracked(count);
                    }
                }

                console.log(new Test().transform());
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const count = signal(0);
                const button = {
                    addEventListener(_event: string, callback: () => void): void {
                        callback();
                    },
                };
                effect(() => {
                    button.addEventListener('click', () => {
                        console.log(untracked(count));
                    });
                });
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const count = signal(0);
                effect(async () => {
                    await Promise.resolve();
                    console.log(untracked(count));
                });
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        // Class field initializer is outside any reactive context
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                class Test {
                    private readonly user = signal('Alex');
                    readonly snapshot = untracked(this.user);
                }

                console.log(new Test().snapshot);
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        // Nested callback inside effect() is outside the synchronous reactive scope
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly user = signal('Alex');
                    private readonly button = {
                        addEventListener(_event: string, callback: () => void): void {
                            callback();
                        },
                    };

                    constructor() {
                        effect(() => {
                            this.button.addEventListener('click', () => {
                                console.log(untracked(this.user));
                            });
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        // After await the effect body is no longer tracked synchronously
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly user = signal('Alex');

                    constructor() {
                        effect(async () => {
                            await Promise.resolve();
                            console.log(untracked(this.user));
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        // linkedSignal() nested callbacks are also outside the synchronous scope
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, linkedSignal, untracked} from '@angular/core';
                class Test {
                    private readonly user = signal(0);

                    private schedule(callback: () => void): void {
                        callback();
                    }

                    readonly derived = linkedSignal(() => {
                        this.schedule(() => {
                            console.log(untracked(this.user));
                        });

                        return 0;
                    });
                }

                console.log(new Test().derived);
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        // linkedSignal().computation nested callbacks should be reported too
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, linkedSignal, untracked} from '@angular/core';
                class Test {
                    private readonly trigger = signal(0);
                    private readonly snapshot = signal(1);

                    private schedule(callback: () => void): void {
                        callback();
                    }

                    readonly derived = linkedSignal({
                        source: () => this.trigger(),
                        computation: (source) => {
                            this.schedule(() => {
                                console.log(untracked(this.snapshot));
                            });

                            return source;
                        },
                    });
                }

                console.log(new Test().derived);
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        // resource().params nested callbacks are outside the synchronous scope
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, resource, untracked} from '@angular/core';
                class Test {
                    private readonly requestId = signal(0);

                    private schedule(callback: () => void): void {
                        callback();
                    }

                    readonly data = resource({
                        params: () => {
                            this.schedule(() => {
                                console.log(untracked(this.requestId));
                            });

                            return 0;
                        },
                        loader: async ({params}) => params,
                    });
                }

                console.log(new Test().data);
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        // resource().loader after await is outside the synchronous scope
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, resource, untracked} from '@angular/core';
                class Test {
                    private readonly snapshot = signal(1);
                    readonly data = resource({
                        params: () => 0,
                        loader: async ({params}) => {
                            await Promise.resolve();

                            return params + untracked(this.snapshot);
                        },
                    });
                }

                console.log(new Test().data);
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        // afterRenderEffect() nested callbacks are outside the synchronous scope
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, afterRenderEffect, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    private schedule(callback: () => void): void {
                        callback();
                    }

                    constructor() {
                        afterRenderEffect(() => {
                            this.schedule(() => {
                                console.log(untracked(this.phase));
                            });
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        // afterRenderEffect().read nested callbacks should be reported too
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, afterRenderEffect, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    private schedule(callback: () => void): void {
                        callback();
                    }

                    constructor() {
                        afterRenderEffect({
                            read: () => {
                                this.schedule(() => {
                                    console.log(untracked(this.phase));
                                });
                            },
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        // afterRenderEffect().earlyRead nested callbacks should be reported too
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, afterRenderEffect, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    private schedule(callback: () => void): void {
                        callback();
                    }

                    constructor() {
                        afterRenderEffect({
                            earlyRead: () => {
                                this.schedule(() => {
                                    console.log(untracked(this.phase));
                                });
                            },
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        // afterRenderEffect().write nested callbacks should be reported too
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, afterRenderEffect, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    private schedule(callback: () => void): void {
                        callback();
                    }

                    constructor() {
                        afterRenderEffect({
                            write: () => {
                                this.schedule(() => {
                                    console.log(untracked(this.phase));
                                });
                            },
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
        // afterRenderEffect().mixedReadWrite nested callbacks should be reported too
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, afterRenderEffect, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    private schedule(callback: () => void): void {
                        callback();
                    }

                    constructor() {
                        afterRenderEffect({
                            mixedReadWrite: () => {
                                this.schedule(() => {
                                    console.log(untracked(this.phase));
                                });
                            },
                        });
                    }
                }

                new Test();
            `,
            errors: [{messageId: 'outsideReactiveContext'}],
        },
    ],
    valid: [
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                const user = signal('Alex');
                effect(() => {
                    console.log(untracked(user));
                });
            `,
        },
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, computed, untracked} from '@angular/core';
                const user = signal('Alex');
                const snapshot = computed(() => untracked(user));
                console.log(snapshot);
            `,
        },
        // Class-based effect() directly using untracked within its body is valid
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, effect, untracked} from '@angular/core';
                class Test {
                    private readonly user = signal('Alex');

                    constructor() {
                        effect(() => {
                            console.log(untracked(this.user));
                        });
                    }
                }

                new Test();
            `,
        },
        // Class-based computed() direct use is still inside reactive scope
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, computed, untracked} from '@angular/core';
                class Test {
                    private readonly user = signal('Alex');
                    readonly snapshot = computed(() => untracked(this.user));
                }

                console.log(new Test().snapshot);
            `,
        },
        // computed() may use untracked to escape the ambient reactive context
        // when creating an effect()
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
        // linkedSignal() callback form should allow direct untracked usage
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, linkedSignal, untracked} from '@angular/core';
                class Test {
                    private readonly user = signal(0);
                    readonly derived = linkedSignal(() => untracked(this.user));
                }

                console.log(new Test().derived);
            `,
        },
        // linkedSignal() may also create effect() under untracked
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
        // linkedSignal().source is also a reactive scope
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, linkedSignal, untracked} from '@angular/core';
                class Test {
                    private readonly trigger = signal(0);
                    readonly derived = linkedSignal({
                        source: () => untracked(this.trigger),
                        computation: (source) => source,
                    });
                }

                console.log(new Test().derived);
            `,
        },
        // linkedSignal().computation may also create effect() under untracked
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
        // linkedSignal().computation should allow direct untracked usage as well
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, linkedSignal, untracked} from '@angular/core';
                class Test {
                    private readonly trigger = signal(0);
                    private readonly snapshot = signal(1);
                    readonly derived = linkedSignal({
                        source: () => this.trigger(),
                        computation: (source) => source + untracked(this.snapshot),
                    });
                }

                console.log(new Test().derived);
            `,
        },
        // resource().params should allow direct untracked usage
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, resource, untracked} from '@angular/core';
                class Test {
                    private readonly requestId = signal(0);
                    readonly data = resource({
                        params: () => untracked(this.requestId),
                        loader: async ({params}) => params,
                    });
                }

                console.log(new Test().data);
            `,
        },
        // resource().loader is valid before any async boundary
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, resource, untracked} from '@angular/core';
                class Test {
                    private readonly snapshot = signal(1);
                    readonly data = resource({
                        params: () => 0,
                        loader: async ({params}) => params + untracked(this.snapshot),
                    });
                }

                console.log(new Test().data);
            `,
        },
        // afterRenderEffect() callback form should allow direct untracked usage
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, afterRenderEffect, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    constructor() {
                        afterRenderEffect(() => {
                            console.log(untracked(this.phase));
                        });
                    }
                }

                new Test();
            `,
        },
        // afterRenderEffect() may also create effect() under untracked
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
        // afterRenderEffect().read is also a reactive scope
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, afterRenderEffect, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    constructor() {
                        afterRenderEffect({
                            read: () => {
                                console.log(untracked(this.phase));
                            },
                        });
                    }
                }

                new Test();
            `,
        },
        // afterRenderEffect().read may also create effect() under untracked
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
        // afterRenderEffect().earlyRead is also a reactive scope
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, afterRenderEffect, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    constructor() {
                        afterRenderEffect({
                            earlyRead: () => {
                                console.log(untracked(this.phase));
                            },
                        });
                    }
                }

                new Test();
            `,
        },
        // afterRenderEffect().write is also a reactive scope
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, afterRenderEffect, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    constructor() {
                        afterRenderEffect({
                            write: () => {
                                console.log(untracked(this.phase));
                            },
                        });
                    }
                }

                new Test();
            `,
        },
        // afterRenderEffect().mixedReadWrite is also a reactive scope
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, afterRenderEffect, untracked} from '@angular/core';
                class Test {
                    private readonly phase = signal(0);

                    constructor() {
                        afterRenderEffect({
                            mixedReadWrite: () => {
                                console.log(untracked(this.phase));
                            },
                        });
                    }
                }

                new Test();
            `,
        },
        // @Pipe().transform is an imperative Angular render hook where
        // untracked may be used to avoid render-time signal write errors
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {Pipe, type PipeTransform, signal, untracked} from '@angular/core';
                @Pipe({
                    name: 'demo',
                    pure: false,
                })
                class Test implements PipeTransform {
                    private readonly current = signal(0);

                    public transform(value: number): number {
                        untracked(() => this.current.set(value));

                        return this.current();
                    }
                }

                console.log(new Test().transform(1));
            `,
        },
        // writeValue is an imperative forms hook where untracked can be needed
        // to avoid signal writes during template rendering
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                class Test implements ControlValueAccessor {
                    private readonly value = signal<string | null>(null);

                    public writeValue(value: string | null): void {
                        const changed = untracked(() => value !== this.value());

                        if (changed) {
                            untracked(() => this.value.set(value));
                        }
                    }

                    public registerOnChange(_fn: (value: unknown) => void): void {}
                }

                console.log(Test);
            `,
        },
        // registerOnChange may install nested callbacks that need signal
        // snapshots without creating reactive dependencies
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                class Test implements ControlValueAccessor {
                    private readonly internal = signal(0);
                    private onChange = (_value: number): void => {};

                    public writeValue(_value: unknown): void {}

                    public registerOnChange(onChange: (value: unknown) => void): void {
                        this.onChange = (value: number) => {
                            const internal = untracked(this.internal);

                            if (value !== internal) {
                                onChange(value);
                            }
                        };
                    }
                }

                console.log(Test);
            `,
        },
        // Deferred scheduler callback may still execute while a reactive scope
        // is active, so callback-form untracked is allowed there
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {untracked} from '@angular/core';
                declare const queueScheduler: SchedulerLike;

                const wrapped: SchedulerLike = {
                    now: () => queueScheduler.now(),
                    schedule<T>(
                        work: (this: SchedulerAction<T>, state?: T) => void,
                        delay?: number,
                        state?: T,
                    ): Subscription {
                        return queueScheduler.schedule(
                            function (this: SchedulerAction<T>, s?: T) {
                                return untracked(() => work.call(this, s));
                            },
                            delay,
                            state,
                        );
                    },
                };

                console.log(wrapped);
            `,
        },
        // Locally stored callbacks that are later registered as handlers may
        // also need untracked when they can fire during reactive execution
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {signal, untracked} from '@angular/core';
                const value = signal('');
                const target = {
                    addEventListener(_type: string, _listener: () => void): void {},
                    removeEventListener(_type: string, _listener: () => void): void {},
                };

                const process = (): (() => void) => {
                    const update = (): void => untracked(() => value.set('next'));

                    target.addEventListener('input', update);

                    return (): void => {
                        target.removeEventListener('input', update);
                    };
                };

                console.log(process);
            `,
        },
        // InjectionToken factories are lazy and may first run under an ambient
        // reactive context, so untracked may guard effect() creation there
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {effect, InjectionToken, signal, untracked} from '@angular/core';
                const count = signal(0);

                const TOKEN = new InjectionToken<void>('TOKEN', {
                    factory: () => {
                        untracked(() => {
                            effect(() => {
                                console.log(count());
                            });
                        });
                    },
                });

                console.log(TOKEN);
            `,
        },
        // useFactory providers have the same lazy execution model
        {
            code: /* TypeScript */ `
                ${PREAMBLE}
                import {effect, signal, untracked} from '@angular/core';
                const count = signal(0);

                const provider = {
                    provide: 'TOKEN',
                    useFactory: () =>
                        untracked(() =>
                            effect(() => {
                                console.log(count());
                            }),
                        ),
                };

                console.log(provider);
            `,
        },
    ],
});
