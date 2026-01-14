import fs from 'node:fs';
import path from 'node:path';

import {ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import ts from 'typescript';

const createRule = ESLintUtils.RuleCreator((name) => name);

export default createRule({
    create(context) {
        const parserServices = ESLintUtils.getParserServices(context);
        const program = parserServices.program;
        const compilerHost = ts.createCompilerHost(program.getCompilerOptions(), true);

        function resolveTypescriptModule(moduleSpecifier: string): string | null {
            const resolved = ts.resolveModuleName(
                moduleSpecifier,
                context.filename,
                program.getCompilerOptions(),
                compilerHost,
            );

            return resolved.resolvedModule?.resolvedFileName ?? null;
        }

        return {
            ImportDeclaration(node: TSESTree.ImportDeclaration) {
                const importSpecifier = node.source.value as string | null;

                if (typeof importSpecifier !== 'string') {
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
                    resolveTypescriptModule(packageRootSpecifier);

                if (!resolvedRootModuleFilePath) {
                    return;
                }

                const packageMarkerFilePath = pickPackageMarkerFile(
                    resolvedRootModuleFilePath,
                );

                if (!packageMarkerFilePath) {
                    return;
                }

                const packageDirectory = path.dirname(packageMarkerFilePath);
                const indexFilePath = pickIndexFileInDirectory(packageDirectory);

                if (!indexFilePath) {
                    return;
                }

                const hasMatchingReExport = indexExportsSubpath(
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

function pickPackageMarkerFile(resolvedRootFilePath: string): string | null {
    const resolvedRootDirectory = path.dirname(resolvedRootFilePath);
    const nearestNgPackageJson = findNearestFileUpwards(
        resolvedRootDirectory,
        'ng-package.json',
    );

    const nearestPackageJson = findNearestFileUpwards(
        resolvedRootDirectory,
        'package.json',
    );

    return nearestNgPackageJson ?? nearestPackageJson ?? null;
}

function pickIndexFileInDirectory(packageDirectory: string): string | null {
    const indexTypescriptPath = path.join(packageDirectory, 'index.ts');
    const indexTypesDeclarationPath = path.join(packageDirectory, 'index.d.ts');

    if (fs.existsSync(indexTypescriptPath)) {
        return indexTypescriptPath;
    }

    if (fs.existsSync(indexTypesDeclarationPath)) {
        return indexTypesDeclarationPath;
    }

    return null;
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

function findNearestFileUpwards(startDirectory: string, fileName: string): string | null {
    let currentDirectory = startDirectory;

    while (currentDirectory.length > 0) {
        const candidatePath = path.join(currentDirectory, fileName);

        if (fs.existsSync(candidatePath)) {
            return candidatePath;
        }

        const parentDirectory = path.dirname(currentDirectory);

        if (parentDirectory === currentDirectory) {
            break;
        }

        currentDirectory = parentDirectory;
    }

    return null;
}

function normalizeModuleSpecifier(moduleSpecifier: string): string {
    return moduleSpecifier.replaceAll('\\', '/');
}

function stripKnownExtensions(filePathOrSpecifier: string): string {
    return filePathOrSpecifier.replace(/\.(d\.ts|ts|tsx|js|jsx|mjs|cjs)$/, '');
}

function indexExportsSubpath(indexFilePath: string, subpath: string): boolean {
    const fileText = fs.readFileSync(indexFilePath, 'utf8');
    const sourceFile = ts.createSourceFile(
        indexFilePath,
        fileText,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );

    const expectedSpecifier = normalizeModuleSpecifier(
        stripKnownExtensions(`./${subpath}`),
    );
    const expectedIndexSpecifier = normalizeModuleSpecifier(
        stripKnownExtensions(`./${subpath}/index`),
    );

    let isReExportFound = false;

    sourceFile.forEachChild((astNode) => {
        if (isReExportFound) {
            return;
        }

        if (ts.isExportDeclaration(astNode)) {
            const moduleSpecifierNode = astNode.moduleSpecifier;

            if (moduleSpecifierNode && ts.isStringLiteral(moduleSpecifierNode)) {
                const exportedSpecifier = normalizeModuleSpecifier(
                    stripKnownExtensions(moduleSpecifierNode.text),
                );

                if (
                    exportedSpecifier === expectedSpecifier ||
                    exportedSpecifier === expectedIndexSpecifier
                ) {
                    isReExportFound = true;
                }
            }
        }
    });

    return isReExportFound;
}
