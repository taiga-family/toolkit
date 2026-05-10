# no-nested-interactive

Disallows nesting interactive HTML elements inside other interactive elements in Angular templates. This catches invalid
structures such as buttons containing links, form controls, focusable elements, or Angular event bindings, while still
allowing a label to wrap its associated control.

```html
<!-- ❌ error -->
<button type="button">
  <a routerLink="/settings">Settings</a>
</button>

<!-- ✅ ok -->
<div>
  <a routerLink="/settings">Settings</a>
</div>
```
