import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {type TSESTree} from '@typescript-eslint/utils';

export function isObject(node?: TSESTree.Node): node is TSESTree.ObjectExpression {
    return node?.type === AST_NODE_TYPES.ObjectExpression;
}
