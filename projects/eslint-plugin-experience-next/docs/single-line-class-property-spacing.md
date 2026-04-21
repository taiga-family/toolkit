# single-line-class-property-spacing

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Keeps consecutive single-line field-like class members visually grouped, including `abstract` fields. A multiline field
must be separated from neighboring field-like members with a blank line before it and, when another field follows, a
blank line after it. `get` and `set` accessors always act as visual boundaries and must be separated from surrounding
fields by a blank line. This removes noisy empty lines inside simple field groups without flattening longer, wrapped
initializers or blending fields into accessors.

```ts
// ❌ error
class TuiEditorStarter {
  protected readonly template = import('./import/template.md?raw');

  protected readonly component = import('./import/component.md?raw');
  protected readonly exampleIcons =
    import('./import/angular-to-long-long-long-long-long-long-long-text-for-prettier.json.md?raw');
  protected readonly isE2E = inject(TUI_IS_E2E);
}

// ✅ after autofix
class TuiEditorStarter {
  protected readonly template = import('./import/template.md?raw');
  protected readonly component = import('./import/component.md?raw');

  protected readonly exampleIcons =
    import('./import/angular-to-long-long-long-long-long-long-long-text-for-prettier.json.md?raw');

  protected readonly isE2E = inject(TUI_IS_E2E);
}
```

```ts
// ❌ error
abstract class Example {
  protected readonly template = import('./template.md?raw');
  get component() {
    return this.template;
  }
  public abstract markdown: string;
}

// ✅ after autofix
abstract class Example {
  protected readonly template = import('./template.md?raw');

  get component() {
    return this.template;
  }

  public abstract markdown: string;
}
```
