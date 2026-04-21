# no-string-literal-concat

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Disallows concatenating string literals with `+`. Adjacent string literals are always mergeable into one — splitting
them with `+` adds noise without benefit, and multi-line splits are especially easy to miss.

Replaces the built-in `no-useless-concat` rule, which only catches same-line concatenation.

```ts
// ❌ error
const msg = 'Hello, ' + 'world!';

// ✅ after autofix
const msg = 'Hello, world!';
```

```ts
// ❌ error — also caught across lines
it(
    'returns the last day of month when' +
        ' the result month has fewer days',
    () => { ... },
);

// ✅ after autofix
it('returns the last day of month when the result month has fewer days', () => {
    ...
});
```

```ts
// ❌ error — string variables concatenated with +
const a = 'hello';
const b = 'world';
const c = a + b;

// ✅ after autofix
const c = `${a}${b}`;
```

When the concatenation is a **direct expression inside a template literal**, the parts are inlined into the outer
template instead of producing a nested template literal:

```ts
// ❌ error
const url = `${base}${path + query}`;

// ✅ after autofix — inlined, no nesting
const url = `${base}${path}${query}`;
```

```ts
// ❌ error — literal concat inside template
const mask = `${'HH' + ':MM'}`;

// ✅ after autofix
const mask = `HH:MM`;
```

When the concatenation appears **inside a method call or other expression** within a template literal, the rule skips it
to avoid creating unreadable nested template literals like `` `${`${a}${b}`.method()}` ``.

The rule also **flattens already-nested template literals** produced by earlier autofixes or written by hand:

```ts
// ❌ error
const s = `${`${dateMode}${dateTimeSeparator}`}HH:MM`;

// ✅ after autofix
const s = `${dateMode}${dateTimeSeparator}HH:MM`;
```

Concatenation that uses **inline comments between parts** is intentionally left untouched, as the comments serve as
documentation:

```ts
// ✅ not flagged — comments are preserved
const urlRegex =
  String.raw`^([a-zA-
```
