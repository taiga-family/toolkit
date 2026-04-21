# no-obsolete-attrs

Disallows obsolete HTML attributes such as presentational or deprecated legacy attributes that should be replaced with
modern HTML or CSS.

```html
<!-- ❌ error -->
<table border="1"></table>

<!-- ✅ ok -->
<table class="with-border"></table>
```
