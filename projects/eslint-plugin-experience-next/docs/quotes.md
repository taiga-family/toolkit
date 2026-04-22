# quotes

<sup>`Fixable`</sup>

Enforces double quotes around HTML attribute values, including Angular template bindings written in markup. It also adds
missing quotes when the attribute value is currently unquoted.

```html
<!-- ❌ error -->
<div id="foo"></div>

<!-- ✅ after autofix -->
<div id="foo"></div>
<div id='containing "double" quotes'></div>
```
