import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

export function getImportedName(spec: TSESTree.ImportSpecifier): string {
    if (spec.imported.type === AST_NODE_TYPES.Identifier) {
        return spec.imported.name;
    }

    return spec.imported.value;
}
