import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

const ANGULAR_CORE = '@angular/core';

/**
 * Returns the local name bound to a named import from a given source.
 * Handles aliased imports: `import { untracked as ngUntracked } from '@angular/core'`
 * returns `'ngUntracked'` for `exportedName = 'untracked'`.
 */
export function getLocalNameForImport(
    program: TSESTree.Program,
    source: string,
    exportedName: string,
): string | null {
    for (const node of program.body) {
        if (
            node.type !== AST_NODE_TYPES.ImportDeclaration ||
            node.source.value !== source
        ) {
            continue;
        }

        for (const spec of node.specifiers) {
            if (spec.type !== AST_NODE_TYPES.ImportSpecifier) {
                continue;
            }

            const imported =
                spec.imported.type === AST_NODE_TYPES.Identifier
                    ? spec.imported.name
                    : spec.imported.value;

            if (imported === exportedName) {
                return spec.local.name;
            }
        }
    }

    return null;
}

export function findAngularCoreImports(
    program: TSESTree.Program,
): TSESTree.ImportDeclaration[] {
    return program.body.filter(
        (node): node is TSESTree.ImportDeclaration =>
            node.type === AST_NODE_TYPES.ImportDeclaration &&
            node.source.value === ANGULAR_CORE,
    );
}

export function findAngularCoreImport(
    program: TSESTree.Program,
): TSESTree.ImportDeclaration | null {
    return findAngularCoreImports(program)[0] ?? null;
}

export function findRuntimeAngularCoreImport(
    program: TSESTree.Program,
): TSESTree.ImportDeclaration | null {
    return (
        findAngularCoreImports(program).find((node) => node.importKind !== 'type') ?? null
    );
}

export function findAngularCoreImportSpecifier(
    program: TSESTree.Program,
    exportedName: string,
): {
    readonly importDecl: TSESTree.ImportDeclaration;
    readonly specifier: TSESTree.ImportSpecifier;
} | null {
    for (const importDecl of findAngularCoreImports(program)) {
        for (const specifier of importDecl.specifiers) {
            if (specifier.type !== AST_NODE_TYPES.ImportSpecifier) {
                continue;
            }

            const imported =
                specifier.imported.type === AST_NODE_TYPES.Identifier
                    ? specifier.imported.name
                    : specifier.imported.value;

            if (imported === exportedName) {
                return {importDecl, specifier};
            }
        }
    }

    return null;
}
