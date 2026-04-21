# no-playwright-empty-fill

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

In Playwright tests, calling `.fill('')` on a locator should be replaced with `.clear()` — it is the idiomatic way to
empty a field and communicates intent more clearly.

```ts
// ❌ error
await page.getByLabel('Name').fill('');

// ✅ after autofix
await page.getByLabel('Name').clear();
```
