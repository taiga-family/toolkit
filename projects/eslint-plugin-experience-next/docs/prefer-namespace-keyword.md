# prefer-namespace-keyword

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Prefers `namespace Foo {}` over the older `module Foo {}` syntax for TypeScript namespace declarations. External module
augmentations such as `declare module 'pkg' {}` are ignored.

```ts
// ❌ error
module Foo.Bar {
  export type Value = string;
}

// ✅ after autofix
namespace Foo.Bar {
  export type Value = string;
}
```
