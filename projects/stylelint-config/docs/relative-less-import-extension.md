# relative-less-import-extension

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

> ✅ Included in `recommended`.

Requires relative stylesheet imports to include an explicit file extension. The autofix uses the current file extension
when it is `.less`, `.scss`, or `.css`, and falls back to `.less` otherwise. Package imports, absolute imports, URLs,
data URLs, and paths that already include a style extension are ignored.

```css
/* ❌ error */
@import './tokens';

/* ✅ after autofix */
@import './tokens.less';
```

## Options

This rule has no options.
