# require-lang

Requires a non-empty `lang` attribute on the root `<html>` element. Bound Angular forms such as `[attr.lang]` are also
accepted.

```html
<!-- ❌ error -->
<html>
  <body></body>
</html>

<!-- ✅ ok -->
<html lang="en">
  <body></body>
</html>
<html [attr.lang]="locale()">
  <body></body>
</html>
```
