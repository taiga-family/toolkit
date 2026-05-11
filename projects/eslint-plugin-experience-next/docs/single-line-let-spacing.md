# single-line-let-spacing

Groups consecutive single-line `@let` declarations together without blank lines between them, while requiring a blank
line before and after multiline `@let` declarations. Also requires a blank line between any `@let` declaration and a
following interpolation (`{{ }}`).

## Examples

### Consecutive single-line `@let` declarations

❌ error

<!-- prettier-ignore -->
```html
@let a = 1;

@let b = 2;
@let c = 3;
```

✅ after autofix

<!-- prettier-ignore -->
```html
@let a = 1;
@let b = 2;
@let c = 3;
```

### Multiline `@let` declarations

❌ error

<!-- prettier-ignore -->
```html
@let a = 1;
@let b = foo(
    value
);
@let c = 3;
```

✅ after autofix

<!-- prettier-ignore -->
```html
@let a = 1;

@let b = foo(
    value
);

@let c = 3;
```

### `@let` followed by interpolation

❌ error

<!-- prettier-ignore -->
```html
@let text = multi() ? texts[2] : texts[1];
{{ single() ? texts[0] : text }}
```

✅ after autofix

<!-- prettier-ignore -->
```html
@let text = multi() ? texts[2] : texts[1];

{{ single() ? texts[0] : text }}
```
