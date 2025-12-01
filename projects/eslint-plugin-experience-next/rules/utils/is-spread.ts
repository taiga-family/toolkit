import {AST_NODE_TYPES} from '@typescript-eslint/types';
import {type TSESTree} from '@typescript-eslint/utils';

export function isSpread(node: TSESTree.Node): node is TSESTree.SpreadElement {
    return node.type === AST_NODE_TYPES.SpreadElement;
}
