# short-tui-imports

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

In Angular decorator `imports` arrays, replaces full `TuiXxxComponent` / `TuiYyyDirective` names with their shorthand
aliases (e.g. `TuiButton`). Also updates the corresponding `import` statement.

```ts
// ❌ error
import {TuiButtonDirective} from '@taiga-ui/core';

@Component({
    imports: [TuiButtonDirective],
})

// ✅ after autofix
import {TuiButton} from '@taiga-ui/core';

@Component({
    imports: [TuiButton],
})
```

```json
{
  "@taiga-ui/experience-next/short-tui-imports": [
    "error",
    {
      "decorators": ["Component", "Directive", "NgModule", "Pipe"],
      "exceptions": [{"from": "TuiTextfieldOptionsDirective", "to": "TuiTextfield"}]
    }
  ]
}
```

| Option       | Type                           | Description                                                |
| ------------ | ------------------------------ | ---------------------------------------------------------- |
| `decorators` | `string[]`                     | Decorator names to inspect (default: all Angular ones)     |
| `exceptions` | `{from: string, to: string}[]` | Explicit rename mappings that override the default pattern |
