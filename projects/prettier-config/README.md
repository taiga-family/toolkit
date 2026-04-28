# @taiga-ui/prettier-config

Common Prettier configuration for taiga-ui projects. Compatible with taiga-ui eslint configs.

## Usage

1. Install from npm

```bash
npm i --save-dev @taiga-ui/prettier-config
```

1. Create `.prettierrc.js` at project root

```js
module.exports = require('@taiga-ui/prettier-config');
```

## Internal Prettier plugins

The package ships with three internal Prettier plugins that extend default Prettier behavior for project-specific
formatting cases.

### `prettier-plugin-css-custom-properties`

Used for CSS-family files: `*.css`, `*.scss`, and `*.less`.

- Reuses Prettier built-in PostCSS parsers for CSS, SCSS, and LESS.
- Keeps CSS custom property declarations on one line, even when the declaration is longer than `printWidth`.
- Applies only to declarations whose property name starts with `--`.
- Leaves regular CSS, SCSS, and LESS declarations formatted by the original Prettier printer.

```css
:root {
  --tui-font-offset: 0;
  --tui-typography-family-display: inherit;
  --tui-typography-heading-h1: bold calc(var(--tui-font-offset) + 3.125rem) / calc(56 / 50) var(--tui-typography-family-display);
}
```

### `prettier-plugin-embedded-ts`

Used for TypeScript files through the `typescript-embedded-ts` parser.

- Reuses Prettier built-in TypeScript parser and ESTree printer.
- Formats template literals as embedded TypeScript when they are preceded directly by a `/* TS */` or `/* TYPESCRIPT */`
  block comment.
- Marker matching is case-insensitive.
- Formats only plain template literals without expressions.
- Respects Prettier's `embeddedLanguageFormatting: 'off'` option and falls back to the default printer when embedded
  formatting is disabled.

```ts
const code = /* TypeScript */ `
    const value = {foo: 'bar'};
`;
```

### `prettier-plugin-sort`

Used for selected JSON files with the `json-stringify` parser:

- `package.json`
- `ng-package.json`
- `project.json`
- `renovate.json`
- `default.json`
- `tsconfig*.json`

Capabilities:

- Sorts `package.json` with `sort-package-json`.
- Preserves the original order of `package.json` scripts.
- Sorts `tsconfig*.json` top-level keys in this order: `$schema`, `extends`, `compileOnSave`, `compilerOptions`,
  `angularCompilerOptions`, `files`, `include`, `exclude`, `references`; unknown keys are appended alphabetically.
- Sorts `compilerOptions` with `baseUrl`, `rootDir`, and `strict` first; the rest are appended alphabetically.
- Recursively sorts nested object keys alphabetically.
- Preserves array item order.
- Keeps arrays with one or two primitive values on one line for JSON files except `package.json`.
- Leaves objects expanded through Prettier's original JSON printer.
