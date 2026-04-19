import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {walkAst} from './ast-walk';

export function collectCallExpressions(root: TSESTree.Node): TSESTree.CallExpression[] {
    const result: TSESTree.CallExpression[] = [];

    walkAst(root, (node) => {
        if (node.type === AST_NODE_TYPES.CallExpression) {
            result.push(node);
        }
    });

    return result;
}
