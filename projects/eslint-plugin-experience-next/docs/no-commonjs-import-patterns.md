# no-commonjs-import-patterns

<sup>`✅ Recommended`</sup>

Disallows legacy CommonJS interop import patterns that are brittle under modern ESM-oriented toolchains. It reports
`import foo = require('foo')` and namespace imports that are used as callable values, constructors, or tag functions.

```ts
// ❌ error
import toolkit = require('@taiga-ui/cdk');

import * as createClient from 'legacy-client';
createClient();

// ✅ ok
import toolkit from '@taiga-ui/cdk';

import createClient from 'legacy-client';
createClient();
```
