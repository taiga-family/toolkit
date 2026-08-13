# single-line-variable-spacing

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Keeps consecutive single-line variable declarations visually grouped. When another variable declaration follows a
multiline variable declaration, it must be separated from that declaration with a blank line after it; a blank line
before a multiline variable declaration is not required. Exported and non-exported variable declarations are separate
visual groups and must still be separated by a blank line. Variable declarations initialized with direct `require(...)`
or dynamic `import(...)` calls are ignored as import boundaries, so the rule does not add or remove blank lines around
them.

```ts
// ❌ error
let a = 1;
const b = Math.max(
  validatedTimeStringLooooooooooongvalidatedTimeStringLooooooooooong.length - value.length - paddedZeroes,
  0,
);
let c = 3;

// ✅ after autofix
let a = 1;
const b = Math.max(
  validatedTimeStringLooooooooooongvalidatedTimeStringLooooooooooong.length - value.length - paddedZeroes,
  0,
);

let c = 3;
```

```ts
// ❌ error
let a = 1;

let b = 2;

const c = 3;

// ✅ after autofix
let a = 1;
let b = 2;
const c = 3;
```

```ts
// ❌ error
let a = require('path');

let b = 2;

const c = 3;

// ✅ after autofix
let a = require('path');

let b = 2;
const c = 3;
```

```ts
// ❌ error
export const a1 = 1;

export const a2 = 1;

const b1 = 2;

const b2 = 2;

// ✅ after autofix
export const a1 = 1;
export const a2 = 1;

const b1 = 2;
const b2 = 2;
```
