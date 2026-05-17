# at-compat

<sup>`✅ Recommended`</sup>

Keeps indexed access and built-in `.at()` aligned with the current TypeScript `compilerOptions.target` for arrays,
tuples, strings, typed arrays, and subclasses of those built-ins. The rule reads `target` from the TypeScript program
used by `@typescript-eslint/parser`; if that program does not set `target`, it falls back to ES2021 behavior.

## When `target` is `es2021` or older

TypeScript does not downlevel or polyfill `Array.prototype.at` or `String.prototype.at`, so built-in `.at()` calls are
reported when `target` is below ES2022. Safe calls are autofixed to bracket access.

```ts
// ❌ error
const values = [4, 5, 6];
const value = values.at(2);
```

```ts
// ✅ after autofix
const values = [4, 5, 6];
const value = values[2];
```

```ts
// ❌ error
const text = 'Taiga';
const value = text.at(-1);
```

```ts
// ✅ after autofix
const text = 'Taiga';
const value = text[text.length - 1];
```

When replacing `.at(-1)`, the rule uses `receiver[receiver.length - 1]`. If the receiver is a call expression, it stores
that receiver in a temporary `const` or readonly class field so it is not evaluated twice.

```ts
// ❌ error
const value = item.split(' ').at(-1);
```

```ts
// ✅ after autofix
const items = item.split(' ');
const value = items[items.length - 1];
```

## When `target` is `esnext` or ES2022+

Safe non-negative integer bracket access is reported for built-in receivers and autofixed to `.at()`. When the original
code already has a surrounding fallback, the autofix keeps that fallback. Otherwise, the autofix adds `!` so the runtime
value stays the same as bracket access.

```ts
// ❌ error
const values = [4, 5, 6];
const value = values[2];
```

```ts
// ✅ after autofix
const values = [4, 5, 6];
const value = values.at(2)!;
```

```ts
// ❌ error
const values = [4, 5, 6];
const value = values[2] ?? 0;
```

```ts
// ✅ after autofix
const values = [4, 5, 6];
const value = values.at(2) ?? 0;
```

```ts
// ❌ error
const text = 'Taiga';
const value = text[0];
```

```ts
// ✅ after autofix
const text = 'Taiga';
const value = text.at(0)!;
```

```ts
// ✅ ok: custom objects with an unrelated at method are ignored
const lookup = {
  at(index: number): number {
    return index;
  },
};

const value = lookup.at(2);
```
