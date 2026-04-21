# require-title

Requires a non-empty `<title>` inside `<head>`. Plain text and Angular interpolation are both treated as valid title
content.

```html
<!-- ❌ error -->
<html lang="en">
  <head></head>
  <body></body>
</html>

<!-- ✅ ok -->
<html lang="en">
  <head>
    <title>Page</title>
  </head>
  <body></body>
</html>
<html lang="en">
  <head>
    <title>{{ pageTitle }}</title>
  </head>
  <body></body>
</html>
```
