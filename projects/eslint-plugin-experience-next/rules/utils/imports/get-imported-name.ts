import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

export function getImportedName(spec: TSESTree.ImportSpecifier): string {
    return spec.imported.type === AST_NODE_TYPES.Identifier
        ? spec.imported.name
        : spec.imported.value;
}
