# flat-exports

<sup>`Taiga-specific`</sup> <sup>`Fixable`</sup>

When an exported `as const` tuple contains another exported `as const` tuple of Angular classes, it should be spread
rather than nested. This keeps entity collections flat and avoids double-wrapping.

```ts
// ❌ error
export const TuiTextfield = [TuiTextfieldDirective] as const;
export const TuiInput = [TuiTextfield, TuiInputDirective] as const;

// ✅ after autofix
export const TuiTextfield = [TuiTextfieldDirective] as const;
export const TuiInput = [...TuiTextfield, TuiInputDirective] as const;
```
