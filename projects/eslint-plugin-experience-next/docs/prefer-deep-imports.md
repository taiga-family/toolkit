# prefer-deep-imports

<sup>`Taiga-specific`</sup> <sup>`Fixable`</sup>

Enforce imports from the deepest available entry point of Taiga UI packages.

```json
{
  "@taiga-ui/experience-next/prefer-deep-imports": [
    "error",
    {
      "importFilter": ["@taiga-ui/core", "@taiga-ui/kit"],
      "strict": true
    }
  ]
}
```

Use `strict` to forbid imports from intermediate entry points when deeper ones exist (recommended for CI).
