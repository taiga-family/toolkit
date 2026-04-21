# object-single-line

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Single-property object literals that fit within `printWidth` characters on one line are collapsed to a single line.
Compatible with Prettier formatting.

```ts
// ❌ error
const x = {
  foo: bar,
};

// ✅ after autofix
const x = {foo: bar};
```

```json
{
  "@taiga-ui/experience-next/object-single-line": ["error", {"printWidth": 90}]
}
```

| Option       | Type     | Default | Description                           |
| ------------ | -------- | ------- | ------------------------------------- |
| `printWidth` | `number` | `90`    | Maximum line length to allow inlining |
