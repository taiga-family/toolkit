import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

export type MutationTarget = TSESTree.Identifier | TSESTree.MemberExpression;

export function unwrapMutationTarget(node: TSESTree.Node): TSESTree.Node {
    let current = node;

    while (
        current.type === AST_NODE_TYPES.TSAsExpression ||
        current.type === AST_NODE_TYPES.TSNonNullExpression ||
        current.type === AST_NODE_TYPES.TSTypeAssertion
    ) {
        current = current.expression;
    }

    return current;
}

export function collectMutationTargets(node: TSESTree.Node): MutationTarget[] {
    const current = unwrapMutationTarget(node);

    switch (current.type) {
        case AST_NODE_TYPES.ArrayPattern:
            return current.elements.flatMap((element) =>
                element ? collectMutationTargets(element) : [],
            );

        case AST_NODE_TYPES.AssignmentPattern:
            return collectMutationTargets(current.left);

        case AST_NODE_TYPES.Identifier:
            return [current];

        case AST_NODE_TYPES.MemberExpression:
            return [current];

        case AST_NODE_TYPES.ObjectPattern:
            return current.properties.flatMap((property) =>
                property.type === AST_NODE_TYPES.RestElement
                    ? collectMutationTargets(property.argument)
                    : collectMutationTargets(property.value),
            );

        case AST_NODE_TYPES.RestElement:
            return collectMutationTargets(current.argument);

        default:
            return [];
    }
}
