# no-redundant-type-annotation

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Disallow explicit type annotations on class properties and variable declarations when TypeScript can already infer the
same type from the initializer. Requires type information (`parserOptions.project`).

Works well in combination with `unused-imports/no-unused-imports` or `@typescript-eslint/no-unused-vars`, which will
then clean up any import that is no longer referenced after the annotation is removed.

```ts
// ❌ error — type is already inferred from inject()
private readonly options: TuiInputNumberOptions = inject(TUI_INPUT_NUMBER_OPTIONS);

// ✅ after autofix
private readonly options = inject(TUI_INPUT_NUMBER_OPTIONS);
```

```ts
// ❌ error — variable declaration
const service: MyService = inject(MyService);

// ✅ after autofix
const service = inject(MyService);
```

The rule does **not** report when the annotation intentionally widens or changes the type:

```ts
// ✅ ok — annotation widens Dog to Animal
x: Animal = new Dog();

// ✅ ok — annotation adds null to the union
x: MyService | null = inject(MyService);
```

The rule does **not** report when the annotation provides contextual typing that narrows an array literal to a tuple.
Without the annotation TypeScript would infer `number[]` instead of the required tuple type, widening the type and
breaking compilation:

```ts
type SelectionRange = readonly [from: number, to: number];
interface ElementState {
  readonly value: string;
  readonly selection: SelectionRange;
}

// ✅ ok — [0, 0] is inferred as SelectionRange only because of the annotation;
//         removing it would widen the type to ElementState | {value: string; selection: number[]}
const state: ElementState = flag ? {value: '', selection: [0, 0]} : existingState;
```

```json
{
  "@taiga-ui/experience-next/no-redundant-type-annotation": ["error", {"ignoreTupleContextualTyping": true}]
}
```

| Option                        | Type      | Default | Description                                                                                            |
| ----------------------------- | --------- | ------- | ------------------------------------------------------------------------------------------------------ |
| `ignoreTupleContextualTyping` | `boolean` | `true`  | Preserve annotations when they provide contextual typing that narrows an array literal to a tuple type |
