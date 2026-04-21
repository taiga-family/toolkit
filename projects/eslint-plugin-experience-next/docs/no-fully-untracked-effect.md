# no-fully-untracked-effect

<sup>`✅ Recommended`</sup>

Reports a reactive callback whose signal reads are all wrapped in `untracked()`. That leaves the callback without
tracked dependencies, so Angular will not re-run it when those signals change.

Applies to `effect()`, `computed()`, `linkedSignal()`, `resource()` callbacks, and `afterRenderEffect()` phases.

```ts
// ❌ error — no tracked reads, effect never re-runs
effect(() => {
  const value = untracked(() => this.count());
  this.log(value);
});

// ✅ ok — count() is read outside untracked, creates a reactive dependency
effect(() => {
  const value = this.count();
  untracked(() => this.log(value));
});
```

```ts
// ❌ error — computed() also loses its dependency
const doubled = computed(() => untracked(() => this.count() * 2));

// ✅ ok
const doubled = computed(() => this.count() * 2);
```
