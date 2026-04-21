# require-li-container

Requires `<li>` elements to appear inside `<ul>`, `<ol>`, or `<menu>`. This prevents structurally invalid list markup in
Angular templates.

```html
<!-- ❌ error -->
<div><li>Item</li></div>

<!-- ✅ ok -->
<ul>
  <li>Item</li>
</ul>
```
