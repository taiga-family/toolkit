# no-signal-reads-after-await-in-reactive-context

<sup>`✅ Recommended`</sup>

Angular tracks signal reads only in synchronous code. If a reactive callback crosses an async boundary, any bare signal
read after `await` will not become a dependency. Snapshot before `await` when you need the earlier value, or make an
intentional post-`await` current-value read explicit with `untracked(...)`.

```ts
// ❌ error
effect(async () => {
  await this.fetchUser();
  console.log(this.theme());
});

// ✅ ok
effect(async () => {
  const theme = this.theme();
  await this.fetchUser();
  console.log(theme);
});
```

```ts
// ✅ ok — explicit current-value read after await
effect(async () => {
  await this.fetchUser();
  console.log(untracked(this.theme));
});
```
