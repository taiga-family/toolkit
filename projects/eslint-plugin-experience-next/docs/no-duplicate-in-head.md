# no-duplicate-in-head

Disallows duplicate singleton tags inside `<head>`, including `<title>`, `<base>`, `meta[charset]`,
`meta[name="viewport"]`, and `link[rel="canonical"]`. Multiple copies of these tags make document metadata unreliable.

```html
<!-- ❌ error -->
<head>
  <title>One</title>
  <title>Two</title>
</head>

<!-- ✅ ok -->
<head>
  <title>One</title>
</head>
```
