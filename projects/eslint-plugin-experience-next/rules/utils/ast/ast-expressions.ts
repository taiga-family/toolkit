import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

/**
 * Strips TypeScript-only wrapper nodes that have no runtime meaning:
 * `as` casts, non-null assertions (`!`), type assertions (`<T>expr`), and
 * optional-chain wrappers. Iterates until no more wrappers are found.
 */
export function unwrapExpression(expression: TSESTree.Expression): TSESTree.Expression {
    let current = expression;
    let didUnwrap = true;

    while (didUnwrap) {
        didUnwrap = false;

        switch (current.type) {
            case AST_NODE_TYPES.ChainExpression:
                current = current.expression;
                didUnwrap = true;
                break;

            case AST_NODE_TYPES.TSAsExpression:
                current = current.expression;
                didUnwrap = true;
                break;

            case AST_NODE_TYPES.TSNonNullExpression:
                current = current.expression;
                didUnwrap = true;
                break;

            case AST_NODE_TYPES.TSTypeAssertion:
                current = current.expression;
                didUnwrap = true;
                break;

            default:
                break;
        }
    }

    return current;
}
