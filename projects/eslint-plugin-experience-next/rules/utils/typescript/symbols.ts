import {type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

import {type NodeMap} from './node-map';

export function getSymbolAtNode(
    node: TSESTree.Node,
    checker: ts.TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
): ts.Symbol | null {
    const tsNode = esTreeNodeToTSNodeMap.get(node);

    return tsNode ? (checker.getSymbolAtLocation(tsNode) ?? null) : null;
}
