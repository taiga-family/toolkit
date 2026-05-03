import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';
import ts from 'typescript';

import {walkAfterAsyncBoundaryAst, walkSynchronousAst} from '../ast/ast-walk';
import {type NodeMap} from '../typescript/node-map';
import {getLocalNameForImport} from './angular-imports';

export {walkAfterAsyncBoundaryAst, walkAst, walkSynchronousAst} from '../ast/ast-walk';
export type {NodeMap} from '../typescript/node-map';
export {
    findAngularCoreImport,
    findAngularCoreImports,
    findAngularCoreImportSpecifier,
    findRuntimeAngularCoreImport,
    getLocalNameForImport,
} from './angular-imports';

const ANGULAR_CORE = '@angular/core';
const SIGNAL_WRITE_METHODS = new Set(['mutate', 'set', 'update']);

const AFTER_RENDER_EFFECT_PHASES = new Map([
    ['earlyRead', 'afterRenderEffect().earlyRead'],
    ['mixedReadWrite', 'afterRenderEffect().mixedReadWrite'],
    ['read', 'afterRenderEffect().read'],
    ['write', 'afterRenderEffect().write'],
]);

export type ReactiveCallback =
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionExpression;

export interface ReactiveScope {
    readonly callback: ReactiveCallback;
    readonly kind: string;
    readonly owner: TSESTree.CallExpression;
    readonly reportNode: TSESTree.Node;
}

export interface SignalUsage {
    readonly reads: TSESTree.CallExpression[];
    readonly writes: TSESTree.CallExpression[];
}

export function isReactiveCallback(
    node: TSESTree.Node | null | undefined,
): node is ReactiveCallback {
    return (
        node?.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node?.type === AST_NODE_TYPES.FunctionExpression
    );
}

export function getReactiveCallbackArgument(
    node: TSESTree.CallExpression,
): ReactiveCallback | null {
    const [arg] = node.arguments;

    return isReactiveCallback(arg) ? arg : null;
}

function getPropertyName(property: TSESTree.Property): string | null {
    if (property.computed) {
        return null;
    }

    if (property.key.type === AST_NODE_TYPES.Identifier) {
        return property.key.name;
    }

    return typeof property.key.value === 'string' ? property.key.value : null;
}

function isAngularCoreCall(
    node: TSESTree.CallExpression,
    program: TSESTree.Program,
    exportedName: string,
): boolean {
    const localName = getLocalNameForImport(program, ANGULAR_CORE, exportedName);

    if (!localName) {
        return false;
    }

    return (
        node.callee.type === AST_NODE_TYPES.Identifier &&
        node.callee.name === localName &&
        node.arguments.length >= 1
    );
}

function appendFirstArgReactiveScope(
    scopes: ReactiveScope[],
    call: TSESTree.CallExpression,
    kind: string,
): void {
    const callback = getReactiveCallbackArgument(call);

    if (!callback) {
        return;
    }

    scopes.push({callback, kind, owner: call, reportNode: call});
}

function appendObjectPropertyReactiveScopes(
    scopes: ReactiveScope[],
    call: TSESTree.CallExpression,
    object: TSESTree.ObjectExpression,
    labels: ReadonlyMap<string, string>,
): void {
    for (const property of object.properties) {
        if (property.type !== AST_NODE_TYPES.Property) {
            continue;
        }

        const name = getPropertyName(property);
        const label = name ? labels.get(name) : null;

        if (!label || !isReactiveCallback(property.value)) {
            continue;
        }

        scopes.push({
            callback: property.value,
            kind: label,
            owner: call,
            reportNode: property,
        });
    }
}

export function isAngularEffectCall(
    node: TSESTree.CallExpression,
    program: TSESTree.Program,
): boolean {
    return isAngularCoreCall(node, program, 'effect');
}

export function isAngularInjectCall(
    node: TSESTree.CallExpression,
    program: TSESTree.Program,
): boolean {
    return isAngularCoreCall(node, program, 'inject');
}

export function isAngularUntrackedCall(
    node: TSESTree.CallExpression,
    program: TSESTree.Program,
): boolean {
    return isAngularCoreCall(node, program, 'untracked');
}

export function getReactiveScopes(
    node: TSESTree.CallExpression,
    program: TSESTree.Program,
): ReactiveScope[] {
    const scopes: ReactiveScope[] = [];
    const [arg] = node.arguments;

    if (isAngularEffectCall(node, program)) {
        appendFirstArgReactiveScope(scopes, node, 'effect()');
    }

    if (isAngularCoreCall(node, program, 'computed')) {
        appendFirstArgReactiveScope(scopes, node, 'computed()');
    }

    if (isAngularCoreCall(node, program, 'linkedSignal')) {
        appendFirstArgReactiveScope(scopes, node, 'linkedSignal()');

        if (arg?.type === AST_NODE_TYPES.ObjectExpression) {
            appendObjectPropertyReactiveScopes(
                scopes,
                node,
                arg,
                new Map([
                    ['computation', 'linkedSignal().computation'],
                    ['source', 'linkedSignal().source'],
                ]),
            );
        }
    }

    if (isAngularCoreCall(node, program, 'resource')) {
        if (arg?.type === AST_NODE_TYPES.ObjectExpression) {
            appendObjectPropertyReactiveScopes(
                scopes,
                node,
                arg,
                new Map([
                    ['loader', 'resource().loader'],
                    ['params', 'resource().params'],
                ]),
            );
        }
    }

    if (isAngularCoreCall(node, program, 'afterRenderEffect')) {
        appendFirstArgReactiveScope(scopes, node, 'afterRenderEffect()');

        if (arg?.type === AST_NODE_TYPES.ObjectExpression) {
            appendObjectPropertyReactiveScopes(
                scopes,
                node,
                arg,
                AFTER_RENDER_EFFECT_PHASES,
            );
        }
    }

    return scopes;
}

export function isNodeInsideSynchronousReactiveScope(
    node: TSESTree.Node,
    callback: ReactiveCallback,
): boolean {
    let found = false;

    walkSynchronousAst(callback, (inner) => {
        if (inner !== node) {
            return;
        }

        found = true;

        return false;
    });

    return found;
}

export function isNodeAfterAsyncBoundaryInReactiveScope(
    node: TSESTree.Node,
    callback: ReactiveCallback,
): boolean {
    let found = false;

    walkAfterAsyncBoundaryAst(callback, (inner) => {
        if (inner !== node) {
            return;
        }

        found = true;
    });

    return found;
}

export function findEnclosingReactiveScope(
    node: TSESTree.Node,
    program: TSESTree.Program,
): ReactiveScope | null {
    for (let current = node.parent; current; current = current.parent) {
        if (current.type !== AST_NODE_TYPES.CallExpression) {
            continue;
        }

        for (const scope of getReactiveScopes(current, program)) {
            if (isNodeInsideSynchronousReactiveScope(node, scope.callback)) {
                return scope;
            }
        }
    }

    return null;
}

export function findEnclosingReactiveScopeAfterAsyncBoundary(
    node: TSESTree.Node,
    program: TSESTree.Program,
): ReactiveScope | null {
    for (let current = node.parent; current; current = current.parent) {
        if (current.type !== AST_NODE_TYPES.CallExpression) {
            continue;
        }

        for (const scope of getReactiveScopes(current, program)) {
            if (isNodeAfterAsyncBoundaryInReactiveScope(node, scope.callback)) {
                return scope;
            }
        }
    }

    return null;
}

/**
 * Returns true when the TypeScript type at `node` is an Angular signal type.
 * Uses duck-typing: callable type whose name contains "Signal", or whose
 * string-keyed properties include the Angular `ɵ` brand.
 *
 * Falls back to `false` on any error.
 */
export function isSignalType(
    node: TSESTree.Node,
    checker: ts.TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
): boolean {
    try {
        const tsNode = esTreeNodeToTSNodeMap.get(node);

        if (!tsNode) {
            return false;
        }

        const type = checker.getTypeAtLocation(tsNode);

        if (type.getCallSignatures().length === 0) {
            return false;
        }

        if (checker.typeToString(type).includes('Signal')) {
            return true;
        }

        const typeSymbol = type.getSymbol();
        const aliasSymbol = (type as {aliasSymbol?: ts.Symbol}).aliasSymbol;

        if (
            typeSymbol?.getName().includes('Signal') ||
            aliasSymbol?.getName().includes('Signal')
        ) {
            return true;
        }

        return type
            .getProperties()
            .some((p) => p.name.startsWith('ɵ') || p.name === '__SIGNAL');
    } catch {
        return false;
    }
}

export function isSignalReadCall(
    node: TSESTree.CallExpression,
    checker: ts.TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
): boolean {
    const {callee} = node;

    if (
        callee.type !== AST_NODE_TYPES.Identifier &&
        callee.type !== AST_NODE_TYPES.MemberExpression
    ) {
        return false;
    }

    return isSignalType(callee, checker, esTreeNodeToTSNodeMap);
}

export function isWritableSignalWrite(
    node: TSESTree.CallExpression,
    checker: ts.TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
): boolean {
    if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
        return false;
    }

    const {object, property} = node.callee;

    if (
        property.type !== AST_NODE_TYPES.Identifier ||
        !SIGNAL_WRITE_METHODS.has(property.name)
    ) {
        return false;
    }

    return isSignalType(object, checker, esTreeNodeToTSNodeMap);
}

/**
 * Returns true when `node` is a member expression `foo.bar` where `bar` is a
 * TypeScript getter. Getter accesses are opaque — the getter body can read
 * signals, so wrapping them in `untracked()` is justified.
 */
export function isGetterMemberAccess(
    node: TSESTree.MemberExpression,
    checker: ts.TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
): boolean {
    try {
        const tsNode = esTreeNodeToTSNodeMap.get(node);

        if (!tsNode) {
            return false;
        }

        const symbol = checker.getSymbolAtLocation(tsNode);

        if (!symbol) {
            return false;
        }

        return !!(symbol.flags & ts.SymbolFlags.GetAccessor);
    } catch {
        return false;
    }
}

/**
 * Walks `scopeNode` and collects all signal reads and writes within it,
 * NOT recursing into nested `untracked(...)` calls (their contents are
 * already hidden from tracking).
 */
export function collectSignalUsages(
    scopeNode: TSESTree.Node,
    checker: ts.TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
    program: TSESTree.Program,
): SignalUsage {
    const reads: TSESTree.CallExpression[] = [];
    const writes: TSESTree.CallExpression[] = [];

    walkSynchronousAst(scopeNode, (node) => {
        if (node.type !== AST_NODE_TYPES.CallExpression) {
            return;
        }

        // Skip contents of nested untracked — they are already isolated
        if (isAngularUntrackedCall(node, program)) {
            return false;
        }

        if (isWritableSignalWrite(node, checker, esTreeNodeToTSNodeMap)) {
            writes.push(node);

            for (const arg of node.arguments) {
                walkSynchronousAst(arg, (inner) => {
                    if (
                        inner.type === AST_NODE_TYPES.CallExpression &&
                        isSignalReadCall(inner, checker, esTreeNodeToTSNodeMap)
                    ) {
                        reads.push(inner);
                    }
                });
            }

            return false;
        }

        if (isSignalReadCall(node, checker, esTreeNodeToTSNodeMap)) {
            reads.push(node);
        }

        return;
    });

    return {reads, writes};
}

export function collectSignalReadsInsideUntracked(
    root: TSESTree.Node,
    checker: ts.TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
    program: TSESTree.Program,
): TSESTree.CallExpression[] {
    const reads: TSESTree.CallExpression[] = [];

    walkSynchronousAst(root, (node) => {
        if (
            node.type !== AST_NODE_TYPES.CallExpression ||
            !isAngularUntrackedCall(node, program)
        ) {
            return;
        }

        const callback = getReactiveCallbackArgument(node);

        if (!callback) {
            return false;
        }

        walkSynchronousAst(callback, (inner) => {
            if (
                inner.type === AST_NODE_TYPES.CallExpression &&
                isSignalReadCall(inner, checker, esTreeNodeToTSNodeMap)
            ) {
                reads.push(inner);
            }
        });

        return false;
    });

    return reads;
}

export function isReactiveOwnerCall(
    node: TSESTree.Node,
    program: TSESTree.Program,
): node is TSESTree.CallExpression {
    return (
        node.type === AST_NODE_TYPES.CallExpression &&
        getReactiveScopes(node, program).length > 0
    );
}

export function getReturnedReactiveOwnerCall(
    node: TSESTree.CallExpression,
    program: TSESTree.Program,
): TSESTree.CallExpression | null {
    const callback = getReactiveCallbackArgument(node);

    if (!callback) {
        return null;
    }

    if (isReactiveOwnerCall(callback.body, program)) {
        return callback.body;
    }

    if (
        callback.body.type !== AST_NODE_TYPES.BlockStatement ||
        callback.body.body.length !== 1
    ) {
        return null;
    }

    const [statement] = callback.body.body;

    if (
        statement?.type === AST_NODE_TYPES.ReturnStatement &&
        statement.argument &&
        isReactiveOwnerCall(statement.argument, program)
    ) {
        return statement.argument;
    }

    if (
        node.parent.type === AST_NODE_TYPES.ExpressionStatement &&
        statement?.type === AST_NODE_TYPES.ExpressionStatement &&
        isReactiveOwnerCall(statement.expression, program)
    ) {
        return statement.expression;
    }

    return null;
}
