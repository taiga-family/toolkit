# no-deep-imports

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Disallows deep path imports from Taiga UI packages — imports must go through the package root. Works for any
`@taiga-ui/*` package by default. Autofix strips the deep path.

```ts
// ❌ error
import {TuiButton} from '@taiga-ui/core/components/button';

// ✅ after autofix
import {TuiButton} from '@taiga-ui/core';
```

```json
{
  "@taiga-ui/experience-next/no-deep-imports": [
    "error",
    {
      "currentProject": "(?<=projects/)([\\w-]+)",
      "ignoreImports": ["\\?raw", "@taiga-ui/testing/cypress"]
    }
  ]
}
```

| Option              | Type       | Description                                                                |
| ------------------- | ---------- | -------------------------------------------------------------------------- |
| `currentProject`    | `string`   | RegExp to extract the current project name from the file path              |
| `deepImport`        | `string`   | RegExp to detect the deep import segment (default: `@taiga-ui/` sub-paths) |
| `importDeclaration` | `string`   | RegExp to match import declarations the rule applies to                    |
| `ignoreImports`     | `string[]` | RegExp patterns for imports to ignore                                      |
| `projectName`       | `string`   | RegExp to extract the package name from the import source                  |
