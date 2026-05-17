import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {getParentNode} from './ancestors';

const EQUALITY_OPERATORS = new Set(['!=', '!==', '==', '===']);

export function getChainExpressionRoot(node: TSESTree.Node): TSESTree.Node {
    const parent = getParentNode(node);

    return parent?.type === AST_NODE_TYPES.ChainExpression ? parent : node;
}

export function isLogicalFallbackLeftOperand(node: TSESTree.Node): boolean {
    const expression = getChainExpressionRoot(node);
    const parent = getParentNode(expression);

    return (
        parent?.type === AST_NODE_TYPES.LogicalExpression &&
        (parent.operator === '??' || parent.operator === '||') &&
        parent.left === expression
    );
}

export function getContainingIfStatementForTestExpression(
    node: TSESTree.Node,
): TSESTree.IfStatement | null {
    let current = getChainExpressionRoot(node);
    let parent = getParentNode(current);

    while (parent?.type === AST_NODE_TYPES.LogicalExpression) {
        current = parent;
        parent = getParentNode(parent);
    }

    if (parent?.type === AST_NODE_TYPES.UnaryExpression && parent.operator === '!') {
        current = parent;
        parent = getParentNode(parent);
    }

    return parent?.type === AST_NODE_TYPES.IfStatement && parent.test === current
        ? parent
        : null;
}

export function isConditionTestExpression(node: TSESTree.Node): boolean {
    let current = getChainExpressionRoot(node);
    let parent = getParentNode(current);

    if (!parent) {
        return false;
    }

    while (parent?.type === AST_NODE_TYPES.LogicalExpression) {
        current = parent;
        parent = getParentNode(parent);
    }

    if (!parent) {
        return false;
    }

    if (parent.type === AST_NODE_TYPES.UnaryExpression && parent.operator === '!') {
        current = parent;
        parent = getParentNode(parent);
    }

    return parent
        ? (parent.type === AST_NODE_TYPES.IfStatement && parent.test === current) ||
              (parent.type === AST_NODE_TYPES.ConditionalExpression &&
                  parent.test === current) ||
              (parent.type === AST_NODE_TYPES.WhileStatement &&
                  parent.test === current) ||
              (parent.type === AST_NODE_TYPES.DoWhileStatement &&
                  parent.test === current) ||
              (parent.type === AST_NODE_TYPES.ForStatement && parent.test === current)
        : false;
}

export function isEqualityComparisonOperand(node: TSESTree.Node): boolean {
    const expression = getChainExpressionRoot(node);
    const parent = getParentNode(expression);

    return (
        parent?.type === AST_NODE_TYPES.BinaryExpression &&
        EQUALITY_OPERATORS.has(parent.operator)
    );
}
