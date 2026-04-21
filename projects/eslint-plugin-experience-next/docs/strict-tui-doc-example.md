# strict-tui-doc-example

<sup>`Taiga-specific`</sup> <sup>`Fixable`</sup>

Validates that properties of a `TuiDocExample`-typed object have keys matching known file-type names (`TypeScript`,
`HTML`, `CSS`, `LESS`, `JavaScript`) and that the import path extension matches the key. Autofix corrects the import
extension.

```ts
// ❌ error — key says "TypeScript" but path has .html extension
readonly example: TuiDocExample = {
    TypeScript: import('./example/index.html?raw'),
};

// ✅ after autofix
readonly example: TuiDocExample = {
    TypeScript: import('./example/index.ts?raw'),
};
```
