# template-block-spacing

Requires a blank line between independent sections in Angular templates.

The rule separates `@let` declarations, control-flow blocks, and markup on adjacent lines.

Consecutive single-line `@let` declarations remain grouped by `single-line-let-spacing`.

It preserves indentation and LF/CRLF line endings.

Comments and whitespace-sensitive HTML elements are not affected.

Inline elements and control-flow continuations (`@else`, `@empty`, `@case`, `@placeholder`) are not affected.

## Examples

### Invalid

<!-- prettier-ignore -->
```html
@let current = tasks.state();
@let isEmpty = current.tasks.length === 0;
<section>
    <h2>Tasks</h2>
    @switch (current.status) {
        @case ('loading') {
            <p>Loading</p>
        }
    }
</section>
```

### After autofix

<!-- prettier-ignore -->
```html
@let current = tasks.state();
@let isEmpty = current.tasks.length === 0;

<section>
    <h2>Tasks</h2>

    @switch (current.status) {
        @case ('loading') {
            <p>Loading</p>
        }
    }
</section>
```
