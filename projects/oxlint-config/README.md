### `@taiga-ui/oxlint-config`

**Important**: Experimental tool. It has partial support for the original rules from
`@taiga-ui/eslint-plugin-experience-next`

[Oxlint](https://oxc.rs/docs/guide/usage/linter.html) - The alternative for Eslint with features:

- 50-100 times faster
- Backward compatibility with Eslint

```shell
npm i -D @taiga-ui/oxlint-config
```

#### Usage: Eslint + Oxlint

In the eslint configuration, disable all out-of-the-box oxlint rules using
[eslint-plugin-oxlint](https://github.com/oxc-project/eslint-plugin-oxlint):

```ts
// eslint.config.ts
import oxlint from 'eslint-plugin-oxlint';

export default [
  // other plugins
  ...oxlint.configs['flat/all'], // oxlint should be the last one
];
```

Create oxlint config:

```json5
// .oxlintrc.json
{
  $schema: './node_modules/oxlint/configuration_schema.json',
  extends: ['./node_modules/@taiga-ui/oxlint-config/.oxlintrc.json'],
}
```

**Important**: Temporarily not supported `extends` from short imports - https://github.com/oxc-project/oxc/issues/15538

Run linters:

```shell
oxlint && eslint
```

For fix use flag `--fix`:

```shell
oxlint --fix && eslint --fix
```

Disabling eslint rules based on oxlint config is supported:

```js
// eslint.config.js
import oxlint from 'eslint-plugin-oxlint';
export default [
  // other plugins
  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
];
```

#### Usage: Oxlint

Create oxlint config:

```json5
// .oxlintrc.json
{
  $schema: './node_modules/oxlint/configuration_schema.json',
  extends: ['./node_modules/@taiga-ui/oxlint-config/.oxlintrc.json'],
}
```

**Important**: Temporarily not supported `extends` from short imports - https://github.com/oxc-project/oxc/issues/15538

Run linter:

```shell
oxlint
```

For fix use flag `--fix`:

```shell
oxlint --fix
```

#### Usage: Nx

The [nx-oxlint](https://github.com/Nas3nmann/nx-oxlint) plugin is available for working with nx

#### Usage: IDE

- Jetbrains - [oxc](https://plugins.jetbrains.com/plugin/27061-oxc)
- VSCode - [oxc](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode)
