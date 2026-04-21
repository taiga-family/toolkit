# prefer-untracked-incidental-signal-reads

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Inside a reactive callback, flags direct signal reads that look like snapshot-only values passed into writable-signal
writes such as `.set()` or into DOM side-effect calls such as `requestFullscreen(...)`. These reads are likely
incidental and should usually not create their own dependency. The rule only reports when the callback already has
another tracked dependency outside the flagged consumer call, and autofix wraps the incidental read with `untracked()`
while adding the import if needed. If the read is intentionally reactive, disable the rule for that line.

```ts
// ❌ error
effect(() => {
  if (this.options().length) {
    this.input.value.set(this.stringified());
  }
});

// ✅ after autofix
effect(() => {
  if (this.options().length) {
    this.input.value.set(untracked(() => this.stringified()));
  }
});
```

```ts
// ❌ error
effect(() => {
  if (this.options().length) {
    const value = this.stringified();

    this.input.value.set(value);
  }
});

// ✅ after autofix
effect(() => {
  if (this.options().length) {
    const value = untracked(() => this.stringified());

    this.input.value.set(value);
  }
});
```

```ts
// ❌ error
effect(async () => {
  if (this.tuiFullscreen()) {
    await this.root()?.requestFullscreen(this.options());
  }
});

// ✅ after autofix
effect(async () => {
  if (this.tuiFullscreen()) {
    await this.root()?.requestFullscreen(untracked(() => this.options()));
  }
});
```
