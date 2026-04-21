# prefer-combined-if-control-flow

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Combine consecutive `if` statements when they have no `else` branch and use the same `return`, `break`, `continue`, or
`throw` statement. The autofix merges their conditions with `||`, while intentionally skipping cases with intervening
code or comments that should remain a separate control-flow boundary.

```ts
// ❌ error
while (true) {
  if (a) continue;
  if (b && c) continue;
}

// ✅ after autofix
while (true) {
  if (a || (b && c)) continue;
}
```

```ts
// ❌ error
if (a || b) {
  return;
}

if (c) {
  return;
}

// ✅ after autofix
if (a || b || c) {
  return;
}
```

```ts
// ❌ error
if (isInvalid) return result;

if (isLegacy && shouldStop) return result;

// ✅ after autofix
if (isInvalid || (isLegacy && shouldStop)) return result;
```

```ts
// ❌ error
while (true) {
  if (isDone) break;
  if (hasError) break;
}

// ✅ after autofix
while (true) {
  if (isDone || hasError) break;
}
```

```ts
// ❌ error
if (isFatal) throw error;

if (isExpired && shouldAbort) throw error;

// ✅ after autofix
if (isFatal || (isExpired && shouldAbort)) throw error;
```

```ts
// not changed — different control flow
while (true) {
  if (isDone) continue;
  if (hasError) break;
}
```

```ts
// not changed — comment keeps branches separate
if (a) {
  return value;
}

// explain why this branch exists
if (b) {
  return value;
}
```
