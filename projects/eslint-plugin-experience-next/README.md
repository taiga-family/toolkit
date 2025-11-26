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

| Rule                                | Description                                                                                         | ✅  | 🔧  | 💡  |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- | --- | --- | --- |
| array-as-const                      | Exported array of class references should be marked with `as const`                                 |     | 🔧  |     |
| class-property-naming               | Enforce custom naming for class properties based on their type                                      |     | 🔧  |     |
| decorator-key-sort                  | Sorts the keys of the object passed to the `@Component/@Injectable/@NgModule/@Pipe` decorator       | ✅  | 🔧  |     |
| flat-exports                        | Spread nested arrays when exporting Angular entity collections                                      |     | 🔧  |     |
| injection-token-description         | They are required to provide a description for `InjectionToken`                                     | ✅  |     |     |
| no-deep-imports                     | Disables deep imports of Taiga UI packages                                                          | ✅  | 🔧  |     |
| no-deep-imports-to-indexed-packages | Disallow deep imports from packages that expose an index.ts next to ng-package.json or package.json | ✅  | 🔧  |     |
| no-href-with-router-link            | Do not use href and routerLink attributes together on the same element                              |     | 🔧  |     |
| no-implicit-public                  | Require explicit `public` modifier for class members and parameter properties                       | ✅  | 🔧  |     |
| standalone-imports-sort             | Sort imports alphabetically                                                                         | ✅  | 🔧  |     |
| prefer-deep-imports                 | Allow deep imports of Taiga UI packages                                                             |     | 🔧  |     |
| short-tui-imports                   | Shorten TuiXxxComponent / TuiYyyDirective in Angular metadata                                       | ✅  | 🔧  |     |
| standalone-imports-sort             | Auto sort names inside Angular decorators                                                           | ✅  | 🔧  |     |
| strict-tui-doc-example              | If you use the addon-doc, there will be a hint that you are importing something incorrectly         |     | 🔧  |     |

## prefer-deep-imports

Enforce imports from the deepest available entry point of Taiga UI packages.

```json
{
    "@taiga-ui/experience-next/prefer-deep-imports": [
        "error",
        {
            "importFilter": ["@taiga-ui/core", "@taiga-ui/kit"],
            "strict": true
        }
    ]
}
```

Use `strict` to forbid imports from intermediate entry points when deeper ones exist (recommended for CI).
