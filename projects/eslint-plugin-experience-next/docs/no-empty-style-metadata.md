# no-empty-style-metadata

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Disallows empty Angular component style metadata. The rule reports empty string and empty template literal values for
`styles` and `styleUrl`, plus `styleUrls: []`, because they do not add component styles and can be safely removed.

```ts
// ❌ error
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styles: ``,
    styleUrl: '',
    styleUrls: [],
})

// ✅ after autofix
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
})
```
