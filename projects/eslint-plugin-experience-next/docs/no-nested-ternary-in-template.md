# no-nested-ternary-in-template

<sup>`✅ Recommended for Angular 19+`</sup> <sup>`Fixable`</sup>

Reports nested ternary expressions in Angular templates and prefers decomposing the nested branch into an `@let`
declaration before the element that uses it. In `recommended`, the rule is enabled only for Angular 19 and newer. The
autofix is available for bound attributes; interpolations are reported without an autofix because they do not provide a
stable variable name.

```html
<!-- ❌ error -->
<div
  [appearance]="isActive() ? 'primary' : stepState() === 'error' ? 'negative' : 'secondary'"
  [tuiAvatar]="avatarContent()"
></div>

<!-- ✅ after autofix -->
@let appearance = stepState() === 'error' ? 'negative' : 'secondary';

<div
  [appearance]="isActive() ? 'primary' : appearance"
  [tuiAvatar]="avatarContent()"
></div>
```

```html
<!-- ❌ error -->
<div>{{ active ? 'active' : state === 'error' ? 'error' : 'idle' }}</div>
```
