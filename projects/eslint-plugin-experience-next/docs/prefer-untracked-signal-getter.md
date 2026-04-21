# prefer-untracked-signal-getter

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

When `untracked()` wraps only a single signal getter, prefer passing that getter directly. This keeps the code shorter
while preserving the same untracked signal read semantics. The rule intentionally skips real TypeScript getters, because
property access would happen before `untracked()` starts.

```ts
// ❌ error
const snapshot = untracked(() => this.counter());

// ✅ after autofix
const snapshot = untracked(this.counter);
```
