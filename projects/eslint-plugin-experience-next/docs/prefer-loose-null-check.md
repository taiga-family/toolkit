# prefer-loose-null-check

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Prefer loose null checks over paired strict comparisons against `null` and `undefined`.

The rule reports paired checks in the same `&&` chain, regardless of whether `null` or `undefined` comes first and
regardless of operand order.

## `!==` to `!= null`

```ts
// ❌ error
x !== null && x !== undefined;
x !== undefined && x !== null;
null !== x && undefined !== x;
x !== null && y === 'C' && x !== undefined;

// ✅ after autofix
x != null;
x != null;
x != null;
x != null && y === 'C';
```

## `===` to `== null`

```ts
// ❌ error
x === null && x === undefined;
x === undefined && x === null;
null === x && undefined === x;
x === null && y === 'C' && x === undefined;

// ✅ after autofix
x == null;
x == null;
x == null;
x == null && y === 'C';
```
