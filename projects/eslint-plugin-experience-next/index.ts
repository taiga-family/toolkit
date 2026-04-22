import {readFileSync} from 'node:fs';

import {type ConfigArray} from 'typescript-eslint';

import recommended, {ALL_TS_JS_FILES} from './configs/recommended';
import taigaSpecific from './configs/taiga-specific';
import attrsNewline from './rules/recommended/attrs-newline';
import decoratorKeySort from './rules/recommended/decorator-key-sort';
import elementNewline from './rules/recommended/element-newline';
import hostAttributesSort from './rules/recommended/host-attributes-sort';
import htmlLogicalProperties from './rules/recommended/html-logical-properties';
import importIntegrity from './rules/recommended/import-integrity';
import injectionTokenDescription from './rules/recommended/injection-token-description';
import noCommonjsImportPatterns from './rules/recommended/no-commonjs-import-patterns';
import noDeepImports from './rules/recommended/no-deep-imports';
import noDeepImportsToIndexedPackages from './rules/recommended/no-deep-imports-to-indexed-packages';
import noDuplicateAttrs from './rules/recommended/no-duplicate-attrs';
import noDuplicateId from './rules/recommended/no-duplicate-id';
import noDuplicateInHead from './rules/recommended/no-duplicate-in-head';
import noFullyUntrackedEffect from './rules/recommended/no-fully-untracked-effect';
import noHrefWithRouterLink from './rules/recommended/no-href-with-router-link';
import noImplicitPublic from './rules/recommended/no-implicit-public';
import noImportAssertions from './rules/recommended/no-import-assertions';
import noInfiniteLoop from './rules/recommended/no-infinite-loop';
import noLegacyPeerDeps from './rules/recommended/no-legacy-peer-deps';
import noObsoleteAttrs from './rules/recommended/no-obsolete-attrs';
import noObsoleteTags from './rules/recommended/no-obsolete-tags';
import noPlaywrightEmptyFill from './rules/recommended/no-playwright-empty-fill';
import noProjectAsInNgTemplate from './rules/recommended/no-project-as-in-ng-template';
import noRedundantTypeAnnotation from './rules/recommended/no-redundant-type-annotation';
import noRepeatedSignalInConditional from './rules/recommended/no-repeated-signal-in-conditional';
import noSideEffectsInComputed from './rules/recommended/no-side-effects-in-computed';
import noSignalReadsAfterAwaitInReactiveContext from './rules/recommended/no-signal-reads-after-await-in-reactive-context';
import noStringLiteralConcat from './rules/recommended/no-string-literal-concat';
import noUntrackedOutsideReactiveContext from './rules/recommended/no-untracked-outside-reactive-context';
import noUselessUntracked from './rules/recommended/no-useless-untracked';
import objectSingleLine from './rules/recommended/object-single-line';
import preferCombinedIfControlFlow from './rules/recommended/prefer-combined-if-control-flow';
import preferLooseNullCheck from './rules/recommended/prefer-loose-null-check';
import preferMultiArgPush from './rules/recommended/prefer-multi-arg-push';
import preferNamespaceKeyword from './rules/recommended/prefer-namespace-keyword';
import preferUntrackedIncidentalSignalReads from './rules/recommended/prefer-untracked-incidental-signal-reads';
import preferUntrackedSignalGetter from './rules/recommended/prefer-untracked-signal-getter';
import quotes from './rules/recommended/quotes';
import requireDoctype from './rules/recommended/require-doctype';
import requireImgAlt from './rules/recommended/require-img-alt';
import requireLang from './rules/recommended/require-lang';
import requireLiContainer from './rules/recommended/require-li-container';
import requireTitle from './rules/recommended/require-title';
import shortTuiImports from './rules/recommended/short-tui-imports';
import singleLineClassPropertySpacing from './rules/recommended/single-line-class-property-spacing';
import singleLineVariableSpacing from './rules/recommended/single-line-variable-spacing';
import standaloneImportsSort from './rules/recommended/standalone-imports-sort';
import arrayAsConst from './rules/taiga-specific/array-as-const';
import classPropertyNaming from './rules/taiga-specific/class-property-naming';
import flatExports from './rules/taiga-specific/flat-exports';
import noRestrictedAttrValues from './rules/taiga-specific/no-restricted-attr-values';
import preferDeepImports from './rules/taiga-specific/prefer-deep-imports';
import strictTuiDocExample from './rules/taiga-specific/strict-tui-doc-example';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const plugin = {
    configs: {} as unknown as {
        readonly recommended: ConfigArray;
        readonly ['taiga-specific']: ConfigArray;
    },
    meta: {
        name: pkg.name,
        version: pkg.version,
    },
    rules: {
        'array-as-const': arrayAsConst,
        'attrs-newline': attrsNewline,
        'class-property-naming': classPropertyNaming,
        'decorator-key-sort': decoratorKeySort,
        'element-newline': elementNewline,
        'flat-exports': flatExports,
        'host-attributes-sort': hostAttributesSort,
        'html-logical-properties': htmlLogicalProperties,
        'import-integrity': importIntegrity,
        'injection-token-description': injectionTokenDescription,
        'no-commonjs-import-patterns': noCommonjsImportPatterns,
        'no-deep-imports': noDeepImports,
        'no-deep-imports-to-indexed-packages': noDeepImportsToIndexedPackages,
        'no-duplicate-attrs': noDuplicateAttrs,
        'no-duplicate-id': noDuplicateId,
        'no-duplicate-in-head': noDuplicateInHead,
        'no-fully-untracked-effect': noFullyUntrackedEffect,
        'no-href-with-router-link': noHrefWithRouterLink,
        'no-implicit-public': noImplicitPublic,
        'no-import-assertions': noImportAssertions,
        'no-infinite-loop': noInfiniteLoop,
        'no-legacy-peer-deps': noLegacyPeerDeps,
        'no-obsolete-attrs': noObsoleteAttrs,
        'no-obsolete-tags': noObsoleteTags,
        'no-playwright-empty-fill': noPlaywrightEmptyFill,
        'no-project-as-in-ng-template': noProjectAsInNgTemplate,
        'no-redundant-type-annotation': noRedundantTypeAnnotation,
        'no-repeated-signal-in-conditional': noRepeatedSignalInConditional,
        'no-restricted-attr-values': noRestrictedAttrValues,
        'no-side-effects-in-computed': noSideEffectsInComputed,
        'no-signal-reads-after-await-in-reactive-context':
            noSignalReadsAfterAwaitInReactiveContext,
        'no-string-literal-concat': noStringLiteralConcat,
        'no-untracked-outside-reactive-context': noUntrackedOutsideReactiveContext,
        'no-useless-untracked': noUselessUntracked,
        'object-single-line': objectSingleLine,
        'prefer-combined-if-control-flow': preferCombinedIfControlFlow,
        'prefer-deep-imports': preferDeepImports,
        'prefer-loose-null-check': preferLooseNullCheck,
        'prefer-multi-arg-push': preferMultiArgPush,
        'prefer-namespace-keyword': preferNamespaceKeyword,
        'prefer-untracked-incidental-signal-reads': preferUntrackedIncidentalSignalReads,
        'prefer-untracked-signal-getter': preferUntrackedSignalGetter,
        quotes,
        'require-doctype': requireDoctype,
        'require-img-alt': requireImgAlt,
        'require-lang': requireLang,
        'require-li-container': requireLiContainer,
        'require-title': requireTitle,
        'short-tui-imports': shortTuiImports,
        'single-line-class-property-spacing': singleLineClassPropertySpacing,
        'single-line-variable-spacing': singleLineVariableSpacing,
        'standalone-imports-sort': standaloneImportsSort,
        'strict-tui-doc-example': strictTuiDocExample,
    },
};

// https://eslint.org/docs/latest/extend/plugins#configs-in-plugins
// assign configs here so we can reference `plugin`
Object.assign(plugin.configs, {
    recommended: [
        {files: ALL_TS_JS_FILES, plugins: {'@taiga-ui/experience-next': plugin}},
        {files: ['**/*.html'], plugins: {'@taiga-ui/experience-next': plugin}},
        {files: ['**/.npmrc'], plugins: {'@taiga-ui/experience-next': plugin}},
        ...recommended,
    ],
    ['taiga-specific']: [
        {files: ALL_TS_JS_FILES, plugins: {'@taiga-ui/experience-next': plugin}},
        {files: ['**/*.html'], plugins: {'@taiga-ui/experience-next': plugin}},
        ...taigaSpecific,
    ],
} as (typeof plugin)['configs']);

export {TUI_RECOMMENDED_NAMING_CONVENTION} from './rules/convention';

export default plugin;
