# no-duplicate-attrs

Disallows repeated attributes on the same element. The rule works on Angular template AST and catches duplicate plain
HTML attributes before they become ambiguous or silently override one another.

```html
<!-- ❌ error -->
<div
  class="a"
  class="b"
></div>

<!-- ✅ ok -->
<div
  class="a"
  id="b"
></div>
```
