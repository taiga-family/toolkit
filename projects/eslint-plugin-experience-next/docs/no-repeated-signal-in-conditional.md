# no-repeated-signal-in-conditional

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Disallow reading the same **nullable** Angular signal (`Signal<T | null>` or `Signal<T | undefined>`) more than once
inside a single conditional — either a ternary expression or an `if` statement. When a signal's value can be `null` or
`undefined`, reading it multiple times in a conditional is a code smell: the condition checks for a truthy value, then
the branches read the signal again to use or narrow the type. The autofix extracts the repeated call into a `const`
variable declared immediately before the containing statement, and replaces every occurrence — including any `as Type`
casts — with the variable.

Non-nullable signals (`Signal<T>` where `T` excludes `null` and `undefined`) are intentionally ignored: repeating them
in a conditional is always safe and does not involve type-narrowing.

Optional method or property access on an object signal is also ignored. In cases like `this.editor()?.isActive()`, the
conditional is guarded by optional chaining and the repeated reads are method receivers rather than repeated nullable
value usage that benefits from narrowing.

```ts
// ❌ error — height is Signal<number | null>
protected get hostHeight(): number | string | null {
    return tuiIsNumber(this.height())
        ? tuiPx(this.height() as number)
        : this.height();
}

// ✅ after autofix
protected get hostHeight(): number | string | null {
    const height = this.height();

    return tuiIsNumber(height)
        ? tuiPx(height)
        : height;
}
```

```ts
// ❌ error — value is Signal<string | null>
if (value()) {
  process(value() as string);
}

// ✅ after autofix
const valueVal = value();

if (valueVal) {
  process(valueVal);
}
```

```ts
// ✅ not changed — flag is Signal<boolean> (non-nullable)
const r = flag() ? on() : flag();
if (flag()) {
  doSomething(flag());
}
```

```ts
// ✅ not changed — each nullable signal call appears only once
return this.width() ? this.height() : this.depth();
```

```ts
// ✅ not changed — repeated optional method calls on an object signal
if (this.editor()?.isActive('group')) {
  this.editor()?.setGroupHilite(color);
} else if (this.editor()?.isActive('table')) {
  this.editor()?.setCellColor(color);
}
```
