# quotes

<sup>`Fixable`</sup>

Enforces double quotes around HTML attribute values, including Angular template bindings written in markup. It also adds
missing quotes when the attribute value is currently unquoted.

```html
<!-- ❌ error -->
<div
  class="foo"
  title="bar"
></div>

<!-- ✅ after autofix -->
<div
  class="foo"
  title="bar"
></div>
```
