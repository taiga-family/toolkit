import {readFileSync} from 'node:fs';

import {type ConfigArray} from 'typescript-eslint';

import htmlEslint from './configs/html-eslint';
import recommended, {ALL_TS_JS_FILES} from './configs/recommended';
import taigaSpecific from './configs/taiga-specific';
import arrayAsConst from './rules/array-as-const';
import classPropertyNaming from './rules/class-property-naming';
import decoratorKeySort from './rules/decorator-key-sort';
import flatExports from './rules/flat-exports';
import hostAttributesSort from './rules/host-attributes-sort';
import htmlLogicalProperties from './rules/html-logical-properties';
import injectionTokenDescription from './rules/injection-token-description';
import noDeepImports from './rules/no-deep-imports';
import noDeepImportsToIndexedPackages from './rules/no-deep-imports-to-indexed-packages';
import noFullyUntrackedEffect from './rules/no-fully-untracked-effect';
import noHrefWithRouterLink from './rules/no-href-with-router-link';
import noImplicitPublic from './rules/no-implicit-public';
import noInfiniteLoop from './rules/no-infinite-loop';
import noLegacyPeerDeps from './rules/no-legacy-peer-deps';
import noPlaywrightEmptyFill from './rules/no-playwright-empty-fill';
import noProjectAsInNgTemplate from './rules/no-project-as-in-ng-template';
import noRedundantTypeAnnotation from './rules/no-redundant-type-annotation';
import noSideEffectsInComputed from './rules/no-side-effects-in-computed';
import noSignalReadsAfterAwaitInReactiveContext from './rules/no-signal-reads-after-await-in-reactive-context';
import noStringLiteralConcat from './rules/no-string-literal-concat';
import noUntrackedOutsideReactiveContext from './rules/no-untracked-outside-reactive-context';
import noUselessUntracked from './rules/no-useless-untracked';
import objectSingleLine from './rules/object-single-line';
import preferCombinedIfControlFlow from './rules/prefer-combined-if-control-flow';
import preferDeepImports from './rules/prefer-deep-imports';
import preferMultiArgPush from './rules/prefer-multi-arg-push';
import preferUntrackedIncidentalSignalReads from './rules/prefer-untracked-incidental-signal-reads';
import preferUntrackedSignalGetter from './rules/prefer-untracked-signal-getter';
import shortTuiImports from './rules/short-tui-imports';
import standaloneImportsSort from './rules/standalone-imports-sort';
import strictTuiDocExample from './rules/strict-tui-doc-example';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const plugin = {
    configs: {} as unknown as {
        readonly recommended: ConfigArray;
        readonly ['taiga-specific']: ConfigArray;
        readonly ['html-eslint']: ConfigArray;
    },
    meta: {
        name: pkg.name,
        version: pkg.version,
    },
    rules: {
        'array-as-const': arrayAsConst,
        'class-property-naming': classPropertyNaming,
        'decorator-key-sort': decoratorKeySort,
        'flat-exports': flatExports,
        'host-attributes-sort': hostAttributesSort,
        'html-logical-properties': htmlLogicalProperties,
        'injection-token-description': injectionTokenDescription,
        'no-deep-imports': noDeepImports,
        'no-deep-imports-to-indexed-packages': noDeepImportsToIndexedPackages,
        'no-fully-untracked-effect': noFullyUntrackedEffect,
        'no-href-with-router-link': noHrefWithRouterLink,
        'no-implicit-public': noImplicitPublic,
        'no-infinite-loop': noInfiniteLoop,
        'no-legacy-peer-deps': noLegacyPeerDeps,
        'no-playwright-empty-fill': noPlaywrightEmptyFill,
        'no-project-as-in-ng-template': noProjectAsInNgTemplate,
        'no-redundant-type-annotation': noRedundantTypeAnnotation,
        'no-side-effects-in-computed': noSideEffectsInComputed,
        'no-signal-reads-after-await-in-reactive-context':
            noSignalReadsAfterAwaitInReactiveContext,
        'no-string-literal-concat': noStringLiteralConcat,
        'no-untracked-outside-reactive-context': noUntrackedOutsideReactiveContext,
        'no-useless-untracked': noUselessUntracked,
        'object-single-line': objectSingleLine,
        'prefer-combined-if-control-flow': preferCombinedIfControlFlow,
        'prefer-deep-imports': preferDeepImports,
        'prefer-multi-arg-push': preferMultiArgPush,
        'prefer-untracked-incidental-signal-reads': preferUntrackedIncidentalSignalReads,
        'prefer-untracked-signal-getter': preferUntrackedSignalGetter,
        'short-tui-imports': shortTuiImports,
        'standalone-imports-sort': standaloneImportsSort,
        'strict-tui-doc-example': strictTuiDocExample,
    },
};

// https://eslint.org/docs/latest/extend/plugins#configs-in-plugins
// assign configs here so we can reference `plugin`
Object.assign(plugin.configs, {
    ['html-eslint']: [
        {files: ['**/*.html'], plugins: {'@taiga-ui/experience-next': plugin}},
        ...htmlEslint,
    ],
    recommended: [
        {files: ALL_TS_JS_FILES, plugins: {'@taiga-ui/experience-next': plugin}},
        {files: ['**/*.html'], plugins: {'@taiga-ui/experience-next': plugin}},
        {files: ['**/.npmrc'], plugins: {'@taiga-ui/experience-next': plugin}},
        ...recommended,
    ],
    ['taiga-specific']: [
        {files: ALL_TS_JS_FILES, plugins: {'@taiga-ui/experience-next': plugin}},
        ...taigaSpecific,
    ],
} as (typeof plugin)['configs']);

export {TUI_RECOMMENDED_NAMING_CONVENTION} from './rules/convention';

export default plugin;
