import {type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

export interface NodeMap {
    get(node: TSESTree.Node): ts.Node | undefined;
}

export type TsNodeToESTreeNodeMap = Map<ts.Node, TSESTree.Node>;
