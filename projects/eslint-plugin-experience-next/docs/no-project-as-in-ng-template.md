# no-project-as-in-ng-template

<sup>`✅ Recommended`</sup>

`ngProjectAs` has no effect when the element is inside an `<ng-template>`, `*ngTemplateOutlet`, `*ngComponentOutlet`, or
`*polymorpheusOutlet`. Content instantiated through these dynamic outlets does not participate in Angular's static
content projection, so the attribute is silently ignored at runtime.

```html
<!-- ❌ error — inside <ng-template> -->
<ng-template #tpl>
  <div ngProjectAs="[someSlot]">content</div>
</ng-template>

<!-- ❌ error — on the outlet host itself -->
<ng-container
  *ngTemplateOutlet="tpl"
  ngProjectAs="[someSlot]"
></ng-container>

<!-- ❌ error — polymorpheusOutlet -->
<ng-container
  *polymorpheusOutlet="content"
  ngProjectAs="someSlot"
></ng-container>

<!-- ✅ ok — static content projection -->
<div ngProjectAs="[someSlot]">content</div>
```
