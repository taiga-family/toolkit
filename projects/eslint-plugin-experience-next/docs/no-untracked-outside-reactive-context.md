# no-untracked-outside-reactive-context

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

`untracked()` usually only affects signal reads that happen inside the synchronous body of a reactive callback. In
ordinary non-reactive code or nested callbacks it usually does not prevent dependency tracking and only adds noise. This
rule reports those cases, but intentionally allows a few explicit escape hatches: post-`await` reads inside a reactive
callback when `untracked()` is used to document an intentional current-value snapshot, imperative Angular hooks such as
`@Pipe().transform`, `ControlValueAccessor.writeValue`, `registerOnChange` including patched accessors such as
`accessor.writeValue = (...) => {}`, callback-form wrappers used inside deferred scheduler / event-handler callbacks,
and narrow lazy DI factory wrappers like `InjectionToken({factory})` / `useFactory` when they guard creation of a
reactive owner such as `effect()` against an accidental ambient reactive context. For the narrow case
`untracked(() => effect(...))` and similar outer wrappers around a reactive call in ordinary code, autofix removes only
the useless outer `untracked()` wrapper.

```ts
// ❌ error
const snapshot = untracked(this.user);

effect(() => {
  button.addEventListener('click', () => {
    console.log(untracked(this.user));
  });
});
```

```ts
// ✅ ok
effect(() => {
  console.log(untracked(this.user));
});

const snapshot = computed(() => untracked(this.user));
```

```ts
// ✅ ok — after await, untracked can mark an intentional current snapshot
effect(async () => {
  await this.refresh();

  if (untracked(this.user) !== previousUser) {
    console.log('changed');
  }
});
```

```ts
// ❌ error
untracked(() => {
  effect(() => {
    console.log(this.user());
  });
});

// ✅ after autofix
effect(() => {
  console.log(this.user());
});
```

```ts
// ✅ ok — imperative Angular hooks may still need untracked
@Pipe({name: 'demo', pure: false})
export class DemoPipe implements PipeTransform {
  private readonly value = signal('');

  transform(next: string): string {
    untracked(() => this.value.set(next));
    return this.value();
  }
}
```

```ts
// ✅ ok — deferred callback wrappers may execute under reactive control later
const update = (): void => untracked(() => value.set(input.value));

input.addEventListener('input', update, {capture: true});
```

```ts
// ✅ ok — lazy DI factories may first execute from an ambient reactive context
export const TOKEN = new InjectionToken<void>('TOKEN', {
  factory: () => {
    untracked(() => {
      effect(() => {
        console.log(count());
      });
    });
  },
});
```
