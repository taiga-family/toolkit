# host-attributes-sort

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Sorts Angular `host` metadata entries in `@Component` and `@Directive` using configurable attribute groups, matching the
same grouping model used for template attributes in Prettier. The recommended config enables the rule with a default
group order that places `id` before plain attributes, `class`, animation bindings, inputs, two-way bindings, and
outputs.

```ts
// ❌ error
@Component({
  host: {
    '(click)': 'handleClick()',
    '[value]': 'value()',
    class: 'cmp',
    id: 'cmp-id',
  },
})

// ✅ after autofix
@Component({
  host: {
    id: 'cmp-id',
    class: 'cmp',
    '[value]': 'value()',
    '(click)': 'handleClick()',
  },
})
```

The rule understands the same preset names as `prettier-plugin-organize-attributes`. You can use aggregate presets such
as `$ANGULAR`, `$HTML`, and `$CODE_GUIDE`, or compose atomic presets such as `$CLASS`, `$ID`, `$ARIA`, `$ANGULAR_INPUT`,
`$ANGULAR_TWO_WAY_BINDING`, and `$ANGULAR_OUTPUT`.

```json
{
  "@taiga-ui/experience-next/host-attributes-sort": [
    "error",
    {
      "attributeGroups": ["$ANGULAR"]
    }
  ]
}
```

Use `$ANGULAR` when `host` should follow the familiar Angular template-style order:
`class -> id -> #ref -> *directive -> @animation -> [@animation] -> [(model)] -> [input] -> (output)`.

```json
{
  "@taiga-ui/experience-next/host-attributes-sort": [
    "error",
    {
      "attributeGroups": ["$HTML"]
    }
  ]
}
```

Use `$HTML` when only `class` and `id` should be pulled to the front, and everything else can stay in the trailing
default group.

```json
{
  "@taiga-ui/experience-next/host-attributes-sort": [
    "error",
    {
      "attributeGroups": ["$CODE_GUIDE"]
    }
  ]
}
```

Use `$CODE_GUIDE` for a wider HTML-oriented order: `class`, `id`, `name`, `data-*`, `src`, `for`, `type`, `href`,
`value`, `title`, `alt`, `role`, `aria-*`.

```json
{
  "@taiga-ui/experience-next/host-attributes-sort": [
    "error",
    {
      "attributeGroups": ["$ID", "$DEFAULT", "$ARIA", "$ANGULAR_OUTPUT"]
    }
  ]
}
```

Use atomic presets when you want a custom order instead of one of the bundled aliases.

| Option                | Type                        | Description                                                       |
| --------------------- | --------------------------- | ----------------------------------------------------------------- |
| `attributeGroups`     | `string[]`                  | Group order. Supports the same preset tokens as Prettier plugins. |
| `attributeIgnoreCase` | `boolean`                   | Ignore case when matching custom regexp groups.                   |
| `attributeSort`       | `'ASC' \| 'DESC' \| 'NONE'` | Sort order inside each matched group.                             |
| `decorators`          | `string[]`                  | Decorator names whose `host` metadata should be checked.          |
