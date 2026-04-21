# no-deep-imports-to-indexed-packages

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Disallows deep imports from any external package whose root `index.ts` (or `index.d.ts`) re-exports the same subpath and
is co-located with a `package.json` or `ng-package.json`. Does not require explicit package lists — resolves via
TypeScript.

```ts
// ❌ error — @my-lib/index.ts already re-exports this subpath
import {Foo} from '@my-lib/internal/foo';

// ✅
import {Foo} from '@my-lib/internal';
```
