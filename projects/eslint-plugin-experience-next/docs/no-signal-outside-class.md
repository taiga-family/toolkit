# no-signal-outside-class

<sup>`✅ Recommended`</sup>

Disallow class properties that reference a module-scope Angular signal. If a signal is created at module scope and then
assigned as a class member, the signal creation should be moved directly into the class body.

Module-scope signals used as class properties create implicit shared mutable state and make it harder to reason about
component lifecycle and change detection.

```ts
// ❌ error
import {computed, signal} from '@angular/core';

const showLabels = signal(true);

const texts = computed(() => (showLabels() ? {label: 'Card number'} : {label: ''}));

class CardComponent {
  protected readonly showLabels = showLabels; // ← error: module-scope signal as class property
  protected readonly texts = texts; // ← error: module-scope signal as class property
}
```

```ts
// ✅ move signal creation into the class
import {computed, signal} from '@angular/core';

class CardComponent {
  protected readonly showLabels = signal(true);

  protected readonly texts = computed(() => (this.showLabels() ? {label: 'Card number'} : {label: ''}));
}
```
