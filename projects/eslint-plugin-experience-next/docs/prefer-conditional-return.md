# prefer-conditional-return

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Prefer a single conditional return when an `if` statement returns one expression and the immediately following statement
returns the fallback expression. The rule skips branches with comments, `else`, empty returns, intervening statements,
or a return expression that is already a conditional expression.

```ts
// ❌ error
if (index < count) {
  return {value: index++, done: false};
}

return {value: undefined, done: true};

// ✅ after autofix
return index < count ? {value: index++, done: false} : {value: undefined, done: true};
```

```ts
// ❌ error
if (isReady) {
  return value;
}

return fallback;

// ✅ after autofix
return isReady ? value : fallback;
```

```ts
// not changed: if branch return is already conditional
if (condition) {
  return first ? second : third;
}

return fallback;
```

```ts
// not changed: fallback return is already conditional
if (condition) {
  return value;
}

return first ? second : third;
```
