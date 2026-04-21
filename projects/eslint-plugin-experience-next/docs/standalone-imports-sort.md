# standalone-imports-sort

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Sorts the `imports` array inside Angular decorators (`@Component`, `@Directive`, `@NgModule`, `@Pipe`) alphabetically.
Spread elements are placed after named identifiers.

```ts
// ❌ error
@Component({
    imports: [TuiButton, CommonModule, AsyncPipe],
})

// ✅ after autofix
@Component({
    imports: [AsyncPipe, CommonModule, TuiButton],
})
```

```json
{
  "@taiga-ui/experience-next/standalone-imports-sort": [
    "error",
    {"decorators": ["Component", "Directive", "NgModule", "Pipe"]}
  ]
}
```
