# require-doctype

<sup>`Fixable`</sup>

Requires `<!DOCTYPE html>` at the beginning of HTML documents. Even though Angular's template parser does not expose
doctype nodes directly, the rule still validates and autofixes the source text.

```html
<!-- ❌ error -->
<html lang="en"></html>

<!-- ✅ after autofix -->
<!DOCTYPE html>
<html lang="en"></html>
```
