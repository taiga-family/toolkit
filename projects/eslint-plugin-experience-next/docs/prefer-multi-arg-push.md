# prefer-multi-arg-push

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Combine consecutive `.push()` calls on the same array into a single multi-argument call.

```ts
// ❌ error
output.push('# Getting Started');
output.push('');

// ✅ after autofix
output.push('# Getting Started', '');
```
