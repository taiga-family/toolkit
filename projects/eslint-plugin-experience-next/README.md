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

| Rule                        | Description                                                                                   | ✅  | 🔧  | 💡  |
| --------------------------- | --------------------------------------------------------------------------------------------- | --- | --- | --- |
| decorator-key-sort          | Sorts the keys of the object passed to the `@Component/@Injectable/@NgModule/@Pipe` decorator | ✅  | 🔧  |     |
| injection-token-description | They are required to provide a description for `InjectionToken`                               | ✅  |     |     |
| no-deep-imports             | Disables deep imports of Taiga UI packages                                                    | ✅  | 🔧  |     |
| no-implicit-public          | Prevents the use of the public modifier in classes                                            | ✅  | 🔧  |     |
| standalone-imports-sort     | Sort imports alphabetically                                                                   | ✅  | 🔧  |     |
| prefer-deep-imports         | Allow deep imports of Taiga UI packages                                                       |     | 🔧  |     |
| strict-tui-doc-example      | If you use the addon-doc, there will be a hint that you are importing something incorrectly   |     | 🔧  |     |
