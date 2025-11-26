import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {type TSESTree} from '@typescript-eslint/utils';

export function getConstArray(
    node: TSESTree.Expression | null,
): TSESTree.ArrayExpression | null {
    if (!node || node.type !== AST_NODE_TYPES.TSAsExpression) {
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

    if (node.expression.type === AST_NODE_TYPES.ArrayExpression) {
        return node.expression;
    }

    return null;
}
