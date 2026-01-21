import fs from 'node:fs';
import path from 'node:path';

import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import {globSync} from 'glob';
import ts from 'typescript';

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

const createRule = ESLintUtils.RuleCreator(() => ERROR_MESSAGE);

export default createRule<RuleOptions, MessageIds>({
    create(context, [options]) {
        const allowedPackages = normalizeImportFilter(options.importFilter);
        const isStrictMode = options.strict ?? false;
        const parserServices = ESLintUtils.getParserServices(context);
        const program = parserServices.program;
        const typeChecker = program.getTypeChecker();

        return {
            ImportDeclaration(node: TSESTree.ImportDeclaration) {
                const rawImportPath = node.source.value;

                if (typeof rawImportPath !== 'string') {
                    return;
                }

                const rootPackageName = getRootPackageName(rawImportPath);

                if (!rootPackageName) {
                    return;
                }

                if (!allowedPackages.includes(rootPackageName)) {
                    return;
                }

                if (
                    !isStrictMode &&
                    isAlreadyNestedImport(rawImportPath, rootPackageName)
                ) {
                    return;
                }

                const importedSymbols = extractNamedImportedSymbols(node);

                if (importedSymbols.length === 0) {
                    return;
                }

                const currentFileName = context.getFilename();

                const rootEntryDirectory = resolveRootEntryDirectory(
                    rawImportPath,
                    currentFileName,
                    program,
                );

                if (!rootEntryDirectory) {
                    context.report({
                        messageId: MESSAGE_ID,
                        node,
                    });

                    return;
                }

                const nestedEntryPointRelativePaths =
                    findNestedEntryPointRelativePaths(rootEntryDirectory);

                if (nestedEntryPointRelativePaths.length === 0) {
                    context.report({
                        messageId: MESSAGE_ID,
                        node,
                    });

                    return;
                }

                const candidateEntryPointPaths = selectCandidateEntryPointsForMode(
                    nestedEntryPointRelativePaths,
                    isStrictMode,
                );

                if (candidateEntryPointPaths.length === 0) {
                    return;
                }

                const symbolToEntryPoint = mapSymbolsToEntryPointsUsingTypeChecker(
                    importedSymbols,
                    candidateEntryPointPaths,
                    rootEntryDirectory,
                    program,
                    typeChecker,
                );

                if (symbolToEntryPoint.size === 0) {
                    return;
                }

                const newImportBlock = buildRewrittenImports(
                    node,
                    rawImportPath,
                    symbolToEntryPoint,
                );

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
                    strict: {type: 'boolean'},
                },
                type: 'object',
            },
        ],
        type: 'problem',
    },

    name: 'prefer-deep-imports',
});

/**
 * Normalize "importFilter" option to a flat array of package names.
 * The rule expects concrete package names, not regular expression strings.
 */
function normalizeImportFilter(importFilter: string[] | string): string[] {
    return Array.isArray(importFilter) ? importFilter : [importFilter];
}

/**
 * Extract the package root name from an import specifier.
 *
 * Examples:
 *  "@taiga-ui/core"               → "@taiga-ui/core"
 *  "@taiga-ui/core/components"   → "@taiga-ui/core"
 *  "some-lib"                    → "some-lib"
 *  "some-lib/utils"              → "some-lib"
 */
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

/**
 * Check whether the current import path is already nested below the root package.
 *
 * Example:
 *   root = "@taiga-ui/core"
 *   "@taiga-ui/core"               → false (root import)
 *   "@taiga-ui/core/components"    → true
 *   "@taiga-ui/core/components/x"  → true
 */
function isAlreadyNestedImport(importPath: string, rootPackageName: string): boolean {
    if (!importPath.startsWith(rootPackageName)) {
        return false;
    }

    const importSegments = importPath.split('/');
    const rootSegments = rootPackageName.split('/');

    return importSegments.length > rootSegments.length;
}

/**
 * Extract only named imported symbols:
 *
 * Examples:
 *   import {A, B as C} from 'x';  → ['A', 'B']
 *
 * Namespace imports and default imports are ignored for this rule.
 */
function extractNamedImportedSymbols(node: TSESTree.ImportDeclaration): string[] {
    return node.specifiers
        .filter(
            (specifier): specifier is TSESTree.ImportSpecifier =>
                specifier.type === AST_NODE_TYPES.ImportSpecifier,
        )
        .map((specifier) =>
            specifier.imported.type === AST_NODE_TYPES.Identifier
                ? specifier.imported.name
                : specifier.imported.value,
        );
}

/**
 * Resolve the physical directory of the module being imported.
 * We rely on the same module resolution that TypeScript uses for the program.
 */
function resolveRootEntryDirectory(
    importPath: string,
    fromFile: string,
    program: ts.Program,
): string | null {
    const compilerOptions = program.getCompilerOptions();

    const resolution = ts.resolveModuleName(
        importPath,
        fromFile,
        compilerOptions,
        ts.sys,
    ).resolvedModule;

    if (!resolution) {
        return null;
    }

    return path.dirname(resolution.resolvedFileName);
}

/**
 * Find all nested entry points relative to the given root directory.
 *
 * A directory is considered a nested entry point if it contains either:
 *   - "ng-package.json"  (Angular library entry)
 *   - "collection.json"  (Angular schematics collection)
 *
 * Returned paths are relative to "rootEntryDirectory".
 *
 * Example:
 *   rootEntryDirectory = ".../core/src"
 *   found:
 *     "utils/ng-package.json"          → "utils"
 *     "utils/dom/ng-package.json"      → "utils/dom"
 *     "schematics/collection.json"     → "schematics"
 */
function findNestedEntryPointRelativePaths(rootEntryDirectory: string): string[] {
    const ngPackageJsonFiles = globSync('**/ng-package.json', {
        absolute: false,
        cwd: rootEntryDirectory,
    });

    const collectionJsonFiles = globSync('**/collection.json', {
        absolute: false,
        cwd: rootEntryDirectory,
    });

    const directories: string[] = [];

    for (const file of ngPackageJsonFiles) {
        const normalized = file.replaceAll('\\', '/').replace(/\/ng-package\.json$/, '');

        if (normalized && normalized !== '.') {
            directories.push(normalized);
        }
    }

    for (const file of collectionJsonFiles) {
        const normalized = file.replaceAll('\\', '/').replace(/\/collection\.json$/, '');

        if (normalized && normalized !== '.') {
            directories.push(normalized);
        }
    }

    return directories;
}

/**
 * For strict = false:
 *   Only first-level nested directories are candidates.
 *
 * For strict = true:
 *   All nested directories are candidates, sorted from deepest to shallowest
 *   so that the deepest match wins.
 */
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

/**
 * Build a map from exported symbol name to nested entry point relative path.
 *
 * Implementation strategy:
 *   1. For each candidate nested entry point:
 *      - Determine its entry file (using ng-package.json or collection.json).
 *      - Ask TypeScript for the module symbol and its exports.
 *   2. For each imported symbol:
 *      - Find the first entry point whose export table contains that symbol.
 *      - strict = true: candidates were sorted deepest-first.
 *      - strict = false: candidates contain only first-level nested entry points.
 */
function mapSymbolsToEntryPointsUsingTypeChecker(
    importedSymbols: string[],
    candidateEntryPoints: string[],
    rootEntryDirectory: string,
    program: ts.Program,
    typeChecker: ts.TypeChecker,
): Map<string, string> {
    const symbolToEntryPoint = new Map<string, string>();
    const exportTableByEntryPoint = new Map<string, Set<string>>();

    for (const relativeEntryDir of candidateEntryPoints) {
        const entryFile = getEntryFileForNestedEntryPoint(
            rootEntryDirectory,
            relativeEntryDir,
        );

        if (!entryFile) {
            continue;
        }

        const sourceFile = program.getSourceFile(entryFile);

        if (!sourceFile) {
            continue;
        }

        const moduleSymbol = typeChecker.getSymbolAtLocation(sourceFile);

        if (!moduleSymbol) {
            continue;
        }

        const exports = typeChecker.getExportsOfModule(moduleSymbol);
        const exportedNames = new Set<string>(exports.map((symbol) => symbol.getName()));

        exportTableByEntryPoint.set(relativeEntryDir, exportedNames);
    }

    for (const importedSymbol of importedSymbols) {
        for (const relativeEntryDir of candidateEntryPoints) {
            const exportedNames = exportTableByEntryPoint.get(relativeEntryDir);

            if (!exportedNames) {
                continue;
            }

            if (!exportedNames.has(importedSymbol)) {
                continue;
            }

            symbolToEntryPoint.set(importedSymbol, relativeEntryDir);
            break;
        }
    }

    return symbolToEntryPoint;
}

/**
 * Determine the physical entry file for a nested entry point.
 *
 * Priority:
 *   1. If "ng-package.json" exists:
 *        - use lib.entryFile if present
 *        - otherwise fall back to "index.ts"
 *   2. Else if "collection.json" exists:
 *        - treat this directory as a schematic collection package
 *        - entry file is "index.ts" if it exists
 *   3. Otherwise: no entry file can be determined → return null
 */
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

/**
 * Build the final text block with rewritten import declarations.
 *
 * Example:
 *   original:
 *     import {A, B as C, D} from '@taiga-ui/core';
 *
 *   symbolMap (strict = true):
 *     A -> "components/button"
 *     B -> "components/button"
 *     D -> "components/other"
 *
 *   result:
 *     import {A, B as C} from '@taiga-ui/core/components/button';
 *     import {D} from '@taiga-ui/core/components/other';
 */
function buildRewrittenImports(
    node: TSESTree.ImportDeclaration,
    baseImportPath: string,
    symbolToEntryPoint: Map<string, string>,
): string {
    const isTypeOnlyImport = node.importKind === 'type';
    const groupedByTarget = new Map<string, string[]>();

    for (const [symbolName, relativeEntryPath] of symbolToEntryPoint.entries()) {
        const targetSpecifier = `${baseImportPath}/${relativeEntryPath}`;

        if (!groupedByTarget.has(targetSpecifier)) {
            groupedByTarget.set(targetSpecifier, []);
        }

        groupedByTarget.get(targetSpecifier)!.push(symbolName);
    }

    const importStatements: string[] = [];

    for (const [targetSpecifier, symbols] of groupedByTarget.entries()) {
        const parts = symbols.map((symbolName) => {
            const matchingSpecifier = node.specifiers.find(
                (specifier): specifier is TSESTree.ImportSpecifier =>
                    specifier.type === AST_NODE_TYPES.ImportSpecifier &&
                    (specifier.imported.type === AST_NODE_TYPES.Identifier
                        ? specifier.imported.name === symbolName
                        : specifier.imported.value === symbolName),
            );

            if (!matchingSpecifier) {
                return symbolName;
            }

            const importedName =
                matchingSpecifier.imported.type === AST_NODE_TYPES.Identifier
                    ? matchingSpecifier.imported.name
                    : matchingSpecifier.imported.value;

            const localName = matchingSpecifier.local.name;

            return importedName === localName
                ? importedName
                : `${importedName} as ${localName}`;
        });

        const statement = `import ${isTypeOnlyImport ? 'type ' : ''}{${parts.join(
            ', ',
        )}} from '${targetSpecifier}';`;

        importStatements.push(statement);
    }

    return importStatements.join('\n');
}
