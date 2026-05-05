import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {isArray} from '../ast/is-array';

export function isImportsArrayProperty(
    property?: TSESTree.ObjectExpression['properties'][number],
): property is TSESTree.Property & {value: TSESTree.ArrayExpression} {
    if (property?.type !== AST_NODE_TYPES.Property) {
        return false;
    }

    const hasIdentifierKey =
        property.key.type === AST_NODE_TYPES.Identifier &&
        property.key.name === 'imports';

    return hasIdentifierKey && isArray(property.value);
}
