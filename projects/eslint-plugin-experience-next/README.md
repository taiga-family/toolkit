### `@taiga-ui/eslint-plugin-experience-next`

```bash
npm i -D eslint @taiga-ui/eslint-plugin-experience-next
```

`eslint.config.ts`

**Attention**: package does not support commonjs, use `eslint.config.{ts,mjs,js}` instead of `eslint.config.cjs`

```js
import taiga from '@taiga-ui/eslint-plugin-experience-next';

export default [
  ...taiga.configs.recommended,
  // custom rules
  {
    files: ['**/legacy/**/*.ts'],
    rules: {
      '@angular-eslint/prefer-standalone': 'off',
    },
  },
  {
    files: ['**/*'],
    rules: {
      '@angular-eslint/template/button-has-type': 'off',
      '@angular-eslint/template/elements-content': 'off',
      '@typescript-eslint/max-params': 'off',
      'jest/prefer-importing-jest-globals': 'off',
      'sonarjs/prefer-nullish-coalescing': 'off',
    },
  },
];
```

- ✅ = recommended
- 🔧 = fixable
- 💡 = has suggestions

| Rule                                            | Description                                                                                         | ✅  | 🔧  | 💡  |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------- | --- | --- | --- |
| array-as-const                                  | Exported array of class references should be marked with `as const`                                 |     | 🔧  |     |
| class-property-naming                           | Enforce custom naming for class properties based on their type                                      |     | 🔧  |     |
| decorator-key-sort                              | Sorts the keys of the object passed to the `@Component/@Injectable/@NgModule/@Pipe` decorator       | ✅  | 🔧  |     |
| flat-exports                                    | Spread nested arrays when exporting Angular entity collections                                      |     | 🔧  |     |
| injection-token-description                     | They are required to provide a description for `InjectionToken`                                     | ✅  |     |     |
| no-deep-imports                                 | Disables deep imports of Taiga UI packages                                                          | ✅  | 🔧  |     |
| no-deep-imports-to-indexed-packages             | Disallow deep imports from packages that expose an index.ts next to ng-package.json or package.json | ✅  | 🔧  |     |
| no-fully-untracked-effect                       | Disallow reactive callbacks where all signal reads are hidden inside `untracked()`                  | ✅  |     |     |
| no-href-with-router-link                        | Do not use href and routerLink attributes together on the same element                              | ✅  | 🔧  |     |
| no-implicit-public                              | Require explicit `public` modifier for class members and parameter properties                       | ✅  | 🔧  |     |
| no-legacy-peer-deps                             | Disallow `legacy-peer-deps=true` in `.npmrc`                                                        | ✅  |     |     |
| no-playwright-empty-fill                        | Enforce `clear()` over `fill('')` in Playwright tests                                               | ✅  | 🔧  |     |
| no-project-as-in-ng-template                    | `ngProjectAs` has no effect inside `<ng-template>` or dynamic outlets                               | ✅  |     |     |
| no-redundant-type-annotation                    | Disallow redundant type annotations when the type is already inferred from the initializer          | ✅  | 🔧  |     |
| no-signal-reads-after-await-in-reactive-context | Disallow signal reads after `await` inside reactive callbacks                                       | ✅  |     |     |
| no-string-literal-concat                        | Disallow string literal concatenation; merge adjacent literals into one                             | ✅  | 🔧  |     |
| no-untracked-outside-reactive-context           | Disallow `untracked()` outside the synchronous body of reactive callbacks                           | ✅  | 🔧  |     |
| no-useless-untracked                            | Disallow provably useless `untracked()` wrappers in reactive callbacks                              | ✅  | 🔧  |     |
| object-single-line                              | Enforce single-line formatting for single-property objects when it fits `printWidth`                | ✅  | 🔧  |     |
| prefer-deep-imports                             | Allow deep imports of Taiga UI packages                                                             |     | 🔧  |     |
| prefer-multi-arg-push                           | Combine consecutive `.push()` calls on the same array into a single multi-argument call             | ✅  | 🔧  |     |
| prefer-untracked-incidental-signal-reads        | Wrap likely-incidental signal reads with `untracked()` in reactive callbacks                        | ✅  | 🔧  |     |
| prefer-untracked-signal-getter                  | Prefer `untracked(signalGetter)` over `untracked(() => signalGetter())` for a single signal getter  | ✅  | 🔧  |     |
| short-tui-imports                               | Shorten TuiXxxComponent / TuiYyyDirective in Angular metadata                                       | ✅  | 🔧  |     |
| standalone-imports-sort                         | Auto sort names inside Angular decorators                                                           | ✅  | 🔧  |     |
| strict-tui-doc-example                          | If you use the addon-doc, there will be a hint that you are importing something incorrectly         |     | 🔧  |     |

---

## array-as-const

<sup>`Taiga-specific`</sup> <sup>`Fixable`</sup>

Exported arrays containing only class references must be marked with `as const` to preserve the tuple type and enable
proper type inference.

```ts
// ❌ error
export const PROVIDERS = [FooService, BarService];

// ✅ after autofix
export const PROVIDERS = [FooService, BarService] as const;
```

---

## class-property-naming

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

---

## decorator-key-sort

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

---

## flat-exports

<sup>`Taiga-specific`</sup> <sup>`Fixable`</sup>

When an exported `as const` tuple contains another exported `as const` tuple of Angular classes, it should be spread
rather than nested. This keeps entity collections flat and avoids double-wrapping.

```ts
// ❌ error
export const TuiTextfield = [TuiTextfieldDirective] as const;
export const TuiInput = [TuiTextfield, TuiInputDirective] as const;

// ✅ after autofix
export const TuiTextfield = [TuiTextfieldDirective] as const;
export const TuiInput = [...TuiTextfield, TuiInputDirective] as const;
```

---

## injection-token-description

<sup>`✅ Recommended`</sup>

The description string passed to `new InjectionToken(...)` must contain the name of the variable it is assigned to. This
makes token names visible in Angular DevTools and error messages.

```ts
// ❌ error — description does not mention TUI_MY_TOKEN
const TUI_MY_TOKEN = new InjectionToken<string>('some description');

// ✅ after autofix
const TUI_MY_TOKEN = new InjectionToken<string>('[TUI_MY_TOKEN]: some description');
```

---

## no-deep-imports

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Disallows deep path imports from Taiga UI packages — imports must go through the package root. Works for any
`@taiga-ui/*` package by default. Autofix strips the deep path.

```ts
// ❌ error
import {TuiButton} from '@taiga-ui/core/components/button';

// ✅ after autofix
import {TuiButton} from '@taiga-ui/core';
```

```json
{
  "@taiga-ui/experience-next/no-deep-imports": [
    "error",
    {
      "currentProject": "(?<=projects/)([\\w-]+)",
      "ignoreImports": ["\\?raw", "@taiga-ui/testing/cypress"]
    }
  ]
}
```

| Option              | Type       | Description                                                                |
| ------------------- | ---------- | -------------------------------------------------------------------------- |
| `currentProject`    | `string`   | RegExp to extract the current project name from the file path              |
| `deepImport`        | `string`   | RegExp to detect the deep import segment (default: `@taiga-ui/` sub-paths) |
| `importDeclaration` | `string`   | RegExp to match import declarations the rule applies to                    |
| `ignoreImports`     | `string[]` | RegExp patterns for imports to ignore                                      |
| `projectName`       | `string`   | RegExp to extract the package name from the import source                  |

---

## no-deep-imports-to-indexed-packages

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Disallows deep imports from any external package whose root `index.ts` (or `index.d.ts`) re-exports the same subpath and
is co-located with a `package.json` or `ng-package.json`. Does not require explicit package lists — resolves via
TypeScript.

```ts
// ❌ error — @my-lib/index.ts already re-exports this subpath
import {Foo} from '@my-lib/internal/foo';

// ✅
import {Foo} from '@my-lib/internal';
```

---

## no-fully-untracked-effect

<sup>`✅ Recommended`</sup>

Reports a reactive callback whose signal reads are all wrapped in `untracked()`. That leaves the callback without
tracked dependencies, so Angular will not re-run it when those signals change.

Applies to `effect()`, `computed()`, `linkedSignal()`, `resource()` callbacks, and `afterRenderEffect()` phases.

```ts
// ❌ error — no tracked reads, effect never re-runs
effect(() => {
  const value = untracked(() => this.count());
  this.log(value);
});

// ✅ ok — count() is read outside untracked, creates a reactive dependency
effect(() => {
  const value = this.count();
  untracked(() => this.log(value));
});
```

```ts
// ❌ error — computed() also loses its dependency
const doubled = computed(() => untracked(() => this.count() * 2));

// ✅ ok
const doubled = computed(() => this.count() * 2);
```

---

## no-href-with-router-link

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

> ✅ Included in `recommended` — processed by the angular-eslint template parser (`**/*.html`).

Disallows using both `href` and `routerLink` on the same `<a>` element in Angular templates. Autofix removes the `href`
attribute.

```html
<!-- ❌ error -->
<a
  href="/home"
  routerLink="/home"
>
  Home
</a>

<!-- ✅ after autofix -->
<a routerLink="/home">Home</a>
```

---

## no-implicit-public

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Requires an explicit `public` modifier on all class members and constructor parameter properties that are public.
Constructors are excluded.

```ts
// ❌ error
class MyService {
  value = 42;
  doSomething(): void {}
}

// ✅ after autofix
class MyService {
  public value = 42;
  public doSomething(): void {}
}
```

---

## no-legacy-peer-deps

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

---

## no-playwright-empty-fill

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

In Playwright tests, calling `.fill('')` on a locator should be replaced with `.clear()` — it is the idiomatic way to
empty a field and communicates intent more clearly.

```ts
// ❌ error
await page.getByLabel('Name').fill('');

// ✅ after autofix
await page.getByLabel('Name').clear();
```

---

## no-project-as-in-ng-template

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

---

## no-string-literal-concat

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Disallows concatenating string literals with `+`. Adjacent string literals are always mergeable into one — splitting
them with `+` adds noise without benefit, and multi-line splits are especially easy to miss.

Replaces the built-in `no-useless-concat` rule, which only catches same-line concatenation.

```ts
// ❌ error
const msg = 'Hello, ' + 'world!';

// ✅ after autofix
const msg = 'Hello, world!';
```

```ts
// ❌ error — also caught across lines
it(
    'returns the last day of month when' +
        ' the result month has fewer days',
    () => { ... },
);

// ✅ after autofix
it('returns the last day of month when the result month has fewer days', () => {
    ...
});
```

```ts
// ❌ error — string variables concatenated with +
const a = 'hello';
const b = 'world';
const c = a + b;

// ✅ after autofix
const c = `${a}${b}`;
```

When the concatenation is a **direct expression inside a template literal**, the parts are inlined into the outer
template instead of producing a nested template literal:

```ts
// ❌ error
const url = `${base}${path + query}`;

// ✅ after autofix — inlined, no nesting
const url = `${base}${path}${query}`;
```

```ts
// ❌ error — literal concat inside template
const mask = `${'HH' + ':MM'}`;

// ✅ after autofix
const mask = `HH:MM`;
```

When the concatenation appears **inside a method call or other expression** within a template literal, the rule skips it
to avoid creating unreadable nested template literals like `` `${`${a}${b}`.method()}` ``.

The rule also **flattens already-nested template literals** produced by earlier autofixes or written by hand:

```ts
// ❌ error
const s = `${`${dateMode}${dateTimeSeparator}`}HH:MM`;

// ✅ after autofix
const s = `${dateMode}${dateTimeSeparator}HH:MM`;
```

Concatenation that uses **inline comments between parts** is intentionally left untouched, as the comments serve as
documentation:

```ts
// ✅ not flagged — comments are preserved
const urlRegex =
  String.raw`^([a-zA-Z]+:\/\/)?` + // protocol
  String.raw`([\w-]+\.)+[\w]{2,}` + // domain
  String.raw`(\/\S*)?$`; // path
```

> For mixed concatenation (`'prefix' + variable`) use the standard `prefer-template` rule, which is already enabled in
> `recommended`. Template literals (`` `foo` + `bar` ``) and tagged templates are not flagged by this rule.

---

## no-useless-untracked

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Inside a reactive callback, `untracked()` is only meaningful when its inner function reads signals or intentionally
wraps opaque external code that may read signals. It can also be a valid escape hatch when a reactive callback needs to
create another reactive owner such as `effect()` without inheriting the ambient reactive context. Wrapping code with no
signal reads and no such escape-hatch purpose in `untracked()` is noise. Autofix unwraps the callback in-place when that
is structurally safe and removes the `untracked` import when it is no longer used elsewhere. Snapshot reads that later
influence branching are still valid and are not reported, because Angular allows incidental reads inside `effect()` and
similar reactive callbacks.

```ts
// ❌ error — no signal reads inside untracked, wrapper is pointless
effect(() => {
  untracked(() => {
    this.count.set(0);
  });
});

// ✅ after autofix
effect(() => {
  this.count.set(0);
});
```

```ts
// ✅ ok — snapshot reads may influence control flow without becoming dependencies
effect(() => {
  const value = untracked(() => this.value());

  if (this.showAdjacent() && value !== null) {
    this.month.set(value);
  }
});
```

```ts
// ✅ ok — linkedSignal fallback may intentionally read a snapshot
const activeYear = linkedSignal(() => {
  const year = this.year();

  if (year) {
    return year;
  }

  const value = untracked(() => this.value());

  return value ?? TODAY;
});
```

```ts
// ✅ ok — wrapping external code is a valid Angular use-case
effect(() => {
  const user = this.user();
  untracked(() => this.logger.log(user));
});
```

```ts
// ✅ ok — creating a nested effect() may need to escape the current reactive context
const doubled = computed(() => {
  untracked(() => {
    effect(() => {
      console.log(this.count());
    });
  });

  return this.count() * 2;
});
```

---

## no-signal-reads-after-await-in-reactive-context

<sup>`✅ Recommended`</sup>

Angular tracks signal reads only in synchronous code. If a reactive callback crosses an async boundary, any signal read
after `await` will not become a dependency.

```ts
// ❌ error
effect(async () => {
  await this.fetchUser();
  console.log(this.theme());
});

// ✅ ok
effect(async () => {
  const theme = this.theme();
  await this.fetchUser();
  console.log(theme);
});
```

---

## no-untracked-outside-reactive-context

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

`untracked()` usually only affects signal reads that happen inside the synchronous body of a reactive callback. In
ordinary non-reactive code, nested callbacks, or code that runs after `await`, it usually does not prevent dependency
tracking and only adds noise. This rule reports those cases, but intentionally allows a few imperative Angular escape
hatches where `untracked()` can still be useful: `@Pipe().transform`, `ControlValueAccessor.writeValue`,
`registerOnChange` including patched accessors such as `accessor.writeValue = (...) => {}`, callback-form wrappers used
inside deferred scheduler / event-handler callbacks, and narrow lazy DI factory wrappers like
`InjectionToken({factory})` / `useFactory` when they guard creation of a reactive owner such as `effect()` against an
accidental ambient reactive context. For the narrow case `untracked(() => effect(...))` and similar outer wrappers
around a reactive call in ordinary code, autofix removes only the useless outer `untracked()` wrapper.

```ts
// ❌ error
const snapshot = untracked(this.user);

effect(() => {
  button.addEventListener('click', () => {
    console.log(untracked(this.user));
  });
});
```

```ts
// ✅ ok
effect(() => {
  console.log(untracked(this.user));
});

const snapshot = computed(() => untracked(this.user));
```

```ts
// ❌ error
untracked(() => {
  effect(() => {
    console.log(this.user());
  });
});

// ✅ after autofix
effect(() => {
  console.log(this.user());
});
```

```ts
// ✅ ok — imperative Angular hooks may still need untracked
@Pipe({name: 'demo', pure: false})
export class DemoPipe implements PipeTransform {
  private readonly value = signal('');

  transform(next: string): string {
    untracked(() => this.value.set(next));
    return this.value();
  }
}
```

```ts
// ✅ ok — deferred callback wrappers may execute under reactive control later
const update = (): void => untracked(() => value.set(input.value));

input.addEventListener('input', update, {capture: true});
```

```ts
// ✅ ok — lazy DI factories may first execute from an ambient reactive context
export const TOKEN = new InjectionToken<void>('TOKEN', {
  factory: () => {
    untracked(() => {
      effect(() => {
        console.log(count());
      });
    });
  },
});
```

---

## object-single-line

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Single-property object literals that fit within `printWidth` characters on one line are collapsed to a single line.
Compatible with Prettier formatting.

```ts
// ❌ error
const x = {
  foo: bar,
};

// ✅ after autofix
const x = {foo: bar};
```

```json
{
  "@taiga-ui/experience-next/object-single-line": ["error", {"printWidth": 90}]
}
```

| Option       | Type     | Default | Description                           |
| ------------ | -------- | ------- | ------------------------------------- |
| `printWidth` | `number` | `90`    | Maximum line length to allow inlining |

---

## prefer-deep-imports

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

---

## prefer-multi-arg-push

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Combine consecutive `.push()` calls on the same array into a single multi-argument call.

```ts
// ❌ error
output.push('# Getting Started');
output.push('');

// ✅ after autofix
output.push('# Getting Started', '');
```

---

## prefer-untracked-incidental-signal-reads

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

Inside a reactive callback, flags direct signal reads that look like snapshot-only values passed into writable-signal
writes such as `.set()` or into DOM side-effect calls such as `requestFullscreen(...)`. These reads are likely
incidental and should usually not create their own dependency. The rule only reports when the callback already has
another tracked dependency outside the flagged consumer call, and autofix wraps the incidental read with `untracked()`
while adding the import if needed. If the read is intentionally reactive, disable the rule for that line.

```ts
// ❌ error
effect(() => {
  if (this.options().length) {
    this.input.value.set(this.stringified());
  }
});

// ✅ after autofix
effect(() => {
  if (this.options().length) {
    this.input.value.set(untracked(() => this.stringified()));
  }
});
```

```ts
// ❌ error
effect(() => {
  if (this.options().length) {
    const value = this.stringified();

    this.input.value.set(value);
  }
});

// ✅ after autofix
effect(() => {
  if (this.options().length) {
    const value = untracked(() => this.stringified());

    this.input.value.set(value);
  }
});
```

```ts
// ❌ error
effect(async () => {
  if (this.tuiFullscreen()) {
    await this.root()?.requestFullscreen(this.options());
  }
});

// ✅ after autofix
effect(async () => {
  if (this.tuiFullscreen()) {
    await this.root()?.requestFullscreen(untracked(() => this.options()));
  }
});
```

---

## prefer-untracked-signal-getter

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

When `untracked()` wraps only a single signal getter, prefer passing that getter directly. This keeps the code shorter
while preserving the same untracked signal read semantics. The rule intentionally skips real TypeScript getters, because
property access would happen before `untracked()` starts.

```ts
// ❌ error
const snapshot = untracked(() => this.counter());

// ✅ after autofix
const snapshot = untracked(this.counter);
```

---

## short-tui-imports

<sup>`✅ Recommended`</sup> <sup>`Fixable`</sup>

In Angular decorator `imports` arrays, replaces full `TuiXxxComponent` / `TuiYyyDirective` names with their shorthand
aliases (e.g. `TuiButton`). Also updates the corresponding `import` statement.

```ts
// ❌ error
import {TuiButtonDirective} from '@taiga-ui/core';

@Component({
    imports: [TuiButtonDirective],
})

// ✅ after autofix
import {TuiButton} from '@taiga-ui/core';

@Component({
    imports: [TuiButton],
})
```

```json
{
  "@taiga-ui/experience-next/short-tui-imports": [
    "error",
    {
      "decorators": ["Component", "Directive", "NgModule", "Pipe"],
      "exceptions": [{"from": "TuiTextfieldOptionsDirective", "to": "TuiTextfield"}]
    }
  ]
}
```

| Option       | Type                           | Description                                                |
| ------------ | ------------------------------ | ---------------------------------------------------------- |
| `decorators` | `string[]`                     | Decorator names to inspect (default: all Angular ones)     |
| `exceptions` | `{from: string, to: string}[]` | Explicit rename mappings that override the default pattern |

---

## standalone-imports-sort

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

---

## no-redundant-type-annotation

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

---

## strict-tui-doc-example

<sup>`Taiga-specific`</sup> <sup>`Fixable`</sup>

Validates that properties of a `TuiDocExample`-typed object have keys matching known file-type names (`TypeScript`,
`HTML`, `CSS`, `LESS`, `JavaScript`) and that the import path extension matches the key. Autofix corrects the import
extension.

```ts
// ❌ error — key says "TypeScript" but path has .html extension
readonly example: TuiDocExample = {
    TypeScript: import('./example/index.html?raw'),
};

// ✅ after autofix
readonly example: TuiDocExample = {
    TypeScript: import('./example/index.ts?raw'),
};
```
