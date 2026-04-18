import {type TSESTree} from '@typescript-eslint/utils';

export function getParenthesizedInner(node: TSESTree.Node): TSESTree.Node | null {
    const maybeNode = node as {
        expression?: TSESTree.Node;
        type?: string;
    };

    if (maybeNode.type === 'ParenthesizedExpression') {
        return maybeNode.expression ?? null;
    }

    return null;
}

export function unwrapParenthesized(node: TSESTree.Node): TSESTree.Node {
    let current = node;
    let inner = getParenthesizedInner(current);

    while (inner) {
        current = inner;
        inner = getParenthesizedInner(current);
    }

    return current;
}
