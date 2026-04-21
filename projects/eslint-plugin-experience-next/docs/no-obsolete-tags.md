# no-obsolete-tags

Disallows obsolete HTML tags that should no longer appear in modern markup. This keeps templates aligned with current
HTML standards and avoids legacy presentational elements.

```html
<!-- ❌ error -->
<center>Title</center>

<!-- ✅ ok -->
<div class="centered">Title</div>
```
