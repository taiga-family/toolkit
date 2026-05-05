# import-integrity

<sup>`✅ Recommended`</sup>

Combines the useful parts of `import/default`, `import/namespace`, `import/no-cycle`, `import/no-duplicates`,
`import/no-named-as-default`, `import/no-named-as-default-member`, `import/no-self-import`, and
`import/no-useless-path-segments` in a faster TypeScript-aware rule. It checks default imports against project-local
default exports, reports duplicate import declarations, reports modules importing themselves, reports unnecessary
relative import path segments, reports default imports or default re-exports named after a named value export from the
same module, reports default import property access or destructuring that looks like a named export access, checks
static namespace import member access against the imported module value exports, and reports project-local static import
or re-export cycles using a lazy cached import graph per TypeScript program. External modules are ignored for default
import checks by default, and type-only import/export edges are ignored for cycle detection.

```ts
// ❌ error
import users from './users';
```

```ts
// ✅ ok
import users from './users-with-default';
```

```ts
// ❌ error
import bar from './foo';
```

```ts
// ❌ error
export {default as bar} from './foo';
```

```ts
// ✅ ok
import foo from './foo';
```

```ts
// ❌ error
import foo from './foo';

foo.bar;
```

```ts
// ❌ error
import foo from './foo';

const {bar} = foo;
```

```ts
// ❌ error
import {createUser} from './users';
import type {User} from './users';
```

```ts
// ✅ after autofix
import {createUser, type User} from './users';
```

```ts
// ❌ error
import {createUser} from '././users/index';
```

```ts
// ✅ after autofix
import {createUser} from './users';
```

```ts
// ❌ error
// users.ts
import {createUser} from './users';
```

```ts
// ❌ error
import * as users from './users';

users.missingExport();
```

```ts
// ✅ after autofix
import {missingExport} from './users';

missingExport();
```

```ts
// ✅ ok
import * as users from './users';

users.createUser();
```

```ts
// ❌ error
// a.ts
import './b';

// b.ts
import './a';
```

```ts
// ✅ ok
// a.ts
import './b';

// b.ts
export const value = 1;
```

Cycles formed exclusively through Angular DI token references (`inject`, `contentChildren`, `contentChild`,
`viewChildren`, `viewChild`) are not reported. These calls resolve tokens at instantiation time, not at module load
time, so the cycle cannot cause an uninitialized-value problem.

```ts
// ✅ ok — both sides use Angular DI only, safe cycle
// anchor.directive.ts
import {ContainerDirective} from './container.directive';
class AnchorDirective {
  private readonly container = inject(ContainerDirective);
}

// container.directive.ts
import {AnchorDirective} from './anchor.directive';
class ContainerDirective {
  protected readonly anchors = contentChildren(AnchorDirective);
}
```

```ts
// ❌ error — symbol used outside Angular DI at module level
import {ContainerDirective} from './container.directive';
export const TOKEN = ContainerDirective;
```

| Option                         | Type      | Default | Description                                                        |
| ------------------------------ | --------- | ------- | ------------------------------------------------------------------ |
| `checkCycles`                  | `boolean` | `true`  | Report static project-local import and re-export cycles.           |
| `checkDefaultImports`          | `boolean` | `true`  | Report default imports from modules without a default export.      |
| `checkDuplicateImports`        | `boolean` | `true`  | Report repeated imports for the same resolved module.              |
| `checkNamedAsDefault`          | `boolean` | `true`  | Report default imports named after a named export.                 |
| `checkNamedAsDefaultMembers`   | `boolean` | `true`  | Report default import members named after named exports.           |
| `checkNamespaceMembers`        | `boolean` | `true`  | Report namespace member access that is not exported by the module. |
| `checkSelfImports`             | `boolean` | `true`  | Report imports that resolve to the current file.                   |
| `checkUselessPathSegments`     | `boolean` | `true`  | Report unnecessary relative path segments and `/index` suffixes.   |
| `ignoreExternalDefaultImports` | `boolean` | `true`  | Skip default import checks for external libraries.                 |
