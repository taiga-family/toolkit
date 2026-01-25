import fs from 'node:fs';
import path from 'node:path';

import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import ts from 'typescript';

const createRule = ESLintUtils.RuleCreator((name) => name);

const resolveCacheByOptions = new WeakMap<
    ts.CompilerOptions,
    Map<string, string | null>
>();
const nearestFileUpCache = new Map<string, string | null>();
const markerCache = new Map<string, string | null>();
const indexFileCache = new Map<string, string | null>();
const indexExportsCache = new Map<string, {mtimeMs: number; set: Set<string>}>();

export default createRule({
    create(context) {
        const parserServices = ESLintUtils.getParserServices(context);
        const program = parserServices.program;
        const compilerOptions = program.getCompilerOptions();
        const compilerHost = ts.createCompilerHost(compilerOptions, true);

        const containingDir = path.dirname(context.filename);

        function resolveTypescriptModuleCached(moduleSpecifier: string): string | null {
            let cache = resolveCacheByOptions.get(compilerOptions);

            if (!cache) {
                cache = new Map<string, string | null>();
                resolveCacheByOptions.set(compilerOptions, cache);
            }

            const key = `${containingDir}\0${moduleSpecifier}`;

            if (cache.has(key)) {
                return cache.get(key)!;
            }

            const resolved = ts.resolveModuleName(
                moduleSpecifier,
                context.filename,
                compilerOptions,
                compilerHost,
            );

            const file = resolved.resolvedModule?.resolvedFileName ?? null;

            cache.set(key, file);

            return file;
        }

        function findNearestFileUpwardsCached(
            startDirectory: string,
            fileName: string,
        ): string | null {
            const key = `${startDirectory}\0${fileName}`;

            if (nearestFileUpCache.has(key)) {
                return nearestFileUpCache.get(key)!;
            }

            let currentDirectory = startDirectory;

            while (currentDirectory.length > 0) {
                const candidatePath = path.join(currentDirectory, fileName);

                if (fs.existsSync(candidatePath)) {
                    nearestFileUpCache.set(key, candidatePath);

                    return candidatePath;
                }

                const parentDirectory = path.dirname(currentDirectory);

                if (parentDirectory === currentDirectory) {
                    break;
                }

                currentDirectory = parentDirectory;
            }

            nearestFileUpCache.set(key, null);

            return null;
        }

        function pickPackageMarkerFileCached(
            resolvedRootFilePath: string,
        ): string | null {
            if (markerCache.has(resolvedRootFilePath)) {
                return markerCache.get(resolvedRootFilePath)!;
            }

            const resolvedRootDirectory = path.dirname(resolvedRootFilePath);
            const nearestNgPackageJson = findNearestFileUpwardsCached(
                resolvedRootDirectory,
                'ng-package.json',
            );
            const nearestPackageJson = findNearestFileUpwardsCached(
                resolvedRootDirectory,
                'package.json',
            );

            const marker = nearestNgPackageJson ?? nearestPackageJson ?? null;

            markerCache.set(resolvedRootFilePath, marker);

            return marker;
        }

        function pickIndexFileInDirectoryCached(packageDirectory: string): string | null {
            if (indexFileCache.has(packageDirectory)) {
                return indexFileCache.get(packageDirectory)!;
            }

            const indexTypescriptPath = path.join(packageDirectory, 'index.ts');
            const indexTypesDeclarationPath = path.join(packageDirectory, 'index.d.ts');

            let indexFilePath = null;

            if (fs.existsSync(indexTypescriptPath)) {
                indexFilePath = indexTypescriptPath;
            } else if (fs.existsSync(indexTypesDeclarationPath)) {
                indexFilePath = indexTypesDeclarationPath;
            }

            indexFileCache.set(packageDirectory, indexFilePath);

            return indexFilePath;
        }

        function getIndexReExportSpecifiersSet(indexFilePath: string): Set<string> {
            let stat: fs.Stats;

            try {
                stat = fs.statSync(indexFilePath);
            } catch {
                return new Set<string>();
            }

            const cached = indexExportsCache.get(indexFilePath);

            if (cached?.mtimeMs === stat.mtimeMs) {
                return cached.set;
            }

            const fileText = fs.readFileSync(indexFilePath, 'utf8');
            const sourceFile = ts.createSourceFile(
                indexFilePath,
                fileText,
                ts.ScriptTarget.Latest,
                true,
                ts.ScriptKind.TS,
            );

            const set = new Set<string>();

            sourceFile.forEachChild((astNode) => {
                if (!ts.isExportDeclaration(astNode)) {
                    return;
                }

                const ms = astNode.moduleSpecifier;

                if (ms && ts.isStringLiteral(ms)) {
                    set.add(normalizeModuleSpecifier(stripKnownExtensions(ms.text)));
                }
            });

            indexExportsCache.set(indexFilePath, {mtimeMs: stat.mtimeMs, set});

            return set;
        }

        function indexExportsSubpathCached(
            indexFilePath: string,
            subpath: string,
        ): boolean {
            const set = getIndexReExportSpecifiersSet(indexFilePath);

            const expectedSpecifier = normalizeModuleSpecifier(
                stripKnownExtensions(`./${subpath}`),
            );
            const expectedIndexSpecifier = normalizeModuleSpecifier(
                stripKnownExtensions(`./${subpath}/index`),
            );

            return set.has(expectedSpecifier) || set.has(expectedIndexSpecifier);
        }

        return {
            ImportDeclaration(node: TSESTree.ImportDeclaration) {
                const importSpecifier = node.source.value as string | null;

                if (typeof importSpecifier !== 'string') {
                    return;
                }

                if (!importSpecifier.includes('/')) {
                    return;
                }

                if (!isExternalModuleSpecifier(importSpecifier)) {
                    return;
                }

                const packageRootSpecifier = getPackageRootSpecifier(importSpecifier);
                const importSubpath = getSubpath(importSpecifier, packageRootSpecifier);

                if (!importSubpath) {
                    return;
                }

                const resolvedRootModuleFilePath =
                    resolveTypescriptModuleCached(packageRootSpecifier);

                if (!resolvedRootModuleFilePath) {
                    return;
                }

                const packageMarkerFilePath = pickPackageMarkerFileCached(
                    resolvedRootModuleFilePath,
                );

                if (!packageMarkerFilePath) {
                    return;
                }

                const packageDirectory = path.dirname(packageMarkerFilePath);
                const indexFilePath = pickIndexFileInDirectoryCached(packageDirectory);

                if (!indexFilePath) {
                    return;
                }

                const hasMatchingReExport = indexExportsSubpathCached(
                    indexFilePath,
                    importSubpath,
                );

                if (!hasMatchingReExport) {
                    return;
                }

                context.report({
                    data: {
                        importPath: importSpecifier,
                        suggestedImport: packageRootSpecifier,
                    },
                    messageId: 'deepImport',
                    node: node.source,
                });
            },
        };
    },
    defaultOptions: [],
    meta: {
        docs: {
            description:
                'Disallow deep imports only when package root index.ts (or index.d.ts) re-exports that subpath, and the package is marked by ng-package.json or package.json',
        },
        messages: {
            deepImport:
                'Import "{{importPath}}" should go through the package root export (use "{{suggestedImport}}").',
        },
        schema: [],
        type: 'problem',
    },

    name: 'no-deep-imports-to-indexed-packages',
});

function isExternalModuleSpecifier(moduleSpecifier: string): boolean {
    if (!moduleSpecifier || moduleSpecifier.startsWith('.')) {
        return false;
    }

    return !path.isAbsolute(moduleSpecifier);
}

function isScopedPackage(importSpecifier: string): boolean {
    return importSpecifier.startsWith('@');
}

function getPackageRootSpecifier(importSpecifier: string): string {
    const pathParts = importSpecifier.split('/');

    if (isScopedPackage(importSpecifier)) {
        if (pathParts.length >= 2) {
            return `${pathParts[0]}/${pathParts[1]}`;
        }

        return importSpecifier;
    }

    return pathParts[0] ?? importSpecifier;
}

function getSubpath(
    importSpecifier: string,
    packageRootSpecifier: string,
): string | null {
    if (importSpecifier === packageRootSpecifier) {
        return null;
    }

    if (!importSpecifier.startsWith(`${packageRootSpecifier}/`)) {
        return null;
    }

    return importSpecifier.slice(packageRootSpecifier.length + 1);
}

function normalizeModuleSpecifier(moduleSpecifier: string): string {
    return moduleSpecifier.replaceAll('\\', '/');
}

function stripKnownExtensions(filePathOrSpecifier: string): string {
    return filePathOrSpecifier.replace(/\.(d\.ts|ts|tsx|js|jsx|mjs|cjs)$/, '');
}
