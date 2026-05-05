import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

export function getReturnedExpression(
    node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
): TSESTree.Expression | null {
    if (node.body.type !== AST_NODE_TYPES.BlockStatement) {
        return node.body;
    }

    if (node.body.body.length !== 1) {
        return null;
    }

    const statement = node.body.body[0];

    return statement?.type !== AST_NODE_TYPES.ReturnStatement || !statement.argument
        ? null
        : statement.argument;
}
