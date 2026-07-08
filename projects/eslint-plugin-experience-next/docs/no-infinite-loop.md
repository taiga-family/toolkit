# no-infinite-loop

<sup>`✅ Recommended`</sup>

Disallows the two loop forms banned by this project: `while (true)` and `for` loops without a condition, including the
canonical `for (;;)` form. These loops hide the real exit condition inside the body, which makes control flow harder to
scan and review.

```ts
// ❌ error
while (true) {
  if (isDone) {
    break;
  }

  process();
}

// ✅ ok
while (!isDone) {
  process();
}
```

```ts
// ❌ error
for (;;) {
  if (queue.length === 0) {
    break;
  }

  flush(queue.shift());
}

// ✅ ok
for (; queue.length > 0; ) {
  flush(queue.shift());
}
```
