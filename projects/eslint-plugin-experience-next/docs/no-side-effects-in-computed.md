# no-side-effects-in-computed

<sup>`✅ Recommended`</sup>

`computed()` should only derive a value from its inputs. This rule reports observable side effects inside Angular
`computed()` callbacks, including signal writes (`.set()`, `.update()`, `.mutate()`), `effect()`, `inject()`,
assignments to captured state, `++/--`, `delete`, property mutations on objects that were not created inside the
computation itself, and calls to local helper functions or methods when their bodies perform those operations.

```ts
// ❌ error
import {computed, signal} from '@angular/core';

const source = signal(0);
const target = signal(0);

function syncTarget(): void {
  target.set(source() + 1);
}

const derived = computed(() => {
  syncTarget();
  return target();
});
```

```ts
// ✅ ok
import {computed, signal} from '@angular/core';

const source = signal(0);
const derived = computed(() => source() + 1);
```
