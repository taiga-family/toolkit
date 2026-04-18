import {type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

import {type NodeMap} from './node-map';

export function getSymbolAtNode(
    node: TSESTree.Node,
    checker: ts.TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
): ts.Symbol | null {
    const tsNode = esTreeNodeToTSNodeMap.get(node);

    if (!tsNode) {
        return null;
    }

    return checker.getSymbolAtLocation(tsNode) ?? null;
}
