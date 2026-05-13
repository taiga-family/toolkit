# @taiga-ui/stylelint-config

Common Stylelint configuration for Taiga UI projects.

```bash
npm i -D stylelint @taiga-ui/stylelint-config
```

`stylelint.config.mjs`

**Attention**: package does not support CommonJS, use `stylelint.config.mjs` or `stylelint.config.js` in a module
package instead of `stylelint.config.cjs`.

```js
export default {
  extends: ['@taiga-ui/stylelint-config'],
};
```

Taiga UI projects can also add the stricter package-specific config:

```js
export default {
  extends: ['@taiga-ui/stylelint-config', '@taiga-ui/stylelint-config/taiga-specific'],
};
```

## Configs

| Config           | Entry point                                 | Description                                      |
| ---------------- | ------------------------------------------- | ------------------------------------------------ |
| `recommended`    | `@taiga-ui/stylelint-config`                | Common CSS, Less, compatibility, and style rules |
| `taiga-specific` | `@taiga-ui/stylelint-config/taiga-specific` | Taiga UI custom property naming                  |

## Recommended config contents

The root entry point combines Taiga UI custom rules with external Stylelint presets and plugins. The exact options live
in
[`configs/recommended.ts`](https://github.com/taiga-family/toolkit/blob/main/projects/stylelint-config/configs/recommended.ts).

| Package                                                                                                         | What is included in `recommended`               |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [Stylelint core](https://stylelint.io/user-guide/rules)                                                         | Individual CSS correctness and formatting rules |
| [@stylistic/stylelint-config](https://github.com/stylelint-stylistic/stylelint-stylistic)                       | Base stylistic preset                           |
| [@stylistic/stylelint-plugin](https://github.com/stylelint-stylistic/stylelint-stylistic)                       | Individual stylistic rule overrides             |
| [stylelint-plugin-logical-css](https://github.com/yuschick/stylelint-plugin-logical-css)                        | Logical property and keyword rules              |
| [stylelint-use-logical](https://github.com/csstools/stylelint-use-logical)                                      | Logical CSS migration rules                     |
| [stylelint-order](https://github.com/hudochenkov/stylelint-order)                                               | Property ordering                               |
| [stylelint-rem-over-px](https://github.com/a-tarasyuk/stylelint-rem-over-px)                                    | Prefer `rem` values over most `px` values       |
| [stylelint-plugin-use-baseline](https://github.com/ryo-manba/stylelint-plugin-use-baseline)                     | Baseline browser feature checks                 |
| [stylelint-no-unsupported-browser-features](https://github.com/ismay/stylelint-no-unsupported-browser-features) | Browserslist compatibility checks               |
| Taiga UI custom rules                                                                                           | Project-specific rules listed below             |

- ✅ = recommended
- 🔧 = fixable

| Rule                                                                                                                                                   | Description                                                               | ✅  | 🔧  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- | --- | --- |
| [no-mask-shorthand](https://github.com/taiga-family/toolkit/tree/main/projects/stylelint-config/docs/no-mask-shorthand.md)                             | Expands `mask` shorthand declarations into explicit longhand declarations | ✅  | 🔧  |
| [no-webkit-box-orient-block-axis](https://github.com/taiga-family/toolkit/tree/main/projects/stylelint-config/docs/no-webkit-box-orient-block-axis.md) | Replaces `-webkit-box-orient: block-axis` with `vertical`                 | ✅  | 🔧  |
| [relative-less-import-extension](https://github.com/taiga-family/toolkit/tree/main/projects/stylelint-config/docs/relative-less-import-extension.md)   | Adds an explicit extension to relative stylesheet imports                 | ✅  | 🔧  |

More information about configuring Stylelint is available in the
[Stylelint documentation](https://stylelint.io/user-guide/configure).
