# class-property-naming

<sup>`Taiga-specific`</sup> <sup>`Fixable`</sup>

Enforce custom naming conventions for class properties based on their TypeScript type. Useful for enforcing project-wide
patterns (e.g. all `Subject` fields must be called `destroy$`).

Requires explicit configuration — not enabled in `recommended` by default.

```json
{
  "@taiga-ui/experience-next/class-property-naming": [
    "error",
    [
      {
        "fieldNames": ["sub", "subscription"],
        "newFieldName": "destroy$",
        "withTypesSpecifier": ["Subject", "Subscription"]
      }
    ]
  ]
}
```

```ts
// ❌ error
class MyComponent {
  sub = new Subject<void>();
}

// ✅ after autofix
class MyComponent {
  destroy$ = new Subject<void>();
}
```
