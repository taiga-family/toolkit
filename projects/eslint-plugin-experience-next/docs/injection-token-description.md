# injection-token-description

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

The description passed to `new InjectionToken(...)` must contain the name of the variable it is assigned to. The rule
accepts both direct string descriptions and Angular's `ngDevMode ? '...' : ''` pattern, and the autofix rewrites invalid
descriptions to the dev-only form. If `ngDevMode` is not declared in the file, the autofix inserts
`declare const ngDevMode: boolean;` after imports.

```ts
// ❌ error
import {InjectionToken} from '@angular/core';

export const TUI_MY_TOKEN = new InjectionToken<string>('some description');

// ✅ after autofix
import {InjectionToken} from '@angular/core';

declare const ngDevMode: boolean;

export const TUI_MY_TOKEN = new InjectionToken<string>(ngDevMode ? '[TUI_MY_TOKEN]: some description' : '');
```
