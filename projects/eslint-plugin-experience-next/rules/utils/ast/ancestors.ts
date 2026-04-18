import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {isFunctionLike} from './ast-walk';

export type ClassLike = TSESTree.ClassDeclaration | TSESTree.ClassExpression;
export type ClassMember = TSESTree.MethodDefinition | TSESTree.PropertyDefinition;

export function findAncestor<T extends TSESTree.Node>(
    node: TSESTree.Node | null | undefined,
    predicate: (ancestor: TSESTree.Node) => ancestor is T,
): T | null {
    for (let current = node?.parent; current; current = current.parent) {
        if (predicate(current)) {
            return current;
        }
    }

    return null;
}

export function findSelfOrAncestor<T extends TSESTree.Node>(
    node: TSESTree.Node | null | undefined,
    predicate: (candidate: TSESTree.Node) => candidate is T,
): T | null {
    for (let current = node; current; current = current.parent) {
        if (predicate(current)) {
            return current;
        }
    }

    return null;
}

export function hasAncestor(
    node: TSESTree.Node | null | undefined,
    predicate: (ancestor: TSESTree.Node) => boolean,
): boolean {
    for (let current = node?.parent; current; current = current.parent) {
        if (predicate(current)) {
            return true;
        }
    }

    return false;
}

export function isNodeInside(node: TSESTree.Node, ancestor: TSESTree.Node): boolean {
    for (
        let current: TSESTree.Node | undefined = node;
        current;
        current = current.parent
    ) {
        if (current === ancestor) {
            return true;
        }
    }

    return false;
}

export function isNodeInsideAny(
    node: TSESTree.Node,
    ancestors: readonly TSESTree.Node[],
): boolean {
    return ancestors.some((ancestor) => isNodeInside(node, ancestor));
}

function isClassLike(node: TSESTree.Node): node is ClassLike {
    return (
        node.type === AST_NODE_TYPES.ClassDeclaration ||
        node.type === AST_NODE_TYPES.ClassExpression
    );
}

function isClassMember(node: TSESTree.Node): node is ClassMember {
    return (
        node.type === AST_NODE_TYPES.MethodDefinition ||
        node.type === AST_NODE_TYPES.PropertyDefinition
    );
}

export function getEnclosingFunction(
    node: TSESTree.Node | null | undefined,
): TSESTree.FunctionLike | null {
    return findAncestor(node, isFunctionLike);
}

export function getEnclosingClass(
    node: TSESTree.Node | null | undefined,
): ClassLike | null {
    return findSelfOrAncestor(node, isClassLike);
}

export function getEnclosingClassMember(
    node: TSESTree.Node | null | undefined,
): ClassMember | null {
    return findAncestor(node, isClassMember);
}

export function getScopeRoot(node: TSESTree.Node): TSESTree.Node {
    return (
        findAncestor(
            node,
            (ancestor): ancestor is TSESTree.FunctionLike | TSESTree.Program =>
                ancestor.type === AST_NODE_TYPES.Program || isFunctionLike(ancestor),
        ) ?? node
    );
}
