# no-useless-untracked

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Inside a reactive callback, `untracked()` is only meaningful when its inner function reads signals or intentionally
wraps opaque external code that may read signals. It can also be a valid escape hatch when a reactive callback needs to
create another reactive owner such as `effect()` without inheriting the ambient reactive context. Wrapping code with no
signal reads and no such escape-hatch purpose in `untracked()` is noise. Autofix unwraps the callback in-place when that
is structurally safe and removes the `untracked` import when it is no longer used elsewhere. Snapshot reads that later
influence branching are still valid and are not reported, because Angular allows incidental reads inside `effect()` and
similar reactive callbacks.

```ts
// ❌ error — no signal reads inside untracked, wrapper is pointless
effect(() => {
  untracked(() => {
    this.count.set(0);
  });
});

// ✅ after autofix
effect(() => {
  this.count.set(0);
});
```

```ts
// ✅ ok — snapshot reads may influence control flow without becoming dependencies
effect(() => {
  const value = untracked(() => this.value());

  if (this.showAdjacent() && value !== null) {
    this.month.set(value);
  }
});
```

```ts
// ✅ ok — linkedSignal fallback may intentionally read a snapshot
const activeYear = linkedSignal(() => {
  const year = this.year();

  if (year) {
    return year;
  }

  const value = untracked(() => this.value());

  return value ?? TODAY;
});
```

```ts
// ✅ ok — wrapping external code is a valid Angular use-case
effect(() => {
  const user = this.user();
  untracked(() => this.logger.log(user));
});
```

```ts
// ✅ ok — creating a nested effect() may need to escape the current reactive context
const doubled = computed(() => {
  untracked(() => {
    effect(() => {
      console.log(this.count());
    });
  });

  return this.count() * 2;
});
```
