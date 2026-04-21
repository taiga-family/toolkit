# no-duplicate-id

Disallows duplicate static `id` values within the same HTML template. This helps keep selectors, label associations, and
accessibility relationships deterministic.

```html
<!-- ❌ error -->
<label for="name"></label>
<input id="name" />
<div id="name"></div>

<!-- ✅ ok -->
<label for="name"></label>
<input id="name" />
<div id="description"></div>
```
