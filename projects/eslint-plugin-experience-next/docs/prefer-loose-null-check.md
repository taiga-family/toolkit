# prefer-loose-null-check

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Prefer loose null checks (`!= null`, `== null`) over explicit strict comparisons against `null` or `undefined`.

- `x != null` is equivalent to `x !== null && x !== undefined`
- `x == null` is equivalent to `x === null || x === undefined`

The rule handles standalone checks, combined pairs, and `&&` chains of arbitrary length.

## `!==` → `!= null`

```ts
// ❌ error
x !== null;
x !== undefined;
x !== null && x !== undefined;
x !== undefined && x !== null;
x !== null && x !== undefined && x > 0;
x !== null && b === 'c' && x !== undefined;

// ✅ after autofix
x != null;
x != null;
x != null;
x != null;
x != null && x > 0;
x != null && b === 'c';
```

## `===` → `== null`

```ts
// ❌ error
x === null;
x === undefined;
x === null && x === undefined;
x === undefined && x === null;
x === null && b === 'c' && x === undefined;

// ✅ after autofix
x == null;
x == null;
x == null;
x == null;
x == null && b === 'c';
```

## Reversed operand order

```ts
// ❌ error
null !== x;
undefined !== x;
null === x;
undefined === x;

// ✅ after autofix
x != null;
x != null;
x == null;
x == null;
```
