import fs, {globSync} from 'node:fs';
import path from 'node:path';

import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {ESLintUtils, type TSESLint, type TSESTree} from '@typescript-eslint/utils';
import ts from 'typescript';

import {createRule} from '../utils/create-rule';

const MESSAGE_ID = 'prefer-deep-imports';

const ERROR_MESSAGE =
    'Import via root entry point is prohibited when nested entry points exist';

type RuleOptions = [
    {
        /**
         * List of package names for which this rule should be applied.
         * Usually something like: ['@taiga-ui/core', '@taiga-ui/cdk', ...]
         */
        importFilter: string[] | string;

        /**
         * strict = false:
         *   - Only rewrite imports from the root package path
         *   - Target only the first-level nested entry point (e.g. "@pkg/components")
         *
         * strict = true:
         *   - May rewrite imports from nested paths as well
         *   - Target the deepest nested entry point that actually exports the symbol
         */
        strict?: boolean;
    },
];

type MessageIds = typeof MESSAGE_ID;

type RootEntryDirectoryCache = Map<string, string | null>;

type NestedEntryPointPathsCache = Map<string, string[]>;

type EntryPointBySymbolCache = Map<string, Map<string, string>>;

type ImportSpecifier = TSESTree.ImportDeclaration['specifiers'][number];

interface SharedPreferDeepImportsState {
    readonly rootEntryDirectoryByImport: RootEntryDirectoryCache;
    readonly nestedEntryPointPathsByRoot: NestedEntryPointPathsCache;
    readonly entryPointBySymbolCache: EntryPointBySymbolCache;
}

interface PreferDeepImportsState {
    readonly allowedPackages: ReadonlySet<string>;
    readonly isStrictMode: boolean;
    readonly program: ts.Program;
    readonly typeChecker: ts.TypeChecker;
    readonly sourceCode: Readonly<TSESLint.SourceCode>;
    readonly shared: SharedPreferDeepImportsState;
}

interface GetCachedRootEntryDirectoryParams {
    importPath: string;
    fromFile: string;
    state: PreferDeepImportsState;
}

interface MapSymbolsToEntryPointsParams {
    importedSymbols: string[];
    candidateEntryPoints: string[];
    rootEntryDirectory: string;
    state: PreferDeepImportsState;
}

interface GetCachedEntryPointBySymbolParams {
    candidateEntryPoints: string[];
    rootEntryDirectory: string;
    state: PreferDeepImportsState;
}

interface BuildEntryPointBySymbolIndexParams {
    candidateEntryPoints: string[];
    rootEntryDirectory: string;
    state: PreferDeepImportsState;
}

interface GetExportedNamesForEntryPointParams {
    rootEntryDirectory: string;
    relativeEntryDirectory: string;
    state: PreferDeepImportsState;
}

interface BuildRewrittenImportsParams {
    node: TSESTree.ImportDeclaration;
    baseImportPath: string;
    symbolToEntryPoint: Map<string, string>;
    state: PreferDeepImportsState;
}

interface BuildNamedImportStatementParams {
    specifiers: TSESTree.ImportSpecifier[];
    importPath: string;
    importKind: TSESTree.ImportDeclaration['importKind'];
    state: PreferDeepImportsState;
}

interface BuildImportStatementParams {
    specifiers: ImportSpecifier[];
    importPath: string;
    importKind: TSESTree.ImportDeclaration['importKind'];
    state: PreferDeepImportsState;
}

const sharedStateByProgram = new WeakMap<ts.Program, SharedPreferDeepImportsState>();

export const rule = createRule<RuleOptions, MessageIds>({
    create(context, [options]) {
        const allowedPackages = new Set(normalizeImportFilter(options.importFilter));

        if (allowedPackages.size === 0) {
            return {};
        }

        const isStrictMode = options.strict ?? false;
        let state: PreferDeepImportsState | null = null;

        function getState(): PreferDeepImportsState {
            if (state) {
                return state;
            }

            const parserServices = ESLintUtils.getParserServices(context);
            const program = parserServices.program;

            state = {
                allowedPackages,
                isStrictMode,
                program,
                shared: getSharedState(program),
                sourceCode: context.sourceCode,
                typeChecker: program.getTypeChecker(),
            };

            return state;
        }

        return {
            ImportDeclaration(node: TSESTree.ImportDeclaration) {
                const rawImportPath = node.source.value;

                if (typeof rawImportPath !== 'string') {
                    return;
                }

                const rootPackageName = getRootPackageName(rawImportPath);

                if (
                    !rootPackageName ||
                    !allowedPackages.has(rootPackageName) ||
                    (!isStrictMode &&
                        isAlreadyNestedImport(rawImportPath, rootPackageName))
                ) {
                    return;
                }

                const importedSymbols = extractNamedImportedSymbols(node);

                if (importedSymbols.length === 0) {
                    return;
                }

                const currentState = getState();

                const rootEntryDirectory = getCachedRootEntryDirectory({
                    fromFile: context.getFilename(),
                    importPath: rawImportPath,
                    state: currentState,
                });

                if (!rootEntryDirectory) {
                    return;
                }

                const nestedEntryPointRelativePaths =
                    getCachedNestedEntryPointRelativePaths(
                        rootEntryDirectory,
                        currentState.shared.nestedEntryPointPathsByRoot,
                    );

                if (nestedEntryPointRelativePaths.length === 0) {
                    return;
                }

                const candidateEntryPointPaths = selectCandidateEntryPointsForMode(
                    nestedEntryPointRelativePaths,
                    currentState.isStrictMode,
                );

                if (candidateEntryPointPaths.length === 0) {
                    return;
                }

                const symbolToEntryPoint = mapSymbolsToEntryPointsUsingTypeChecker({
                    candidateEntryPoints: candidateEntryPointPaths,
                    importedSymbols,
                    rootEntryDirectory,
                    state: currentState,
                });

                if (symbolToEntryPoint.size === 0) {
                    return;
                }

                const newImportBlock = buildRewrittenImports({
                    baseImportPath: rawImportPath,
                    node,
                    state: currentState,
                    symbolToEntryPoint,
                });

                context.report({
                    fix(fixer) {
                        return fixer.replaceTextRange(node.range, newImportBlock);
                    },
                    messageId: MESSAGE_ID,
                    node,
                });
            },
        };
    },
    meta: {
        defaultOptions: [
            {
                importFilter: [],
                strict: false,
            },
        ],
        docs: {description: ERROR_MESSAGE},
        fixable: 'code',
        messages: {[MESSAGE_ID]: ERROR_MESSAGE},
        schema: [
            {
                additionalProperties: false,
                properties: {
                    importFilter: {
                        oneOf: [
                            {type: 'string'},
                            {
                                items: {type: 'string'},
                                type: 'array',
                            },
                        ],
                    },
                    strict: {type: 'boolean'},
                },
                type: 'object',
            },
        ],
        type: 'problem',
    },
    name: 'prefer-deep-imports',
});

export default rule;

function getSharedState(program: ts.Program): SharedPreferDeepImportsState {
    const cached = sharedStateByProgram.get(program);

    if (cached) {
        return cached;
    }

    const state: SharedPreferDeepImportsState = {
        entryPointBySymbolCache: new Map(),
        nestedEntryPointPathsByRoot: new Map(),
        rootEntryDirectoryByImport: new Map(),
    };

    sharedStateByProgram.set(program, state);

    return state;
}

function normalizeImportFilter(importFilter: string[] | string): string[] {
    return (Array.isArray(importFilter) ? importFilter : [importFilter]).filter(Boolean);
}

function getRootPackageName(importPath: string): string | null {
    if (importPath.startsWith('@')) {
        const segments = importPath.split('/');

        if (segments.length < 2) {
            return null;
        }

        return `${segments[0]}/${segments[1]}`;
    }

    const parts = importPath.split('/');

    return parts[0] ?? null;
}

function isAlreadyNestedImport(importPath: string, rootPackageName: string): boolean {
    if (!importPath.startsWith(rootPackageName)) {
        return false;
    }

    const importSegments = importPath.split('/');
    const rootSegments = rootPackageName.split('/');

    return importSegments.length > rootSegments.length;
}

function extractNamedImportedSymbols(node: TSESTree.ImportDeclaration): string[] {
    return node.specifiers
        .filter(
            (specifier): specifier is TSESTree.ImportSpecifier =>
                specifier.type === AST_NODE_TYPES.ImportSpecifier,
        )
        .map(getImportedName);
}

function getImportedName(specifier: TSESTree.ImportSpecifier): string {
    return specifier.imported.type === AST_NODE_TYPES.Identifier
        ? specifier.imported.name
        : specifier.imported.value;
}

function getCachedRootEntryDirectory({
    fromFile,
    importPath,
    state,
}: GetCachedRootEntryDirectoryParams): string | null {
    const cacheKey = `${path.dirname(fromFile)}\0${importPath}`;
    const cache = state.shared.rootEntryDirectoryByImport;

    if (cache.has(cacheKey)) {
        return cache.get(cacheKey) ?? null;
    }

    const rootEntryDirectory = resolveRootEntryDirectory({
        fromFile,
        importPath,
        program: state.program,
    });

    cache.set(cacheKey, rootEntryDirectory);

    return rootEntryDirectory;
}

function resolveRootEntryDirectory({
    fromFile,
    importPath,
    program,
}: {
    importPath: string;
    fromFile: string;
    program: ts.Program;
}): string | null {
    const resolution = ts.resolveModuleName(
        importPath,
        fromFile,
        program.getCompilerOptions(),
        ts.sys,
    ).resolvedModule;

    return resolution ? path.dirname(resolution.resolvedFileName) : null;
}

function getCachedNestedEntryPointRelativePaths(
    rootEntryDirectory: string,
    cache: NestedEntryPointPathsCache,
): string[] {
    if (cache.has(rootEntryDirectory)) {
        return cache.get(rootEntryDirectory) ?? [];
    }

    const entryPoints = findNestedEntryPointRelativePaths(rootEntryDirectory);

    cache.set(rootEntryDirectory, entryPoints);

    return entryPoints;
}

function findNestedEntryPointRelativePaths(rootEntryDirectory: string): string[] {
    const files = ['**/ng-package.json', '**/collection.json'].flatMap((pattern) =>
        globSync(pattern, {cwd: rootEntryDirectory}),
    );

    const directories = files
        .map((file) => path.posix.dirname(file.replaceAll('\\', '/')))
        .filter((directory) => directory && directory !== '.');

    return [...new Set(directories)];
}

function selectCandidateEntryPointsForMode(
    allNestedRelativePaths: string[],
    strict: boolean,
): string[] {
    if (!strict) {
        return allNestedRelativePaths.filter(
            (relativePath) => !relativePath.includes('/'),
        );
    }

    return [...allNestedRelativePaths].sort((a, b) => {
        const depthA = a.split('/').filter(Boolean).length;
        const depthB = b.split('/').filter(Boolean).length;

        return depthB - depthA;
    });
}

function mapSymbolsToEntryPointsUsingTypeChecker({
    candidateEntryPoints,
    importedSymbols,
    rootEntryDirectory,
    state,
}: MapSymbolsToEntryPointsParams): Map<string, string> {
    const symbolToEntryPoint = new Map<string, string>();

    const entryPointBySymbol = getCachedEntryPointBySymbol({
        candidateEntryPoints,
        rootEntryDirectory,
        state,
    });

    for (const importedSymbol of importedSymbols) {
        const entryPoint = entryPointBySymbol.get(importedSymbol);

        if (entryPoint) {
            symbolToEntryPoint.set(importedSymbol, entryPoint);
        }
    }

    return symbolToEntryPoint;
}

function getCachedEntryPointBySymbol({
    candidateEntryPoints,
    rootEntryDirectory,
    state,
}: GetCachedEntryPointBySymbolParams): Map<string, string> {
    const cacheKey = `${rootEntryDirectory}\0${candidateEntryPoints.join('\0')}`;
    const cache = state.shared.entryPointBySymbolCache;

    if (cache.has(cacheKey)) {
        return cache.get(cacheKey) ?? new Map();
    }

    const entryPointBySymbol = buildEntryPointBySymbolIndex({
        candidateEntryPoints,
        rootEntryDirectory,
        state,
    });

    cache.set(cacheKey, entryPointBySymbol);

    return entryPointBySymbol;
}

function buildEntryPointBySymbolIndex({
    candidateEntryPoints,
    rootEntryDirectory,
    state,
}: BuildEntryPointBySymbolIndexParams): Map<string, string> {
    const entryPointBySymbol = new Map<string, string>();

    for (const relativeEntryDir of candidateEntryPoints) {
        const exportedNames = getExportedNamesForEntryPoint({
            relativeEntryDirectory: relativeEntryDir,
            rootEntryDirectory,
            state,
        });

        if (!exportedNames) {
            continue;
        }

        for (const exportedName of exportedNames) {
            if (!entryPointBySymbol.has(exportedName)) {
                entryPointBySymbol.set(exportedName, relativeEntryDir);
            }
        }
    }

    return entryPointBySymbol;
}

function getExportedNamesForEntryPoint({
    relativeEntryDirectory,
    rootEntryDirectory,
    state,
}: GetExportedNamesForEntryPointParams): Set<string> | null {
    const entryFile = getEntryFileForNestedEntryPoint(
        rootEntryDirectory,
        relativeEntryDirectory,
    );

    if (!entryFile) {
        return null;
    }

    const sourceFile = state.program.getSourceFile(entryFile);

    if (!sourceFile) {
        return null;
    }

    const moduleSymbol = state.typeChecker.getSymbolAtLocation(sourceFile);

    if (!moduleSymbol) {
        return null;
    }

    const exports = state.typeChecker.getExportsOfModule(moduleSymbol);

    return new Set(exports.map((symbol) => symbol.getName()));
}

function getEntryFileForNestedEntryPoint(
    rootEntryDirectory: string,
    relativeEntryDirectory: string,
): string | null {
    const absoluteDirectory = path.join(rootEntryDirectory, relativeEntryDirectory);
    const ngPackageJsonPath = path.join(absoluteDirectory, 'ng-package.json');
    const collectionJsonPath = path.join(absoluteDirectory, 'collection.json');

    if (fs.existsSync(ngPackageJsonPath)) {
        try {
            const raw = fs.readFileSync(ngPackageJsonPath, 'utf8');
            const json = JSON.parse(raw) as {lib?: {entryFile?: string}};
            const entryRelative = json.lib?.entryFile ?? 'index.ts';

            return path.resolve(absoluteDirectory, entryRelative);
        } catch {
            const fallback = path.resolve(absoluteDirectory, 'index.ts');

            return fs.existsSync(fallback) ? fallback : null;
        }
    }

    if (fs.existsSync(collectionJsonPath)) {
        const entryFile = path.resolve(absoluteDirectory, 'index.ts');

        return fs.existsSync(entryFile) ? entryFile : null;
    }

    return null;
}

function buildRewrittenImports({
    baseImportPath,
    node,
    state,
    symbolToEntryPoint,
}: BuildRewrittenImportsParams): string {
    const groupedByTarget = new Map<string, TSESTree.ImportSpecifier[]>();
    const remainingSpecifiers: ImportSpecifier[] = [];

    for (const specifier of node.specifiers) {
        if (specifier.type !== AST_NODE_TYPES.ImportSpecifier) {
            remainingSpecifiers.push(specifier);
            continue;
        }

        const importedName = getImportedName(specifier);
        const relativeEntryPath = symbolToEntryPoint.get(importedName);

        if (!relativeEntryPath) {
            remainingSpecifiers.push(specifier);
            continue;
        }

        const targetSpecifier = `${baseImportPath}/${relativeEntryPath}`;

        if (!groupedByTarget.has(targetSpecifier)) {
            groupedByTarget.set(targetSpecifier, []);
        }

        groupedByTarget.get(targetSpecifier)?.push(specifier);
    }

    const importStatements: string[] = [];

    for (const [targetSpecifier, specifiers] of groupedByTarget.entries()) {
        importStatements.push(
            buildNamedImportStatement({
                importKind: node.importKind,
                importPath: targetSpecifier,
                specifiers,
                state,
            }),
        );
    }

    const remainingImportStatement = buildImportStatement({
        importKind: node.importKind,
        importPath: baseImportPath,
        specifiers: remainingSpecifiers,
        state,
    });

    if (remainingImportStatement) {
        importStatements.push(remainingImportStatement);
    }

    return importStatements.join('\n');
}

function buildNamedImportStatement({
    importKind,
    importPath,
    specifiers,
    state,
}: BuildNamedImportStatementParams): string {
    const importKeyword = importKind === 'type' ? 'import type' : 'import';
    const parts = specifiers.map((specifier) => state.sourceCode.getText(specifier));

    return `${importKeyword} {${parts.join(', ')}} from '${importPath}';`;
}

function buildImportStatement({
    importKind,
    importPath,
    specifiers,
    state,
}: BuildImportStatementParams): string | null {
    if (specifiers.length === 0) {
        return null;
    }

    const importKeyword = importKind === 'type' ? 'import type' : 'import';

    const defaultSpecifier = specifiers.find(
        (specifier) => specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier,
    );

    const namespaceSpecifier = specifiers.find(
        (specifier) => specifier.type === AST_NODE_TYPES.ImportNamespaceSpecifier,
    );

    const namedSpecifiers = specifiers.filter(
        (specifier): specifier is TSESTree.ImportSpecifier =>
            specifier.type === AST_NODE_TYPES.ImportSpecifier,
    );

    const clauses: string[] = [];

    if (defaultSpecifier) {
        clauses.push(state.sourceCode.getText(defaultSpecifier));
    }

    if (namespaceSpecifier) {
        clauses.push(state.sourceCode.getText(namespaceSpecifier));
    }

    if (namedSpecifiers.length > 0) {
        clauses.push(
            `{${namedSpecifiers.map((specifier) => state.sourceCode.getText(specifier)).join(', ')}}`,
        );
    }

    if (clauses.length === 0) {
        return null;
    }

    return `${importKeyword} ${clauses.join(', ')} from '${importPath}';`;
}
