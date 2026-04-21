# no-legacy-peer-deps

<sup>`✅ Recommended`</sup>

> ✅ Included in `recommended` — applied to `**/.npmrc`.

Disallows `legacy-peer-deps=true` in `.npmrc`. This npm option bypasses peer dependency resolution and can hide real
version conflicts in the dependency graph. The preferred fix is to align incompatible package versions instead of
disabling the resolver.

```ini
# ❌ error
legacy-peer-deps=true

# ✅ ok
strict-peer-deps=true
```

Comments and empty lines are ignored, so the rule only reports an active `legacy-peer-deps=true` entry.
