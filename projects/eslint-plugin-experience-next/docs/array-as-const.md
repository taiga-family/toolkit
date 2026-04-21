# array-as-const

<sup>`Taiga-specific`</sup> <sup>`Fixable`</sup>

Exported arrays containing only class references must be marked with `as const` to preserve the tuple type and enable
proper type inference.

```ts
// ❌ error
export const PROVIDERS = [FooService, BarService];

// ✅ after autofix
export const PROVIDERS = [FooService, BarService] as const;
```
