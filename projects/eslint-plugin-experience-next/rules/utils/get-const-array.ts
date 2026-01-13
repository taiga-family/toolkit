import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {type TSESTree} from '@typescript-eslint/utils';

import {isArray} from './is-array';

export function getConstArray(
    node: TSESTree.Expression | null,
): TSESTree.ArrayExpression | null {
    if (node?.type !== AST_NODE_TYPES.TSAsExpression) {
        return null;
    }

    const annotation = node.typeAnnotation;
    const isConst =
        annotation.type === AST_NODE_TYPES.TSTypeReference &&
        annotation.typeName.type === AST_NODE_TYPES.Identifier &&
        annotation.typeName.name === 'const';

    if (!isConst) {
        return null;
    }

    return isArray(node.expression) ? node.expression : null;
}
