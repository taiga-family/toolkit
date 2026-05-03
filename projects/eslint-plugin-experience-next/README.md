### `@taiga-ui/eslint-plugin-experience-next`

```bash
npm i -D eslint @taiga-ui/eslint-plugin-experience-next
```

`eslint.config.ts`

**Attention**: package does not support commonjs, use `eslint.config.{ts,mjs,js}` instead of `eslint.config.cjs`

```js
import taiga from '@taiga-ui/eslint-plugin-experience-next';

export default [
  ...taiga.configs.recommended,
  // custom rules
  {
    files: ['**/legacy/**/*.ts'],
    rules: {
      '@angular-eslint/prefer-standalone': 'off',
    },
  },
  {
    files: ['**/*'],
    rules: {
      '@angular-eslint/template/button-has-type': 'off',
      '@angular-eslint/template/elements-content': 'off',
      '@typescript-eslint/max-params': 'off',
      'jest/prefer-importing-jest-globals': 'off',
      'sonarjs/prefer-nullish-coalescing': 'off',
    },
  },
];
```

- ✅ = recommended
- 🔧 = fixable
- 💡 = has suggestions

| Rule                                                                                                                                                                                                | Description                                                                                         | ✅  | 🔧  | 💡  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --- | --- | --- |
| [array-as-const](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/array-as-const.md)                                                                   | Exported array of class references should be marked with `as const`                                 |     | 🔧  |     |
| [attrs-newline](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/attrs-newline.md)                                                                     | Enforce one attribute per line when a start tag spans multiple lines                                | ✅  | 🔧  |     |
| [class-property-naming](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/class-property-naming.md)                                                     | Enforce custom naming for class properties based on their type                                      |     | 🔧  |     |
| [decorator-key-sort](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/decorator-key-sort.md)                                                           | Sorts the keys of the object passed to the `@Component/@Injectable/@NgModule/@Pipe` decorator       | ✅  | 🔧  |     |
| [element-newline](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/element-newline.md)                                                                 | Require line breaks around block-level child nodes in HTML templates                                | ✅  | 🔧  |     |
| [flat-exports](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/flat-exports.md)                                                                       | Spread nested arrays when exporting Angular entity collections                                      |     | 🔧  |     |
| [host-attributes-sort](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/host-attributes-sort.md)                                                       | Sort Angular host metadata attributes using configurable attribute groups                           | ✅  | 🔧  |     |
| [html-logical-properties](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/html-logical-properties.md)                                                 | Enforce logical CSS properties over directional ones in Angular template style bindings             | ✅  | 🔧  |     |
| [import-integrity](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/import-integrity.md)                                                               | Fast default import, namespace export, named-as-default, and import cycle checks                    | ✅  |     |     |
| [injection-token-description](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/injection-token-description.md)                                         | Require `InjectionToken` descriptions to include the token name                                     | ✅  | 🔧  |     |
| [no-commonjs-import-patterns](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-commonjs-import-patterns.md)                                         | Disallow legacy CommonJS interop import patterns                                                    | ✅  |     |     |
| [no-deep-imports](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-deep-imports.md)                                                                 | Disables deep imports of Taiga UI packages                                                          | ✅  | 🔧  |     |
| [no-deep-imports-to-indexed-packages](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-deep-imports-to-indexed-packages.md)                         | Disallow deep imports from packages that expose an index.ts next to ng-package.json or package.json | ✅  | 🔧  |     |
| [no-duplicate-attrs](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-duplicate-attrs.md)                                                           | Disallow duplicate attributes on the same HTML element                                              | ✅  |     |     |
| [no-duplicate-id](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-duplicate-id.md)                                                                 | Disallow duplicate static `id` values in HTML templates                                             | ✅  |     |     |
| [no-duplicate-in-head](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-duplicate-in-head.md)                                                       | Disallow duplicate `title`, `base`, and key metadata tags inside `<head>`                           | ✅  |     |     |
| [no-fully-untracked-effect](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-fully-untracked-effect.md)                                             | Disallow reactive callbacks where all signal reads are hidden inside `untracked()`                  | ✅  |     |     |
| [no-href-with-router-link](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-href-with-router-link.md)                                               | Do not use href and routerLink attributes together on the same element                              | ✅  | 🔧  |     |
| [no-import-assertions](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-import-assertions.md)                                                       | Replace legacy `assert { ... }` import assertions with `with { ... }`                               | ✅  | 🔧  |     |
| [no-implicit-public](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-implicit-public.md)                                                           | Require explicit `public` modifier for class members and parameter properties                       | ✅  | 🔧  |     |
| [no-infinite-loop](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-infinite-loop.md)                                                               | Disallow `while (true)` and `for` loops without an explicit condition                               | ✅  |     |     |
| [no-legacy-peer-deps](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-legacy-peer-deps.md)                                                         | Disallow `legacy-peer-deps=true` in `.npmrc`                                                        | ✅  |     |     |
| [no-obsolete-attrs](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-obsolete-attrs.md)                                                             | Disallow obsolete HTML attributes                                                                   | ✅  |     |     |
| [no-obsolete-tags](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-obsolete-tags.md)                                                               | Disallow obsolete HTML tags                                                                         | ✅  |     |     |
| [no-playwright-empty-fill](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-playwright-empty-fill.md)                                               | Enforce `clear()` over `fill('')` in Playwright tests                                               | ✅  | 🔧  |     |
| [no-project-as-in-ng-template](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-project-as-in-ng-template.md)                                       | `ngProjectAs` has no effect inside `<ng-template>` or dynamic outlets                               | ✅  |     |     |
| [no-restricted-attr-values](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-restricted-attr-values.md)                                             | Disallow configured attribute values in Angular templates                                           |     |     |     |
| [no-redundant-type-annotation](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-redundant-type-annotation.md)                                       | Disallow redundant type annotations when the type is already inferred from the initializer          | ✅  | 🔧  |     |
| [no-repeated-signal-in-conditional](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-repeated-signal-in-conditional.md)                             | Disallow reading the same nullable Angular signal more than once in a conditional expression        | ✅  | 🔧  |     |
| [no-side-effects-in-computed](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-side-effects-in-computed.md)                                         | Disallow side effects and effectful helper calls inside Angular `computed()` callbacks              | ✅  |     |     |
| [no-signal-reads-after-await-in-reactive-context](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-signal-reads-after-await-in-reactive-context.md) | Disallow bare signal reads after `await` inside reactive callbacks                                  | ✅  |     |     |
| [no-string-literal-concat](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-string-literal-concat.md)                                               | Disallow string literal concatenation; merge adjacent literals into one                             | ✅  | 🔧  |     |
| [no-untracked-outside-reactive-context](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-untracked-outside-reactive-context.md)                     | Disallow `untracked()` outside reactive callbacks, except explicit post-`await` snapshots           | ✅  | 🔧  |     |
| [no-useless-untracked](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/no-useless-untracked.md)                                                       | Disallow provably useless `untracked()` wrappers in reactive callbacks                              | ✅  | 🔧  |     |
| [object-single-line](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/object-single-line.md)                                                           | Enforce single-line formatting for single-property objects when it fits `printWidth`                | ✅  | 🔧  |     |
| [prefer-combined-if-control-flow](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/prefer-combined-if-control-flow.md)                                 | Combine consecutive `if` statements that use the same `return`, `break`, `continue`, or `throw`     | ✅  | 🔧  |     |
| [prefer-deep-imports](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/prefer-deep-imports.md)                                                         | Allow deep imports of Taiga UI packages                                                             |     | 🔧  |     |
| [prefer-multi-arg-push](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/prefer-multi-arg-push.md)                                                     | Combine consecutive `.push()` calls on the same array into a single multi-argument call             | ✅  | 🔧  |     |
| [prefer-namespace-keyword](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/prefer-namespace-keyword.md)                                               | Replace `module Foo {}` with `namespace Foo {}` for TypeScript namespace declarations               | ✅  | 🔧  |     |
| [prefer-untracked-incidental-signal-reads](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/prefer-untracked-incidental-signal-reads.md)               | Wrap likely-incidental signal reads with `untracked()` in reactive callbacks                        | ✅  | 🔧  |     |
| [prefer-untracked-signal-getter](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/prefer-untracked-signal-getter.md)                                   | Prefer `untracked(signalGetter)` over `untracked(() => signalGetter())` for a single signal getter  | ✅  | 🔧  |     |
| [quotes](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/quotes.md)                                                                                   | Enforce double quotes around HTML attribute values                                                  | ✅  | 🔧  |     |
| [require-doctype](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/require-doctype.md)                                                                 | Require `<!DOCTYPE html>` at the top of HTML documents                                              | ✅  | 🔧  |     |
| [require-img-alt](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/require-img-alt.md)                                                                 | Require `alt` on `<img>` elements, including Angular attribute bindings                             | ✅  |     |     |
| [require-lang](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/require-lang.md)                                                                       | Require a non-empty `lang` attribute on `<html>`                                                    | ✅  |     |     |
| [require-li-container](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/require-li-container.md)                                                       | Require `<li>` to be nested inside `<ul>`, `<ol>`, or `<menu>`                                      | ✅  |     |     |
| [require-title](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/require-title.md)                                                                     | Require a non-empty `<title>` inside `<head>`                                                       | ✅  |     |     |
| [short-tui-imports](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/short-tui-imports.md)                                                             | Shorten TuiXxxComponent / TuiYyyDirective in Angular metadata                                       | ✅  | 🔧  |     |
| [single-line-class-property-spacing](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/single-line-class-property-spacing.md)                           | Group consecutive single-line class properties and separate multiline ones with a blank line        | ✅  | 🔧  |     |
| [single-line-variable-spacing](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/single-line-variable-spacing.md)                                       | Group consecutive single-line variables and separate multiline ones with a blank line               | ✅  | 🔧  |     |
| [standalone-imports-sort](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/standalone-imports-sort.md)                                                 | Auto sort names inside Angular decorators                                                           | ✅  | 🔧  |     |
| [strict-tui-doc-example](https://github.com/taiga-family/toolkit/tree/main/projects/eslint-plugin-experience-next/docs/strict-tui-doc-example.md)                                                   | If you use the addon-doc, there will be a hint that you are importing something incorrectly         |     | 🔧  |     |
