# no-import-assertions

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Disallows legacy `assert { ... }` import assertions and rewrites them to `with { ... }` import attributes.

```ts
// ❌ error
import data from './file.json' assert {type: 'json'};

// ✅ after autofix
import data from './file.json' with {type: 'json'};
```
