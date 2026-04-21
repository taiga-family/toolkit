# require-img-alt

Requires an accessible text alternative on `<img>` elements. The rule accepts plain `alt`, `[alt]`, and `[attr.alt]` so
it works naturally with Angular bindings.

```html
<!-- ❌ error -->
<img src="avatar.png" />

<!-- ✅ ok -->
<img
  src="avatar.png"
  alt="Profile"
/>
<img
  [src]="avatar"
  [attr.alt]="description"
/>
```
