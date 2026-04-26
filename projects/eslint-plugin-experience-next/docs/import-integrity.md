# import-integrity

<sup>`✅ Recommended`</sup>

Combines the useful parts of `import/default`, `import/namespace`, `import/no-cycle`, and `import/no-named-as-default`
in a faster TypeScript-aware rule. It checks default imports against project-local default exports, reports default
imports or default re-exports named after a named value export from the same module, checks static namespace import
member access against the imported module value exports, and reports project-local static import or re-export cycles
using a single cached import graph per TypeScript program. External modules are ignored for default import checks by
default, and type-only import/export edges are ignored for cycle detection.

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
import * as users from './users';

users.missingExport();
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

| Option                         | Type      | Default | Description                                                        |
| ------------------------------ | --------- | ------- | ------------------------------------------------------------------ |
| `checkCycles`                  | `boolean` | `true`  | Report static project-local import and re-export cycles.           |
| `checkDefaultImports`          | `boolean` | `true`  | Report default imports from modules without a default export.      |
| `checkNamedAsDefault`          | `boolean` | `true`  | Report default imports named after a named export.                 |
| `checkNamespaceMembers`        | `boolean` | `true`  | Report namespace member access that is not exported by the module. |
| `ignoreExternalDefaultImports` | `boolean` | `true`  | Skip default import checks for external libraries.                 |
