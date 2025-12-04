import fs from 'node:fs';
import path from 'node:path';

import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import {globSync} from 'glob';
import ts from 'typescript';

const MESSAGE_ID = 'prefer-deep-imports';
const ERROR_MESSAGE =
    'Import via root or non-leaf entry points is prohibited for this package';

type Options = [
    {
        importFilter: string[] | string;
        strict?: boolean;
        mockPaths?: Record<string, string>;
    },
];

type MessageIds = typeof MESSAGE_ID;

const moduleResolutionCache = new Map<string, string | null>();
const entryPointCache = new Map<string, boolean>();
const entryRootCache = new Map<string, string | null>();

const createRule = ESLintUtils.RuleCreator((name) => name);

export default createRule<Options, MessageIds>({
    create(context, [{importFilter, mockPaths, strict = false}]) {
        const selector = `ImportDeclaration[source.value=${getFilterRegExp(
            importFilter,
            strict,
        )}]`;

        return {
            [selector](node: TSESTree.ImportDeclaration) {
                const specifier = node.source.value satisfies string;
                const resolvedFile = resolveAlias(specifier, context, mockPaths);

                if (!resolvedFile) {
                    return;
                }

                const entryRoot =
                    findEntryRoot(resolvedFile) ?? path.dirname(resolvedFile);

                if (strict) {
                    const nested = isNestedEntryPoint(specifier);
                    const hasNested = checkNestedEntryPoints(entryRoot, mockPaths);

                    if (nested && !hasNested) {
                        return;
                    }
                }

                const fixed = tryFixImport(node, entryRoot);

                if (!fixed) {
                    context.report({messageId: MESSAGE_ID, node});

                    return;
                }

                context.report({
                    fix(fixer) {
                        return fixer.replaceTextRange(
                            [node.range[0], node.range[1]],
                            fixed,
                        );
                    },
                    messageId: MESSAGE_ID,
                    node,
                });
            },
        };
    },
    defaultOptions: [
        {
            importFilter: [],
            strict: false,
        },
    ],
    meta: {
        docs: {description: ERROR_MESSAGE},
        fixable: 'code',
        messages: {[MESSAGE_ID]: ERROR_MESSAGE},
        schema: [
            {
                additionalProperties: false,
                properties: {
                    importFilter: {type: ['string', 'array']},
                    mockPaths: {type: 'object'},
                    strict: {type: 'boolean'},
                },
                type: 'object',
            },
        ],
        type: 'problem',
    },
    name: 'prefer-deep-imports',
});

function resolveAlias(
    specifier: string,
    context: Parameters<ReturnType<typeof createRule>['create']>[0],
    mockPaths?: Record<string, string>,
): string | null {
    if (mockPaths && specifier in mockPaths) {
        return mockPaths[specifier] ?? null;
    }

    if (moduleResolutionCache.has(specifier)) {
        return moduleResolutionCache.get(specifier)!;
    }

    let result: string | null;

    try {
        const services = ESLintUtils.getParserServices(context);
        const program = services.program;
        const compilerOptions = program.getCompilerOptions();
        const resolved = ts.resolveModuleName(
            specifier,
            context.filename,
            compilerOptions,
            ts.sys,
        );

        result = resolved.resolvedModule?.resolvedFileName ?? null;
    } catch {
        result = null;
    }

    moduleResolutionCache.set(specifier, result);

    return result;
}

function getImportedName(node: TSESTree.Identifier | TSESTree.StringLiteral): string {
    return node.type === AST_NODE_TYPES.Identifier ? node.name : node.value;
}

function tryFixImport(
    node: TSESTree.ImportDeclaration,
    entryRoot: string,
): string | null {
    const specifiers = node.specifiers;
    const isTypeOnly = node.importKind === 'type';

    const allTsFiles = globSync(`${entryRoot}/**/*.ts`, {
        ignore: {ignored: (p) => /\.(spec|cy)\.ts$/.test(p.name)},
    });

    const sourceFiles = specifiers.map((sp) => {
        if (sp.type !== AST_NODE_TYPES.ImportSpecifier) {
            return null;
        }

        const importedName = getImportedName(sp.imported);
        const found = allTsFiles.find((filePath) => {
            const content = fs.readFileSync(filePath, 'utf8');
            const regExp = new RegExp(
                String.raw`(?<=export\s(default\s)?(abstract\s)?\w+\s)\b${importedName}\b`,
            );

            return regExp.test(content);
        });

        return found?.replaceAll(/\\+/g, '/');
    });

    if (sourceFiles.some((x) => !x)) {
        return null;
    }

    const entryPoints = sourceFiles.map(findNearestEntryPoint);

    if (entryPoints.some((x) => !x)) {
        return null;
    }

    const newImports = specifiers.map((sp, i) => {
        if (sp.type !== AST_NODE_TYPES.ImportSpecifier) {
            return null;
        }

        const imported = getImportedName(sp.imported);
        const local = sp.local.name;
        const mapped = imported === local ? imported : `${imported} as ${local}`;

        return `import ${isTypeOnly ? 'type ' : ''}{${mapped}} from '${entryPoints[i]}';`;
    });

    if (newImports.some((x) => x === null)) {
        return null;
    }

    return newImports.join('\n');
}

function findEntryRoot(resolvedFile: string): string | null {
    if (entryRootCache.has(resolvedFile)) {
        return entryRootCache.get(resolvedFile)!;
    }

    let dir = path.dirname(resolvedFile);

    while (dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, 'ng-package.json'))) {
            entryRootCache.set(resolvedFile, dir);

            return dir;
        }

        dir = path.dirname(dir);
    }

    entryRootCache.set(resolvedFile, null);

    return null;
}

function findNearestEntryPoint(filePath?: string | null): string {
    if (!filePath) {
        return '';
    }

    const parts = filePath.split('/');

    for (let i = parts.length - 1; i >= 0; i--) {
        const candidate = parts.slice(0, i).join('/');

        if (fs.existsSync(`${candidate}/ng-package.json`)) {
            return candidate;
        }
    }

    return '';
}

function checkNestedEntryPoints(
    entryRoot: string,
    mockPaths?: Record<string, string>,
): boolean {
    if (mockPaths && Object.keys(mockPaths).length > 0) {
        const normRoot = entryRoot.replaceAll('\\', '/').replace(/\/+$/, '');
        const hasNestedMock = Object.values(mockPaths).some((resolved) => {
            const dir = path.dirname(resolved).replaceAll('\\', '/');

            return dir.startsWith(`${normRoot}/`) && dir !== normRoot;
        });

        if (hasNestedMock) {
            return true;
        }
    }

    if (entryPointCache.has(entryRoot)) {
        return entryPointCache.get(entryRoot)!;
    }

    const nested = globSync(`${entryRoot}/**/ng-package.json`).map((path) =>
        path.replaceAll(/\\+/g, '/'),
    );

    const hasNested = nested.some((path) => path !== `${entryRoot}/ng-package.json`);

    entryPointCache.set(entryRoot, hasNested);

    return hasNested;
}

function isNestedEntryPoint(specifier: string): boolean {
    const segments = specifier.split('/');

    return specifier.startsWith('@') ? segments.length > 2 : segments.length > 1;
}

function getFilterRegExp(filter: string[] | string, strict: boolean): string {
    if (typeof filter === 'string' && filter.startsWith('/')) {
        return strict ? extendRegExp(filter) : filter;
    }

    const packages = typeof filter === 'string' ? [filter] : filter;
    const [npmScope] = packages[0]?.split('/') ?? [];
    const names = packages.map((p) => p.split('/')[1]).filter(Boolean);

    const base = String.raw`/^${npmScope}\u002F(${names.join('|')})$/`;

    return strict ? extendRegExp(base) : base;
}

function extendRegExp(regExp: string): string {
    const trimmed = regExp.trim();
    const slash = trimmed.lastIndexOf('/');

    if (!trimmed.startsWith('/') || slash <= 1) {
        return regExp;
    }

    const flags = trimmed.slice(slash + 1);
    const pattern = trimmed.slice(1, slash);
    const strictPattern = String.raw`${pattern.replace(/\$$/, '')}(?:\u002F.*)?$`;

    return `/${strictPattern}/${flags}`;
}
