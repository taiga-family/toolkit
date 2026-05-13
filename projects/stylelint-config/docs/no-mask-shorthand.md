# no-mask-shorthand

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

> ✅ Included in `recommended`.

Disallows the `mask` shorthand and expands it into explicit `mask-*` longhand declarations. This keeps resets visible,
avoids accidental changes to unrelated mask longhands, and makes review diffs easier to read. Autofix is skipped for
CSS-wide keywords, CSS variables, and values the rule cannot safely classify.

```css
/* ❌ error */
.icon {
  mask: url('icon.svg') no-repeat center / 1rem;
}

/* ✅ after autofix */
.icon {
  mask-image: url('icon.svg');
  mask-repeat: no-repeat;
  mask-position: center;
  mask-size: 1rem;
}
```

## Options

This rule has no options.
