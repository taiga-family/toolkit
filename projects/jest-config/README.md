# @taiga-ui/jest-config

Common Jest configuration for taiga-ui projects

## Usage

1. Install from npm

```bash
npm i --save-dev @taiga-ui/jest-config jest-preset-angular
```

The preset uses Angular, so `jest-preset-angular` must be installed explicitly. It is not a peer dependency of
`@taiga-ui/jest-config` to avoid pulling Angular into projects that only use `@taiga-ui/configs`.

2. Add to `package.json`

```json
{
  "jest": {
    "preset": "@taiga-ui/jest-config"
  }
}
```
