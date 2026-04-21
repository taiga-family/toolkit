# element-newline

<sup>`Fixable`</sup>

Requires line breaks around block-level child nodes. Inline text and inline elements can stay on one line, but block
content should be visually separated from its container.

```html
<!-- ❌ error -->
<div><section>Content</section></div>

<!-- ✅ after autofix -->
<div>
  <section>Content</section>
</div>
```
