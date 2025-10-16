import {readFileSync} from 'node:fs';

import {type Linter} from 'eslint';
import {type ConfigArray} from 'typescript-eslint';

import htmlEslint from './configs/html-eslint';
import recommended, {ALL_TS_JS_FILES} from './configs/recommended';
import taigaSpecific from './configs/taiga-specific';
import arrayAsConst from './rules/array-as-const';
import classPropertyNaming from './rules/class-property-naming';
import decoratorKeySort from './rules/decorator-key-sort';
import injectionTokenDescription from './rules/injection-token-description';
import noDeepImports from './rules/no-deep-imports';
import noDeepImportsToIndexedPackages from './rules/no-deep-imports-to-indexed-packages';
import noHrefWithRouterLink from './rules/no-href-with-router-link';
import noImplicitPublic from './rules/no-implicit-public';
import noPrivateEsnextFields from './rules/no-private-esnext-fields';
import preferDeepImports from './rules/prefer-deep-imports';
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
        'injection-token-description': injectionTokenDescription,
        'no-deep-imports': noDeepImports,
        'no-deep-imports-to-indexed-packages': noDeepImportsToIndexedPackages,
        'no-href-with-router-link': noHrefWithRouterLink,
        'no-implicit-public': noImplicitPublic,
        'no-private-esnext-fields': noPrivateEsnextFields,
        'prefer-deep-imports': preferDeepImports,
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
        ...recommended,
    ],
    ['taiga-specific']: [
        {files: ALL_TS_JS_FILES, plugins: {'@taiga-ui/experience-next': plugin}},
        ...taigaSpecific,
    ],
} as Linter.Config);

export {TUI_RECOMMENDED_NAMING_CONVENTION} from './rules/convention';

export default plugin;
