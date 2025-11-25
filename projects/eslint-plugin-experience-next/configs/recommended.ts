import {createRequire} from 'node:module';

import eslint from '@eslint/js';
import markdown from '@eslint/markdown';
import rxjs from '@smarttools/eslint-plugin-rxjs';
import stylistic from '@stylistic/eslint-plugin';
import angular from 'angular-eslint';
import {defineConfig} from 'eslint/config';
import compat from 'eslint-plugin-compat';
import progress from 'eslint-plugin-file-progress';
import jest from 'eslint-plugin-jest';
import packageJson, {configs as packageJsonConfigs} from 'eslint-plugin-package-json';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-plugin-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import {
    TUI_MEMBER_ORDERING_CONVENTION,
    TUI_RECOMMENDED_NAMING_CONVENTION,
} from '../rules/convention';

const require = createRequire(import.meta.url);

let angularVersion = 16;

const tsconfig =
    projectJsonExist('tsconfig.eslint.json') ||
    projectJsonExist('tsconfig.json') ||
    projectJsonExist('tsconfig.base.json');

const parserOptions = tsconfig
    ? {
          project: [tsconfig],
      }
    : {
          EXPERIMENTAL_useProjectService: {
              maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: Infinity,
          },
      };

const modernAngularRules = {
    defaultStandalone: 19,
    modernStyles: 17,
    preferControlFlow: 17,
    preferSignals: 17,
    templateLiteral: 19,
};

try {
    const {major} = require('@angular/cli').VERSION;

    angularVersion = parseInt(major, 10);
} catch {}

export const ALL_TS_JS_FILES = ['**/*.{js,mjs,ts,cjs,tsx,jsx}'];

export default defineConfig([
    progress.configs['recommended-ci'],
    {
        ignores: [
            '**/tests-report/**',
            '**/snapshots/**',
            '**/test-results/**',
            '**/.nx/**',
            '*.{jpg,svg,less,scss,txt,png,webmanifest,pdf,mp3,ogv,mp4,xml}',
            '**/node_modules/**',
            '**/*@dasherize__/**',
            '**/coverage/**',
            '**/*.d.ts',
            '**/dist/**',
            '**/bin/**',
            '**/.cache/**',
            '**/.angular/**',
            '**.git/**',
            '**/.idea/**',
            '**/LICENSE',
        ],
    },
    require('eslint-config-prettier'),
    {
        files: ALL_TS_JS_FILES,
        plugins: {
            '@stylistic': stylistic,
            'decorator-position': require('eslint-plugin-decorator-position'),
            perfectionist: require('eslint-plugin-perfectionist'),
            prettier,
            'simple-import-sort': simpleImportSort,
            sonarjs,
            unicorn,
            'unused-imports': unusedImports,
        },
        extends: [
            require('eslint-plugin-de-morgan').configs.recommended,
            require('eslint-plugin-import').flatConfigs.recommended,
            require('eslint-plugin-import').flatConfigs.typescript,
            require('eslint-plugin-promise').configs['flat/recommended'],
            compat.configs['flat/recommended'],
            eslint.configs.recommended,
            eslint.configs.recommended,
            tseslint.configs.all,
        ],
        languageOptions: {
            parserOptions: {
                ecmaVersion: 'latest',
                errorOnTypeScriptSyntacticAndSemanticIssues: false,
                errorOnUnknownASTType: true,
                sourceType: 'module',
                warnOnUnsupportedTypeScriptVersion: false,
                ...parserOptions,
            },
            globals: {
                ...globals.builtin,
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            '@typescript-eslint/no-confusing-void-expression': 'off',
            '@typescript-eslint/no-import-type-side-effects': 'off', // verbatimModuleSyntax should be false
            '@typescript-eslint/no-invalid-void-type': 'off',
            'no-void': ['error', {allowAsStatement: true}],
            'sonarjs/no-identical-functions': 'error',
            '@stylistic/function-call-spacing': 'error',
            '@stylistic/lines-between-class-members': [
                'error',
                'always',
                {exceptAfterOverload: true, exceptAfterSingleLine: true},
            ],
            '@stylistic/member-delimiter-style': 'error',
            '@stylistic/padding-line-between-statements': [
                'error',
                {blankLine: 'always', next: 'block', prev: '*'},
                {blankLine: 'always', next: '*', prev: 'block'},
                {blankLine: 'always', next: 'block-like', prev: '*'},
                {blankLine: 'always', next: '*', prev: 'block-like'},
                {blankLine: 'always', next: 'return', prev: '*'},
                {blankLine: 'always', next: '*', prev: 'directive'},
                {blankLine: 'always', next: ['interface', 'type'], prev: '*'},
                {blankLine: 'always', next: '*', prev: ['const', 'let', 'var']},
                {blankLine: 'always', next: 'class', prev: '*'},
                {blankLine: 'always', next: '*', prev: 'class'},
                {
                    blankLine: 'any',
                    next: ['const', 'let', 'var', 'export'],
                    prev: ['const', 'let', 'var', 'export'],
                },
                {blankLine: 'any', next: ['case', 'default'], prev: '*'},
                {blankLine: 'any', next: '*', prev: ['case', 'default']},
                {blankLine: 'any', next: 'directive', prev: 'directive'},
            ],
            '@stylistic/quotes': [
                'error',
                'single',
                {
                    avoidEscape: true,
                },
            ],
            '@stylistic/type-annotation-spacing': 'error',
            '@typescript-eslint/adjacent-overload-signatures': 'off',
            '@typescript-eslint/array-type': [
                'error',
                {default: 'array-simple', readonly: 'array-simple'},
            ],
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/class-methods-use-this': 'off',
            '@typescript-eslint/consistent-generic-constructors': 'error',
            '@typescript-eslint/consistent-indexed-object-style': 'error',
            '@typescript-eslint/consistent-return': 'off',
            '@typescript-eslint/consistent-type-assertions': [
                'error',
                {
                    assertionStyle: 'as',
                    objectLiteralTypeAssertions: 'allow-as-parameter',
                },
            ],
            '@typescript-eslint/consistent-type-definitions': 'error',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    disallowTypeAnnotations: false,
                    fixStyle: 'inline-type-imports',
                    prefer: 'type-imports',
                },
            ],
            '@typescript-eslint/dot-notation': [
                'error',
                {
                    allowIndexSignaturePropertyAccess: true,
                    allowPrivateClassPropertyAccess: true,
                    allowProtectedClassPropertyAccess: true,
                },
            ],
            '@typescript-eslint/explicit-function-return-type': [
                'error',
                {
                    allowConciseArrowFunctionExpressionsStartingWithVoid: true,
                    allowDirectConstAssertionInArrowFunctions: true,
                    allowExpressions: true,
                    allowHigherOrderFunctions: true,
                    allowTypedFunctionExpressions: true,
                },
            ],
            '@typescript-eslint/explicit-member-accessibility': [
                'error',
                {
                    overrides: {
                        accessors: 'explicit',
                        constructors: 'no-public',
                        methods: 'explicit',
                        parameterProperties: 'explicit',
                        properties: 'explicit',
                    },
                    accessibility: 'explicit',
                },
            ],
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/init-declarations': 'off',
            '@typescript-eslint/max-params': ['error', {countVoidThis: true, max: 5}],
            '@typescript-eslint/member-ordering': [
                'error',
                {default: TUI_MEMBER_ORDERING_CONVENTION},
            ],
            '@typescript-eslint/method-signature-style': ['error', 'method'],
            '@typescript-eslint/naming-convention': [
                'error',
                ...TUI_RECOMMENDED_NAMING_CONVENTION,
            ],
            '@typescript-eslint/no-base-to-string': 'off',
            '@typescript-eslint/no-confusing-non-null-assertion': 'error',
            '@typescript-eslint/no-deprecated': 'off',
            '@typescript-eslint/no-duplicate-enum-values': 'error',
            '@typescript-eslint/no-duplicate-type-constituents': 'error',
            '@typescript-eslint/no-empty-function': [
                'error',
                {
                    allow: [
                        'methods',
                        'arrowFunctions',
                        'private-constructors',
                        'protected-constructors',
                        'overrideMethods',
                        'decoratedFunctions',
                    ],
                },
            ],
            '@typescript-eslint/no-empty-object-type': 'error',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-extra-non-null-assertion': 'error',
            '@typescript-eslint/no-extraneous-class': [
                'error',
                {
                    allowConstructorOnly: true,
                    allowEmpty: false,
                    allowStaticOnly: true,
                    allowWithDecorator: true,
                },
            ],
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/no-for-in-array': 'error',
            '@typescript-eslint/no-implied-eval': 'error',
            '@typescript-eslint/no-inferrable-types': 'error',
            '@typescript-eslint/no-magic-numbers': 'off',
            '@typescript-eslint/no-misused-promises': 'off',
            '@typescript-eslint/no-misused-spread': 'off',
            '@typescript-eslint/no-namespace': ['error', {allowDeclarations: true}],
            '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
            '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-restricted-types': [
                'error',
                {
                    types: {
                        BigInt: {
                            fixWith: 'bigint',
                            message: 'Use bigint instead',
                        },
                        Boolean: {
                            fixWith: 'boolean',
                            message: 'Use boolean instead',
                        },
                        Number: {
                            fixWith: 'number',
                            message: 'Use number instead',
                        },
                        String: {
                            fixWith: 'string',
                            message: 'Use string instead',
                        },
                        Symbol: {
                            fixWith: 'symbol',
                            message: 'Use symbol instead',
                        },
                        '{}': {
                            fixWith: 'Record<string, unknown>',
                            message:
                                '`{}` actually means `any non-nullish value`.\n- If you want a type meaning `any object`, you probably want `object` instead.\n- If you want a type meaning `any value`, you probably want `unknown` instead.\n- If you want a type meaning `empty object`, you probably want `Record<string, never>` instead.',
                        },
                    },
                },
            ],
            '@typescript-eslint/no-shadow': 'off',
            '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
            '@typescript-eslint/no-unnecessary-condition': 'error',
            '@typescript-eslint/no-unnecessary-qualifier': 'error',
            '@typescript-eslint/no-unnecessary-template-expression': 'off',
            '@typescript-eslint/no-unnecessary-type-arguments': 'error',
            '@typescript-eslint/no-unnecessary-type-assertion': 'error',
            '@typescript-eslint/no-unnecessary-type-constraint': 'error',
            '@typescript-eslint/no-unnecessary-type-parameters': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-declaration-merging': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-type-assertion': 'off',
            '@typescript-eslint/no-unused-expressions': [
                'error',
                {
                    allowShortCircuit: true,
                    allowTaggedTemplates: false,
                    allowTernary: false,
                },
            ],
            '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
            '@typescript-eslint/no-use-before-define': [
                'error',
                {
                    allowNamedExports: false,
                    classes: false,
                    enums: true,
                    functions: false,
                    ignoreTypeReferences: true,
                    typedefs: true,
                    variables: true,
                },
            ],
            '@typescript-eslint/no-useless-constructor': 'error',
            '@typescript-eslint/no-var-requires': 'off',
            '@typescript-eslint/only-throw-error': 'error',
            '@typescript-eslint/parameter-properties': [
                'error',
                {
                    allow: ['public readonly', 'protected readonly', 'private readonly'],
                },
            ],
            '@typescript-eslint/prefer-as-const': 'error',
            '@typescript-eslint/prefer-destructuring': 'off',
            '@typescript-eslint/prefer-find': 'error',
            '@typescript-eslint/prefer-for-of': 'error',
            '@typescript-eslint/prefer-includes': 'error',
            '@typescript-eslint/prefer-nullish-coalescing': 'off',
            '@typescript-eslint/prefer-optional-chain': 'error',
            '@typescript-eslint/prefer-readonly': ['error'],
            '@typescript-eslint/prefer-readonly-parameter-types': 'off',
            '@typescript-eslint/prefer-regexp-exec': 'error',
            '@typescript-eslint/prefer-string-starts-ends-with': 'error',
            '@typescript-eslint/promise-function-async': [
                'error',
                {
                    allowedPromiseNames: ['Thenable'],
                    checkArrowFunctions: true,
                    checkFunctionDeclarations: true,
                    checkFunctionExpressions: true,
                    checkMethodDeclarations: true,
                },
            ],
            '@typescript-eslint/require-array-sort-compare': 'error',
            '@typescript-eslint/require-await': 'error',
            '@typescript-eslint/restrict-plus-operands': 'error',
            '@typescript-eslint/restrict-template-expressions': 'off',
            '@typescript-eslint/sort-type-constituents': 'error',
            '@typescript-eslint/strict-boolean-expressions': 'off',
            '@typescript-eslint/switch-exhaustiveness-check': [
                'error',
                {
                    considerDefaultExhaustiveForUnions: true,
                    allowDefaultCaseForExhaustiveSwitch: true,
                    requireDefaultForNonUnion: false,
                },
            ],
            '@typescript-eslint/triple-slash-reference': [
                'error',
                {
                    lib: 'always',
                    path: 'always',
                    types: 'always',
                },
            ],
            '@typescript-eslint/unbound-method': 'off',
            '@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',
            curly: ['error', 'all'],
            'decorator-position/decorator-position': [
                'error',
                {
                    printWidth: 120,
                    methods: 'above',
                    properties: 'above',
                },
            ],
            eqeqeq: [
                'error',
                'always',
                {
                    null: 'ignore',
                },
            ],
            'func-style': [
                'error',
                'declaration',
                {
                    allowArrowFunctions: true,
                },
            ],
            'guard-for-in': 'error',
            'import/consistent-type-specifier-style': ['error', 'prefer-inline'],
            'import/enforce-node-protocol-usage': ['error', 'always'],
            'import/export': 'off',
            'import/first': 'error',
            'import/newline-after-import': ['error', {count: 1}],
            'import/no-absolute-path': 'error',
            'import/no-cycle': 'error',
            'import/no-duplicates': ['error', {'prefer-inline': true}],
            'import/no-mutable-exports': 'error',
            'import/no-self-import': 'error',
            'import/no-unresolved': 'off',
            'import/no-useless-path-segments': [
                'error',
                {
                    noUselessIndex: true,
                },
            ],
            'import/no-webpack-loader-syntax': 'error',
            'lines-around-comment': [
                'error',
                {
                    afterBlockComment: false,
                    afterLineComment: false,
                    allowArrayEnd: true,
                    allowArrayStart: true,
                    allowBlockEnd: true,
                    allowBlockStart: true,
                    allowClassEnd: true,
                    allowClassStart: true,
                    allowObjectEnd: true,
                    allowObjectStart: true,
                    applyDefaultIgnorePatterns: true,
                    beforeBlockComment: false,
                    beforeLineComment: false,
                },
            ],
            'max-depth': 'error',
            'max-nested-callbacks': ['error', 4],
            'max-params': ['error', 5],
            'no-bitwise': 'error',
            'no-case-declarations': 'error',
            'no-console': [
                'error',
                {
                    allow: ['info', 'assert', 'warn', 'error'],
                },
            ],
            'no-constant-condition': 'error',
            'no-empty': ['error', {allowEmptyCatch: true}],
            'no-extra-boolean-cast': 'error',
            'no-implicit-coercion': ['error', {allow: ['!!']}],
            'no-irregular-whitespace': [
                'error',
                {
                    skipRegExps: false,
                    skipStrings: false,
                    skipTemplates: false,
                },
            ],
            'no-loop-func': 'error',
            'no-nested-ternary': 'error',
            'no-prototype-builtins': 'off',
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['rxjs/operators'],
                            message: "Don't use 'rxjs/operators' instead of 'rxjs'",
                        },
                        {
                            group: ['@angular/**'],
                            importNames: ['Inject'],
                            message: 'Please use `inject(Type)` function instead',
                        },
                        {
                            group: ['@taiga-ui/polymorpheus'],
                            importNames: ['POLYMORPHEUS_CONTEXT'],
                            message: 'Please use `injectContext()` function instead',
                        },
                        {
                            group: ['@angular/core'],
                            importNames: ['Attribute'],
                            message:
                                'Always prefer using HostAttributeToken over @Attribute. See: https://angular.dev/api/core/HostAttributeToken',
                        },
                    ],
                },
            ],
            'no-restricted-syntax': [
                'error',
                {
                    message:
                        'Don\'t declare enums, please use "const MyEnumType = { ... } as const;"',
                    selector: 'TSEnumDeclaration',
                },
                {
                    message:
                        "Don't use TuiDestroyService, please use `takeUntilDestroyed()` function instead.",
                    selector: "Identifier[name='TuiDestroyService']",
                },
                {
                    message:
                        'Use `map(() => value)` instead of `mapTo(value)`, the operator is deprecated',
                    selector: "CallExpression[callee.name='mapTo']",
                },
                {
                    message:
                        'Use `switchMap(() => stream$)` instead of `switchMapTo(stream$)`, the operator is deprecated',
                    selector: "CallExpression[callee.name='switchMapTo']",
                },
                {
                    message:
                        'Use `mergeMap` instead of `flatMap`, the operator is deprecated',
                    selector: "CallExpression[callee.name='flatMap']",
                },
                {
                    message:
                        "Use `map(x => x?.foo?.bar)` instead of `pluck('foo', 'bar')`",
                    selector: "CallExpression[callee.name='pluck']",
                },
                {
                    message:
                        'Provide initial value to .reduce() method. Possible runtime error: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Reduce_of_empty_array_with_no_initial_value',
                    selector:
                        "CallExpression[arguments.length=1] > MemberExpression.callee > Identifier.property[name='reduce']",
                },
                {
                    message: 'Please use `inject(INJECTOR)` instead',
                    selector:
                        "CallExpression[callee.name='inject'][arguments.0.name='Injector']",
                },
            ],
            'no-return-assign': ['error', 'always'],
            'no-unneeded-ternary': 'error',
            'no-useless-concat': 'error',
            'no-useless-escape': 'error',
            'no-useless-rename': [
                'error',
                {
                    ignoreDestructuring: true,
                    ignoreExport: false,
                    ignoreImport: false,
                },
            ],
            'no-var': 'error',
            'perfectionist/sort-array-includes': [
                'error',
                {
                    groupKind: 'literals-first',
                    ignoreCase: true,
                    order: 'asc',
                    type: 'alphabetical',
                },
            ],
            'perfectionist/sort-maps': [
                'error',
                {
                    ignoreCase: true,
                    order: 'asc',
                    type: 'alphabetical',
                },
            ],
            'perfectionist/sort-sets': [
                'error',
                {
                    groupKind: 'literals-first',
                    ignoreCase: true,
                    order: 'asc',
                    type: 'alphabetical',
                },
            ],
            'perfectionist/sort-switch-case': [
                'error',
                {
                    ignoreCase: true,
                    order: 'asc',
                    type: 'alphabetical',
                },
            ],
            'perfectionist/sort-variable-declarations': [
                'error',
                {
                    ignoreCase: true,
                    order: 'asc',
                    type: 'alphabetical',
                },
            ],
            'prefer-template': 'error',
            'prettier/prettier': [
                'error',
                {
                    endOfLine: 'auto',
                },
            ],
            'promise/always-return': 'off',
            'promise/catch-or-return': 'off',
            'promise/no-callback-in-promise': 'off',
            'promise/no-nesting': 'off',
            'promise/param-names': 'error',
            'simple-import-sort/exports': 'error',
            'simple-import-sort/imports': 'error',
            'sonarjs/no-inverted-boolean-check': 'error',
            'spaced-comment': [
                'error',
                'always',
                {
                    markers: ['/'],
                },
            ],
            'unicorn/consistent-empty-array-spread': 'error',
            'unicorn/escape-case': 'error',
            'unicorn/filename-case': [
                'error',
                {
                    case: 'kebabCase',
                },
            ],
            'unicorn/new-for-builtins': 'error',
            'unicorn/no-array-method-this-argument': 'error',
            'unicorn/no-array-push-push': 'error',
            'unicorn/no-await-in-promise-methods': 'error',
            'unicorn/no-empty-file': 'error',
            'unicorn/no-magic-array-flat-depth': 'error',
            'unicorn/no-negation-in-equality-check': 'error',
            'unicorn/no-new-array': 'error',
            'unicorn/no-single-promise-in-promise-methods': 'error',
            'unicorn/no-typeof-undefined': 'error',
            'unicorn/no-unnecessary-polyfills': 'error',
            'unicorn/no-useless-spread': 'error',
            'unicorn/prefer-logical-operator-over-ternary': 'error',
            'unicorn/prefer-query-selector': 'error',
            'unicorn/prefer-set-size': 'error',
            'unicorn/prefer-string-raw': 'error',
            'unicorn/prefer-string-replace-all': 'error',
            'unicorn/prefer-string-slice': 'error',
            'unicorn/require-number-to-fixed-digits-argument': 'error',
            'unused-imports/no-unused-imports': 'error',
            'vars-on-top': 'error',
        },
    },
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            rxjs,
        },
        extends: [angular.configs.tsRecommended],
        processor: angular.processInlineTemplates,
        rules: {
            '@angular-eslint/consistent-component-styles':
                angularVersion >= modernAngularRules.modernStyles ? 'error' : 'off',
            '@angular-eslint/contextual-decorator': 'error',
            '@angular-eslint/contextual-lifecycle': 'error',
            '@angular-eslint/directive-selector': 'error',
            '@angular-eslint/no-async-lifecycle-method': 'error',
            '@angular-eslint/no-attribute-decorator': 'error',
            '@angular-eslint/no-conflicting-lifecycle': 'error',
            '@angular-eslint/no-duplicates-in-metadata-arrays': 'error',
            '@angular-eslint/no-empty-lifecycle-method': 'error',
            '@angular-eslint/no-experimental': 'error',
            '@angular-eslint/no-input-prefix': 'error',
            '@angular-eslint/no-input-rename': 'off',
            '@angular-eslint/no-inputs-metadata-property': 'off',
            '@angular-eslint/no-output-native': 'off',
            '@angular-eslint/no-output-on-prefix': 'error',
            '@angular-eslint/no-output-rename': 'off',
            '@angular-eslint/no-outputs-metadata-property': 'off',
            '@angular-eslint/no-queries-metadata-property': 'error',
            '@angular-eslint/no-uncalled-signals': 'error',
            '@angular-eslint/prefer-host-metadata-property': 'error',
            '@angular-eslint/prefer-inject': 'error',
            '@angular-eslint/prefer-on-push-component-change-detection': 'error',
            '@angular-eslint/prefer-output-readonly': 'error',
            '@angular-eslint/prefer-signals':
                angularVersion >= modernAngularRules.preferSignals ? 'error' : 'off',
            '@angular-eslint/prefer-standalone':
                angularVersion >= modernAngularRules.defaultStandalone ? 'off' : 'error',
            '@angular-eslint/relative-url-prefix': 'error',
            '@angular-eslint/sort-lifecycle-methods': 'error',
            '@angular-eslint/use-lifecycle-interface': 'error',
            '@angular-eslint/use-pipe-transform-interface': 'error',
            '@taiga-ui/experience-next/decorator-key-sort': [
                'error',
                {
                    Component: [
                        'moduleId',
                        'standalone',
                        'signal',
                        'selector',
                        'imports',
                        'template',
                        'templateUrl',
                        'styleUrl',
                        'styleUrls',
                        'styles',
                        'encapsulation',
                        'changeDetection',
                        'providers',
                        'viewProviders',
                        'animations',
                        'entryComponents',
                        'preserveWhitespaces',
                        'interpolation',
                        'hostDirectives',
                        'host',
                    ],
                    Directive: [
                        'standalone',
                        'selector',
                        'inputs',
                        'outputs',
                        'providers',
                        'exportAs',
                        'queries',
                        'hostDirectives',
                        'host',
                        'jit',
                    ],
                    Injectable: ['providedIn'],
                    NgModule: [
                        'id',
                        'jit',
                        'imports',
                        'declarations',
                        'providers',
                        'exports',
                        'entryComponents',
                        'bootstrap',
                        'schemas',
                    ],
                    Pipe: ['standalone', 'name', 'pure'],
                },
            ],
            '@taiga-ui/experience-next/injection-token-description': 'error',
            '@taiga-ui/experience-next/no-deep-imports': [
                'error',
                {
                    currentProject: String.raw`(?<=projects/)([-\w]+)`,
                    ignoreImports: [
                        String.raw`\?raw`,
                        '@taiga-ui/testing/cypress',
                        '@taiga-ui/testing/setup-jest',
                    ],
                },
            ],
            '@taiga-ui/experience-next/no-deep-imports-to-indexed-packages': 'error',
            '@taiga-ui/experience-next/no-implicit-public': 'error',
            '@taiga-ui/experience-next/short-tui-imports': 'error',
            '@taiga-ui/experience-next/standalone-imports-sort': [
                'error',
                {
                    decorators: ['Component', 'Directive', 'NgModule', 'Pipe'],
                },
            ],
            'rxjs/no-compat': 'error',
            'rxjs/no-connectable': 'error',
            'rxjs/no-cyclic-action': 'error',
            'rxjs/no-ignored-observable': 'error',
            'rxjs/no-nested-subscribe': 'error',
            'rxjs/no-topromise': 'error',
            'rxjs/no-unsafe-catch': 'error',
            'rxjs/no-unsafe-first': 'error',
            'rxjs/no-unsafe-switchmap': 'error',
            'rxjs/throw-error': 'error',
        },
    },
    {
        files: ['**/*.html'],
        extends: [
            angular.configs.templateRecommended,
            angular.configs.templateAccessibility,
        ],
        rules: {
            '@angular-eslint/template/button-has-type': [
                'error',
                {
                    ignoreWithDirectives: [
                        'tuiButtonClose',
                        'tuiAccordion',
                        'tuiOption',
                        'tuiStep',
                        'tuiTab',
                    ],
                },
            ],
            '@angular-eslint/template/click-events-have-key-events': 'off',
            '@angular-eslint/template/elements-content': [
                'error',
                {
                    allowList: [
                        'aria-label',
                        'innerHtml',
                        'textContent',
                        'innerHTML',
                        'innerText',
                        'outerHTML',
                        'title',
                        'tuiFile',
                        'tuiTag',
                        'tuiHint',
                    ],
                },
            ],
            '@angular-eslint/template/eqeqeq': ['error', {allowNullOrUndefined: true}],
            '@angular-eslint/template/interactive-supports-focus': 'off',
            '@angular-eslint/template/label-has-associated-control': 'off',
            '@angular-eslint/template/mouse-events-have-key-events': 'error',
            '@angular-eslint/template/no-distracting-elements': 'error',
            '@angular-eslint/template/no-duplicate-attributes': 'error',
            '@angular-eslint/template/no-interpolation-in-attributes':
                angularVersion >= modernAngularRules.preferControlFlow ? 'error' : 'off',
            '@angular-eslint/template/no-negated-async': 'off',
            '@angular-eslint/template/prefer-at-empty':
                angularVersion >= modernAngularRules.preferControlFlow ? 'error' : 'off',
            '@angular-eslint/template/prefer-contextual-for-variables': 'error',
            '@angular-eslint/template/prefer-control-flow':
                angularVersion >= modernAngularRules.preferControlFlow ? 'error' : 'off',
            '@angular-eslint/template/prefer-self-closing-tags': 'error',
            '@angular-eslint/template/prefer-template-literal':
                angularVersion >= modernAngularRules.templateLiteral ? 'error' : 'off',
        },
    },
    {
        files: ['**/*.pw.spec.ts'],
        extends: [playwright.configs['flat/recommended']],
        rules: {
            'playwright/no-networkidle': 'off',
            'compat/compat': 'off',
            'jest/prefer-importing-jest-globals': 'off',
            'playwright/expect-expect': [
                'error',
                {
                    assertFunctionNames: ['expect', 'expect.soft'],
                },
            ],
            'playwright/no-force-option': 'error',
            'playwright/no-skipped-test': 'off',
            'playwright/no-wait-for-selector': 'off',
            'playwright/no-wait-for-timeout': 'off',
        },
    },
    {
        files: ['**/*.spec.ts'],
        extends: [jest.configs['flat/recommended']],
        rules: {
            '@typescript-eslint/no-extraneous-class': 'off',
            '@typescript-eslint/no-shadow': 'off',
            'compat/compat': 'off',
            'jest/expect-expect': 'off',
            'jest/max-expects': 'off',
            'jest/max-nested-describe': 'off',
            'jest/no-conditional-in-test': 'off',
            'jest/no-deprecated-functions': 'off',
            'jest/no-disabled-tests': 'off',
            'jest/no-done-callback': 'off',
            'jest/no-hooks': 'off',
            'jest/no-test-prefixes': 'error',
            'jest/prefer-called-with': 'off',
            'jest/prefer-each': 'off',
            'jest/prefer-expect-assertions': 'off',
            'jest/prefer-expect-resolves': 'off',
            'jest/prefer-hooks-on-top': 'off',
            'max-nested-callbacks': 'off',
            'sonarjs/no-clear-text-protocols': 'off',
            /**
             * If enabled we have
             * Expected to be running in 'ProxyZone', but it was not found
             */
            'jest/valid-title': 'error',
            'jest/prefer-ending-with-an-expect': 'off',
            'jest/prefer-importing-jest-globals': 'off',
            'jest/prefer-lowercase-title': [
                'error',
                {
                    allowedPrefixes: [
                        'Tui',
                        'NaN',
                        'UTC',
                        'January',
                        'February',
                        'March',
                        'April',
                        'May',
                        'June',
                        'July',
                        'August',
                        'September',
                        'October',
                        'November',
                        'December',
                    ],
                    ignore: ['describe', 'test'],
                },
            ],
            'jest/prefer-strict-equal': 'off',
            'jest/prefer-to-be-null': 'off',
            'jest/prefer-to-have-length': 'off',
            'jest/require-hook': 'off',
            'jest/require-to-throw-message': 'off',
            'jest/require-top-level-describe': [
                'error',
                {
                    maxNumberOfTopLevelDescribes: 1,
                },
            ],
            'jest/unbound-method': 'off',
        },
    },
    {
        files: ['**/*.cy.ts'],
        rules: {
            'compat/compat': 'off',
            'cypress/no-unnecessary-waiting': 'off',
            'cypress/unsafe-to-chain-command': 'off',
            'max-nested-callbacks': 'off',
            'no-implicit-globals': 'error',
        },
    },
    {
        files: ['**/*.{js,mjs,cjs}'],
        extends: [tseslint.configs.disableTypeChecked],
        rules: {
            '@typescript-eslint/explicit-function-return-type': 'off',
            'no-template-curly-in-string': 'off',
        },
    },
    {
        files: ['**/package.json'],
        plugins: {'package-json': packageJson},
        extends: [tseslint.configs.disableTypeChecked, packageJsonConfigs.recommended],
        rules: {
            'package-json/require-description': ['error', {ignorePrivate: true}],
            'package-json/require-type': ['off', {ignorePrivate: true}],
        },
    },
    {
        files: ['**/*.md'],
        plugins: {
            markdown,
        },
        extends: [markdown.configs.recommended],
        language: 'markdown/gfm',
        rules: {
            'markdown/require-alt-text': 'off',
        },
    },
    {
        files: ['**/*.md', '**/*.html', '**/*.cy.ts', '**/*.spec.ts'],
        rules: {
            'no-irregular-whitespace': 'off',
        },
    },
]);

function projectJsonExist(filename: string): string {
    try {
        const path = require('node:path').resolve(filename);

        return require('node:fs').existsSync(path) ? path : '';
    } catch {
        return '';
    }
}
