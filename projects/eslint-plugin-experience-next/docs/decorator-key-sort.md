# decorator-key-sort

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Enforces a consistent key order inside Angular decorator objects (`@Component`, `@Directive`, `@NgModule`, `@Pipe`,
`@Injectable`). The expected order is passed as configuration.

```json
{
  "@taiga-ui/experience-next/decorator-key-sort": [
    "error",
    {
      "Component": ["standalone", "selector", "imports", "templateUrl", "styleUrl", "changeDetection"],
      "Pipe": ["standalone", "name", "pure"]
    }
  ]
}
```

```ts
// ❌ error
@Component({
    templateUrl: './app.component.html',
    selector: 'app-root',
    standalone: true,
})

// ✅ after autofix
@Component({
    standalone: true,
    selector: 'app-root',
    templateUrl: './app.component.html',
})
```
