# eslint-plugin-experience-next — Agent Guidelines

## Adding a new rule

Every new rule requires **all four** of the following steps. Do not skip any.

### 1. Implement the rule

Create `rules/<rule-name>.ts`. Export a named `rule` and a default export.

```ts
import {ESLintUtils} from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator((name) => name);

export const rule = createRule<[], 'myMessageId'>({
  create(context) {
    /* ... */
  },
  meta: {
    docs: {description: '…'},
    fixable: 'code', // omit if the rule has no autofix
    messages: {myMessageId: '…'},
    schema: [],
    type: 'problem' | 'suggestion' | 'layout',
  },
  name: '<rule-name>',
});

export default rule;
```

### 2. Register in `index.ts`

Add an import and an entry to the `rules` map, keeping both alphabetically sorted:

```ts
import myRule from './rules/my-rule';

const plugin = {
  rules: {
    'my-rule': myRule,
    // …
  },
};
```

### 3. Add to `configs/recommended.ts`

Add the rule to the appropriate file-glob section (alphabetical order within the section):

| Rule targets      | Section                    |
| ----------------- | -------------------------- |
| `**/*.{ts,tsx}`   | TypeScript / Angular block |
| `**/*.html`       | HTML template block        |
| `**/*.pw.spec.ts` | Playwright block           |
| `**/*.spec.ts`    | Jest block                 |

Severity guide:

- Always use `'error'`. Never use `'warn'`.
- Prefer `fixable: 'code'` so `eslint --fix` can auto-apply the correction.

### 4. Write tests

Create `tests/<rule-name>.spec.ts` using `@typescript-eslint/rule-tester`.

```ts
import {rule} from '../rules/<rule-name>';

const RuleTester = require('@typescript-eslint/rule-tester').RuleTester;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: require('@typescript-eslint/parser'),
    parserOptions: {projectService: {allowDefaultProject: ['*.ts*']}},
  },
});

ruleTester.run('<rule-name>', rule, {
  invalid: [
    /* … */
  ],
  valid: [
    /* … */
  ],
});
```

Include `PREAMBLE` type declarations (see existing spec files) when the rule relies on type information.

### 5. Document in `README.md`

Add a row to the summary table (alphabetical order):

```markdown
| <rule-name> | Short description | ✅ | 🔧 | 💡 |
```

- ✅ = included in `recommended`
- 🔧 = has autofix (`fixable: 'code'`)

Then add a `## <rule-name>` section below the table with:

- One-paragraph description of what the rule checks.
- `❌ error` / `✅ after autofix` code examples.
- An options table if the rule has schema options.
