# @taiga-ui/jest-config

Common Jest configuration for taiga-ui projects.

The package ships two logically separate presets so that non-Angular projects do not have to pull in
`jest-preset-angular` and its Angular peer dependencies:

- `@taiga-ui/jest-config/angular` — for Angular projects (uses `jest-preset-angular`, jsdom, zone.js).
- `@taiga-ui/jest-config/node` — for plain Node / TypeScript projects (uses `ts-jest`, `testEnvironment: 'node'`).

The bare `@taiga-ui/jest-config` preset is kept as an alias for the Angular preset for backward compatibility.

## Usage

1. Install from npm

```bash
npm i --save-dev @taiga-ui/jest-config
```

2. Add the matching preset to `package.json`

Angular project:

```json
{
  "jest": {
    "preset": "@taiga-ui/jest-config/angular"
  }
}
```

Node / plain TypeScript project:

```json
{
  "jest": {
    "preset": "@taiga-ui/jest-config/node"
  }
}
```

> The Angular preset relies on `jest-preset-angular`, `jest-environment-jsdom` and `resize-observer-polyfill`, which are
> declared as **optional** peer dependencies. Install them alongside `@taiga-ui/jest-config` when you use the Angular
> preset.
