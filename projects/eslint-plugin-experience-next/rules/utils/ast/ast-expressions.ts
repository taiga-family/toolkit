import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {getParentNode} from './ancestors';
import {getParenthesizedInner} from './parenthesized';

/**
 * Strips expression wrapper nodes that do not affect the underlying expression:
 * parentheses, `as` casts, `satisfies`, non-null assertions (`!`), type
 * assertions (`<T>expr`), and optional-chain wrappers. Iterates until no more
 * wrappers are found.
 */
export function unwrapExpression(expression: TSESTree.Expression): TSESTree.Expression {
    let current = expression;
    let didUnwrap = true;

    while (didUnwrap) {
        didUnwrap = false;

        const parenthesized = getParenthesizedExpression(current);

        if (parenthesized) {
            current = parenthesized;
            didUnwrap = true;
            continue;
        }

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

            case AST_NODE_TYPES.TSSatisfiesExpression:
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

export function hasNonNullAssertionParent(node: TSESTree.Node): boolean {
    let current = node;
    let parent = getParentNode(current);

    while (parent) {
        if (
            parent.type === AST_NODE_TYPES.TSNonNullExpression &&
            parent.expression === current
        ) {
            return true;
        }

        if (getParenthesizedInner(parent) !== current) {
            return false;
        }

        current = parent;
        parent = getParentNode(current);
    }

    return false;
}

function isExpressionLike(value: unknown): value is TSESTree.Expression {
    return (
        typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        typeof value.type === 'string'
    );
}

function getParenthesizedExpression(
    expression: TSESTree.Expression,
): TSESTree.Expression | null {
    const maybeExpression: {readonly expression?: unknown; readonly type?: string} =
        expression;

    return maybeExpression.type === 'ParenthesizedExpression' &&
        isExpressionLike(maybeExpression.expression)
        ? maybeExpression.expression
        : null;
}
