import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

import {getScopeRoot} from '../ast/ancestors';
import {walkAst} from '../ast/ast-walk';
import {type NodeMap} from './node-map';
import {getSymbolAtNode} from './symbols';

export function isDirectCallOrNewArgument(node: TSESTree.FunctionLike): boolean {
    const parent = node.parent;

    return node.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
        node.type !== AST_NODE_TYPES.FunctionExpression
        ? false
        : (parent.type === AST_NODE_TYPES.CallExpression ||
              parent.type === AST_NODE_TYPES.NewExpression) &&
              parent.arguments.includes(node);
}

export function isStoredFunctionUsedAsCallOrNewArgument(
    fn: TSESTree.FunctionLike,
    checker: ts.TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
): boolean {
    const parent = fn.parent;

    if (
        parent.type !== AST_NODE_TYPES.VariableDeclarator ||
        parent.id.type !== AST_NODE_TYPES.Identifier
    ) {
        return false;
    }

    const id = parent.id;
    const symbol = getSymbolAtNode(id, checker, esTreeNodeToTSNodeMap);

    if (!symbol) {
        return false;
    }

    let found = false;
    const scopeRoot = getScopeRoot(parent);

    walkAst(scopeRoot, (node) => {
        if (
            node.type !== AST_NODE_TYPES.Identifier ||
            node === id ||
            node.name !== id.name
        ) {
            return;
        }

        const referenceSymbol = getSymbolAtNode(node, checker, esTreeNodeToTSNodeMap);

        if (referenceSymbol !== symbol) {
            return;
        }

        const usageParent = node.parent;

        if (
            (usageParent.type === AST_NODE_TYPES.CallExpression ||
                usageParent.type === AST_NODE_TYPES.NewExpression) &&
            usageParent.arguments.includes(node)
        ) {
            found = true;

            return false;
        }

        return;
    });

    return found;
}
