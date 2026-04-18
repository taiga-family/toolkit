import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

import {
    getReactiveScopes,
    isAngularEffectCall,
    isAngularInjectCall,
    isAngularUntrackedCall,
    isWritableSignalWrite,
    type NodeMap,
    walkSynchronousAst,
} from './utils/angular-signals';
import {unwrapExpression} from './utils/ast-expressions';

const createRule = ESLintUtils.RuleCreator((name) => name);

type MessageId = 'sideEffectInComputed';

type MutationTarget = TSESTree.Identifier | TSESTree.MemberExpression;

type FunctionLikeScope =
    | TSESTree.ArrowFunctionExpression
    | TSESTree.FunctionDeclaration
    | TSESTree.FunctionExpression;

type ReactiveCallback = Exclude<FunctionLikeScope, TSESTree.FunctionDeclaration>;

interface AnalysisContext {
    readonly checker: ts.TypeChecker;
    readonly esTreeNodeToTSNodeMap: NodeMap;
    readonly program: TSESTree.Program;
    readonly reported: Set<string>;
    readonly tsNodeToESTreeNodeMap: Map<ts.Node, TSESTree.Node>;
}

function isFunctionLikeScope(
    node: TSESTree.Node | null | undefined,
): node is FunctionLikeScope {
    return (
        node?.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node?.type === AST_NODE_TYPES.FunctionDeclaration ||
        node?.type === AST_NODE_TYPES.FunctionExpression
    );
}

function isReactiveCallback(
    node: TSESTree.Node | null | undefined,
): node is ReactiveCallback {
    return (
        node?.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        node?.type === AST_NODE_TYPES.FunctionExpression
    );
}

function unwrapMutationTarget(node: TSESTree.Node): TSESTree.Node {
    let current = node;

    while (
        current.type === AST_NODE_TYPES.TSAsExpression ||
        current.type === AST_NODE_TYPES.TSNonNullExpression ||
        current.type === AST_NODE_TYPES.TSTypeAssertion
    ) {
        current = current.expression;
    }

    return current;
}

function collectMutationTargets(node: TSESTree.Node): MutationTarget[] {
    const current = unwrapMutationTarget(node);

    switch (current.type) {
        case AST_NODE_TYPES.ArrayPattern:
            return current.elements.flatMap((element) =>
                element ? collectMutationTargets(element) : [],
            );

        case AST_NODE_TYPES.AssignmentPattern:
            return collectMutationTargets(current.left);

        case AST_NODE_TYPES.Identifier:
            return [current];

        case AST_NODE_TYPES.MemberExpression:
            return [current];

        case AST_NODE_TYPES.ObjectPattern:
            return current.properties.flatMap((property) => {
                if (property.type === AST_NODE_TYPES.RestElement) {
                    return collectMutationTargets(property.argument);
                }

                return collectMutationTargets(property.value);
            });

        case AST_NODE_TYPES.RestElement:
            return collectMutationTargets(current.argument);

        default:
            return [];
    }
}

function getSymbolAtNode(
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

function isLocalIdentifier(
    node: TSESTree.Identifier,
    context: AnalysisContext,
    localScopes: readonly FunctionLikeScope[],
): boolean {
    const symbol = getSymbolAtNode(node, context.checker, context.esTreeNodeToTSNodeMap);

    if (!symbol) {
        return false;
    }

    return (symbol.declarations ?? []).some((declaration) => {
        const estreeDeclaration = context.tsNodeToESTreeNodeMap.get(declaration);

        return (
            !!estreeDeclaration &&
            isDeclaredInsideLocalScope(estreeDeclaration, localScopes)
        );
    });
}

function isDeclaredInsideLocalScope(
    node: TSESTree.Node,
    localScopes: readonly FunctionLikeScope[],
): boolean {
    return localScopes.some((scope) => isNodeInsideFunctionScope(node, scope));
}

function isNodeInsideFunctionScope(
    node: TSESTree.Node,
    scope: FunctionLikeScope,
): boolean {
    let found = false;

    walkSynchronousAst(scope, (inner) => {
        if (inner !== node) {
            return;
        }

        found = true;

        return false;
    });

    return found;
}

function isLocallyCreatedExpression(
    node: TSESTree.Expression,
    context: AnalysisContext,
    localScopes: readonly FunctionLikeScope[],
): boolean {
    const expression = unwrapExpression(node);

    switch (expression.type) {
        case AST_NODE_TYPES.ArrayExpression:
        case AST_NODE_TYPES.NewExpression:
        case AST_NODE_TYPES.ObjectExpression:
            return true;

        case AST_NODE_TYPES.Identifier:
            return isLocalIdentifier(expression, context, localScopes);

        case AST_NODE_TYPES.MemberExpression:
            return isLocallyCreatedExpression(expression.object, context, localScopes);

        default:
            return false;
    }
}

function hasObservableMutationTarget(
    node: TSESTree.Node,
    context: AnalysisContext,
    localScopes: readonly FunctionLikeScope[],
): boolean {
    return collectMutationTargets(node).some((target) => {
        if (target.type === AST_NODE_TYPES.Identifier) {
            return !isLocalIdentifier(target, context, localScopes);
        }

        return !isLocallyCreatedExpression(target.object, context, localScopes);
    });
}

function reportSideEffect(
    node: TSESTree.Node,
    context: AnalysisContext,
    report: (node: TSESTree.Node) => void,
): void {
    const key = String(node.range);

    if (context.reported.has(key)) {
        return;
    }

    context.reported.add(key);
    report(node);
}

function isDirectAngularSideEffectCall(
    node: TSESTree.CallExpression,
    context: AnalysisContext,
): boolean {
    return (
        isWritableSignalWrite(node, context.checker, context.esTreeNodeToTSNodeMap) ||
        isAngularEffectCall(node, context.program) ||
        isAngularInjectCall(node, context.program)
    );
}

function isInspectableFunctionContainer(
    node: TSESTree.Node | undefined,
): node is
    | FunctionLikeScope
    | TSESTree.MethodDefinition
    | TSESTree.Property
    | TSESTree.PropertyDefinition
    | TSESTree.VariableDeclarator {
    return (
        !!node &&
        (isFunctionLikeScope(node) ||
            node.type === AST_NODE_TYPES.MethodDefinition ||
            node.type === AST_NODE_TYPES.Property ||
            node.type === AST_NODE_TYPES.PropertyDefinition ||
            node.type === AST_NODE_TYPES.VariableDeclarator)
    );
}

function resolveFunctionLikeFromContainer(
    node: TSESTree.Node,
    context: AnalysisContext,
    seenSymbols = new Set<string>(),
): readonly FunctionLikeScope[] {
    if (isFunctionLikeScope(node)) {
        return [node];
    }

    if (
        (node.type === AST_NODE_TYPES.MethodDefinition &&
            isFunctionLikeScope(node.value)) ||
        (node.type === AST_NODE_TYPES.Property && isFunctionLikeScope(node.value))
    ) {
        return [node.value];
    }

    if (
        node.type === AST_NODE_TYPES.Property &&
        node.value.type === AST_NODE_TYPES.Identifier
    ) {
        return resolveFunctionLikeFromIdentifier(node.value, context, seenSymbols);
    }

    if (
        node.type === AST_NODE_TYPES.PropertyDefinition &&
        node.value &&
        isFunctionLikeScope(node.value)
    ) {
        return [node.value];
    }

    if (
        node.type === AST_NODE_TYPES.PropertyDefinition &&
        node.value?.type === AST_NODE_TYPES.Identifier
    ) {
        return resolveFunctionLikeFromIdentifier(node.value, context, seenSymbols);
    }

    if (node.type === AST_NODE_TYPES.VariableDeclarator) {
        const {init} = node;

        if (init && isFunctionLikeScope(init)) {
            return [init];
        }

        if (init?.type === AST_NODE_TYPES.Identifier) {
            return resolveFunctionLikeFromIdentifier(init, context, seenSymbols);
        }
    }

    return [];
}

function resolveFunctionLikeFromIdentifier(
    node: TSESTree.Identifier,
    context: AnalysisContext,
    seenSymbols = new Set<string>(),
): readonly FunctionLikeScope[] {
    const symbol = getSymbolAtNode(node, context.checker, context.esTreeNodeToTSNodeMap);

    if (!symbol) {
        return [];
    }

    const symbolId = `${symbol.name}:${symbol.declarations?.[0]?.pos ?? -1}`;

    if (seenSymbols.has(symbolId)) {
        return [];
    }

    seenSymbols.add(symbolId);

    return (symbol.declarations ?? []).flatMap((declaration) => {
        const estreeDeclaration = context.tsNodeToESTreeNodeMap.get(declaration);

        if (!estreeDeclaration || !isInspectableFunctionContainer(estreeDeclaration)) {
            return [];
        }

        return resolveFunctionLikeFromContainer(estreeDeclaration, context, seenSymbols);
    });
}

function resolveCalledFunctions(
    node: TSESTree.CallExpression,
    context: AnalysisContext,
): readonly FunctionLikeScope[] {
    const resolved = new Map<string, FunctionLikeScope>();
    const tsNode = context.esTreeNodeToTSNodeMap.get(node) as
        | ts.CallLikeExpression
        | undefined;
    const signature = tsNode ? context.checker.getResolvedSignature(tsNode) : undefined;
    const declarations = new Set<ts.Declaration>();

    if (signature?.declaration) {
        declarations.add(signature.declaration);
    }

    const callee = unwrapExpression(node.callee);

    if (
        callee.type === AST_NODE_TYPES.Identifier ||
        callee.type === AST_NODE_TYPES.MemberExpression
    ) {
        const symbol = getSymbolAtNode(
            callee,
            context.checker,
            context.esTreeNodeToTSNodeMap,
        );

        for (const declaration of symbol?.declarations ?? []) {
            declarations.add(declaration);
        }
    }

    for (const declaration of declarations) {
        const estreeDeclaration = context.tsNodeToESTreeNodeMap.get(declaration);

        if (!estreeDeclaration || !isInspectableFunctionContainer(estreeDeclaration)) {
            continue;
        }

        for (const fn of resolveFunctionLikeFromContainer(estreeDeclaration, context)) {
            resolved.set(String(fn.range), fn);
        }
    }

    return [...resolved.values()];
}

function functionHasObservableSideEffects(
    root: FunctionLikeScope,
    context: AnalysisContext,
    localScopes: readonly FunctionLikeScope[],
    visitedFunctions: Set<string>,
): boolean {
    let hasSideEffect = false;

    walkSynchronousAst(root, (node) => {
        if (node.type === AST_NODE_TYPES.CallExpression) {
            if (isDirectAngularSideEffectCall(node, context)) {
                hasSideEffect = true;

                return false;
            }

            if (isAngularUntrackedCall(node, context.program)) {
                const [arg] = node.arguments;

                if (
                    isReactiveCallback(arg) &&
                    functionHasObservableSideEffects(
                        arg,
                        context,
                        [...localScopes, arg],
                        visitedFunctions,
                    )
                ) {
                    hasSideEffect = true;
                }

                return false;
            }

            if (isReactiveCallback(node.callee)) {
                if (
                    functionHasObservableSideEffects(
                        node.callee,
                        context,
                        [...localScopes, node.callee],
                        visitedFunctions,
                    )
                ) {
                    hasSideEffect = true;
                }

                return false;
            }

            for (const calledFunction of resolveCalledFunctions(node, context)) {
                const key = String(calledFunction.range);

                if (visitedFunctions.has(key)) {
                    continue;
                }

                visitedFunctions.add(key);

                const calledFunctionHasSideEffects = functionHasObservableSideEffects(
                    calledFunction,
                    context,
                    [...localScopes, calledFunction],
                    visitedFunctions,
                );

                visitedFunctions.delete(key);

                if (!calledFunctionHasSideEffects) {
                    continue;
                }

                hasSideEffect = true;

                return false;
            }
        }

        if (
            node.type === AST_NODE_TYPES.AssignmentExpression &&
            hasObservableMutationTarget(node.left, context, localScopes)
        ) {
            hasSideEffect = true;

            return false;
        }

        if (
            node.type === AST_NODE_TYPES.UpdateExpression &&
            hasObservableMutationTarget(node.argument, context, localScopes)
        ) {
            hasSideEffect = true;

            return false;
        }

        if (
            node.type === AST_NODE_TYPES.UnaryExpression &&
            node.operator === 'delete' &&
            hasObservableMutationTarget(node.argument, context, localScopes)
        ) {
            hasSideEffect = true;

            return false;
        }

        return;
    });

    return hasSideEffect;
}

function inspectComputedBody(
    root: FunctionLikeScope,
    context: AnalysisContext,
    localScopes: readonly FunctionLikeScope[],
    visitedFunctions: Set<string>,
    report: (node: TSESTree.Node) => void,
): void {
    walkSynchronousAst(root, (node) => {
        if (node.type === AST_NODE_TYPES.CallExpression) {
            if (isDirectAngularSideEffectCall(node, context)) {
                reportSideEffect(node, context, report);

                return false;
            }

            if (isAngularUntrackedCall(node, context.program)) {
                const [arg] = node.arguments;

                if (isReactiveCallback(arg)) {
                    inspectComputedBody(
                        arg,
                        context,
                        [...localScopes, arg],
                        visitedFunctions,
                        report,
                    );
                }

                return false;
            }

            if (isReactiveCallback(node.callee)) {
                inspectComputedBody(
                    node.callee,
                    context,
                    [...localScopes, node.callee],
                    visitedFunctions,
                    report,
                );

                return false;
            }

            for (const calledFunction of resolveCalledFunctions(node, context)) {
                const key = String(calledFunction.range);

                if (visitedFunctions.has(key)) {
                    continue;
                }

                visitedFunctions.add(key);

                const calledFunctionHasSideEffects = functionHasObservableSideEffects(
                    calledFunction,
                    context,
                    [...localScopes, calledFunction],
                    visitedFunctions,
                );

                visitedFunctions.delete(key);

                if (!calledFunctionHasSideEffects) {
                    continue;
                }

                reportSideEffect(node, context, report);

                return false;
            }
        }

        if (
            node.type === AST_NODE_TYPES.AssignmentExpression &&
            hasObservableMutationTarget(node.left, context, localScopes)
        ) {
            reportSideEffect(node.left, context, report);
        }

        if (
            node.type === AST_NODE_TYPES.UpdateExpression &&
            hasObservableMutationTarget(node.argument, context, localScopes)
        ) {
            reportSideEffect(node.argument, context, report);
        }

        if (
            node.type === AST_NODE_TYPES.UnaryExpression &&
            node.operator === 'delete' &&
            hasObservableMutationTarget(node.argument, context, localScopes)
        ) {
            reportSideEffect(node.argument, context, report);
        }

        return;
    });
}

export const rule = createRule<[], MessageId>({
    create(context) {
        const parserServices = ESLintUtils.getParserServices(context);
        const checker = parserServices.program.getTypeChecker();
        const esTreeNodeToTSNodeMap =
            parserServices.esTreeNodeToTSNodeMap as unknown as NodeMap;
        const tsNodeToESTreeNodeMap =
            parserServices.tsNodeToESTreeNodeMap as unknown as Map<
                ts.Node,
                TSESTree.Node
            >;
        const {sourceCode} = context;
        const program = sourceCode.ast as TSESTree.Program;

        return {
            CallExpression(node: TSESTree.CallExpression) {
                for (const scope of getReactiveScopes(node, program)) {
                    if (scope.kind !== 'computed()') {
                        continue;
                    }

                    const analysisContext: AnalysisContext = {
                        checker,
                        esTreeNodeToTSNodeMap,
                        program,
                        reported: new Set<string>(),
                        tsNodeToESTreeNodeMap,
                    };

                    inspectComputedBody(
                        scope.callback,
                        analysisContext,
                        [scope.callback],
                        new Set<string>([String(scope.callback.range)]),
                        (reportNode) => {
                            context.report({
                                data: {expression: sourceCode.getText(reportNode)},
                                messageId: 'sideEffectInComputed',
                                node: reportNode,
                            });
                        },
                    );
                }
            },
        };
    },
    meta: {
        docs: {
            description:
                'Disallow observable side effects inside `computed()` callbacks so derivations stay pure',
            url: 'https://angular.dev/guide/signals',
        },
        messages: {
            sideEffectInComputed:
                '`{{ expression }}` causes a side effect inside `computed()`. Keep computed derivations pure and move state changes to `effect()` or outside the computation.',
        },
        schema: [],
        type: 'problem',
    },
    name: 'no-side-effects-in-computed',
});

export default rule;
