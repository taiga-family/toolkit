# no-implicit-public

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Requires an explicit `public` modifier on all class members and constructor parameter properties that are public.
Constructors are excluded.

```ts
// ❌ error
class MyService {
  value = 42;
  doSomething(): void {}
}

// ✅ after autofix
class MyService {
  public value = 42;
  public doSomething(): void {}
}
```
