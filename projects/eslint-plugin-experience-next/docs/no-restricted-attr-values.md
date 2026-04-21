# no-restricted-attr-values

<sup>`Taiga-specific`</sup>

Disallows configured string values for Angular template attributes, including both plain HTML attributes and literal
string bindings like `[icon]="'@tui.x'"`. This is useful when a project wants to ban hardcoded design-system tokens in
markup and require them to come from component inputs or options objects instead.

```json
{
  "@taiga-ui/experience-next/no-restricted-attr-values": [
    "error",
    {
      "attrPatterns": ["iconStart", "iconEnd", "icon"],
      "attrValuePatterns": ["@tui"],
      "message": "Icons must be configured"
    }
  ]
}
```

```html
<!-- ❌ error -->
<button iconStart="@tui.x"></button>
<tui-icon [icon]="'@tui.chevron-down'"></tui-icon>

<!-- ✅ ok -->
<button [iconStart]="options.iconStart"></button>
<tui-icon [icon]="options.icon"></tui-icon>
```
