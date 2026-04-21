# attrs-newline

<sup>`Fixable`</sup>

Requires line breaks between attributes when a start tag has more than two attributes. This keeps larger HTML tags
readable and makes attribute diffs much easier to scan in Angular templates.

```html
<!-- ❌ error -->
<div
  class="b"
  id="a"
  title="c"
></div>

<!-- ✅ after autofix -->
<div
  class="b"
  id="a"
  title="c"
></div>
```
