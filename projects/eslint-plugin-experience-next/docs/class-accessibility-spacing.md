# class-accessibility-spacing

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Requires a blank line between adjacent class members when their accessibility group changes. Explicit `private`,
`protected`, and `public` modifiers define the group; members without a TypeScript accessibility modifier are treated as
`public`, and ECMAScript private fields or methods such as `#value` are treated as `private`. The rule only checks
spacing between existing adjacent members and does not enforce member ordering or remove extra blank lines. Autofix is
intentionally skipped when comments are located between adjacent members to avoid changing comment ownership.

```ts
// ❌ error
class Example {
  private readonly foo = 1;
  protected readonly baz = 3;
  public readonly qux = 4;
}

// ✅ after autofix
class Example {
  private readonly foo = 1;

  protected readonly baz = 3;

  public readonly qux = 4;
}
```

```ts
// ❌ error
class Example {
  #foo = 1;
  protected bar = 2;
}

// ✅ after autofix
class Example {
  #foo = 1;

  protected bar = 2;
}
```
