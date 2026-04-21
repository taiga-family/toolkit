# no-href-with-router-link

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

> ✅ Included in `recommended` — processed by the angular-eslint template parser (`**/*.html`).

Disallows using both `href` and `routerLink` on the same `<a>` element in Angular templates. Autofix removes the `href`
attribute.

```html
<!-- ❌ error -->
<a
  href="/home"
  routerLink="/home"
>
  Home
</a>

<!-- ✅ after autofix -->
<a routerLink="/home">Home</a>
```
