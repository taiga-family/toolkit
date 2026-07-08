import {type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

export interface NodeMap {
    get(node: TSESTree.Node): ts.Node;
}

export interface TsNodeToESTreeNodeMap {
    get(node: ts.Node): TSESTree.Node | undefined;
}
