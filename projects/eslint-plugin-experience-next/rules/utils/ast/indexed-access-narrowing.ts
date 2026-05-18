import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';

import {isFunctionExpressionLike, walkAst} from './ast-walk';
import {getContainingIfStatementForTestExpression} from './condition-expressions';
import {isSameIndexedAccess} from './member-expressions';
import {isMutationTarget} from './mutation-targets';

function hasSameIndexedAssignmentTarget(
    sourceCode: Readonly<TSESLint.SourceCode>,
    root: TSESTree.Node,
    target: TSESTree.MemberExpression,
): boolean {
    let found = false;

    walkAst(root, (node) => {
        const shouldStopWalking =
            found || (node !== root && isFunctionExpressionLike(node));

        if (shouldStopWalking) {
            return false;
        }

        const isGuardedAssignmentTarget =
            node.type === AST_NODE_TYPES.MemberExpression &&
            isMutationTarget(node) &&
            isSameIndexedAccess(sourceCode, node, target);

        if (!isGuardedAssignmentTarget) {
            return;
        }

        found = true;

        return false;
    });

    return found;
}

export function isIndexedAccessGuardingSameIndexAssignment(
    sourceCode: Readonly<TSESLint.SourceCode>,
    node: TSESTree.MemberExpression,
): boolean {
    const ifStatement = getContainingIfStatementForTestExpression(node);

    return ifStatement
        ? hasSameIndexedAssignmentTarget(sourceCode, ifStatement.consequent, node)
        : false;
}
