import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {type TSESTree} from '@typescript-eslint/utils';

import {isArray} from './is-array';

export function getImportsArray(
    meta: TSESTree.ObjectExpression,
): TSESTree.ArrayExpression | null {
    const property = meta.properties.find(
        (literal): literal is TSESTree.Property =>
            literal.type === AST_NODE_TYPES.Property &&
            literal.key.type === AST_NODE_TYPES.Identifier &&
            literal.key.name === 'imports' &&
            isArray(literal.value),
    );

    return property ? (property.value as TSESTree.ArrayExpression) : null;
}
