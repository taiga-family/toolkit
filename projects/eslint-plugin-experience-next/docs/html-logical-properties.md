# html-logical-properties

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Requires logical CSS properties in Angular template style bindings instead of directional ones such as `left`, `right`,
`margin-left`, or `padding-top`. The autofix rewrites the property name to its logical equivalent.

```html
<!-- ❌ error -->
<div [style.left.rem]="spacing"></div>

<!-- ✅ after autofix -->
<div [style.inset-inline-start.rem]="spacing"></div>
```

```html
<!-- ❌ error -->
<div [style.margin-left.rem]="spacing"></div>

<!-- ✅ after autofix -->
<div [style.margin-inline-start.rem]="spacing"></div>
```

```html
<!-- ❌ error -->
<div [style.border-top.px]="offset"></div>

<!-- ✅ after autofix -->
<div [style.border-block-start.px]="offset"></div>
```
