# no-webkit-box-orient-block-axis

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

> ✅ Included in `recommended`.

Disallows `-webkit-box-orient: block-axis` and replaces it with `-webkit-box-orient: vertical`. Legacy WebKit line
clamping depends on the physical `vertical` value, so the logical `block-axis` value can break truncation in browsers
that still rely on this property.

```css
/* ❌ error */
.title {
  -webkit-box-orient: block-axis;
}

/* ✅ after autofix */
.title {
  -webkit-box-orient: vertical;
}
```

## Options

This rule has no options.
