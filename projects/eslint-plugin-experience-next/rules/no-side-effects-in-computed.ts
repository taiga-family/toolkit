import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';
import type ts from 'typescript';

import {
    getReactiveScopes,
    isAngularUntrackedCall,
    isNodeInsideSynchronousReactiveScope,
    isWritableSignalWrite,
    type NodeMap,
    walkSynchronousAst,
} from './utils/angular-signals';
import {unwrapExpression} from './utils/ast-expressions';

const createRule = ESLintUtils.RuleCreator((name) => name);

type MessageId = 'sideEffectInComputed';

type MutationTarget = TSESTree.Identifier | TSESTree.MemberExpression;

type ReactiveCallback = TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression;

interface InspectionContext {
    readonly callback: ReactiveCallback;
    readonly checker: ts.TypeChecker;
    readonly esTreeNodeToTSNodeMap: NodeMap;
    readonly program: TSESTree.Program;
    readonly reported: Set<string>;
    readonly tsNodeToESTreeNodeMap: Map<ts.Node, TSESTree.Node>;
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
    context: InspectionContext,
): boolean {
    const symbol = getSymbolAtNode(node, context.checker, context.esTreeNodeToTSNodeMap);

    if (!symbol) {
        return false;
    }

    return (symbol.declarations ?? []).some((declaration) => {
        const estreeDeclaration = context.tsNodeToESTreeNodeMap.get(declaration);

        return (
            !!estreeDeclaration &&
            isNodeInsideSynchronousReactiveScope(estreeDeclaration, context.callback)
        );
    });
}

function isLocallyCreatedExpression(
    node: TSESTree.Expression,
    context: InspectionContext,
): boolean {
    const expression = unwrapExpression(node);

    switch (expression.type) {
        case AST_NODE_TYPES.ArrayExpression:
        case AST_NODE_TYPES.NewExpression:
        case AST_NODE_TYPES.ObjectExpression:
            return true;

        case AST_NODE_TYPES.Identifier:
            return isLocalIdentifier(expression, context);

        case AST_NODE_TYPES.MemberExpression:
            return isLocallyCreatedExpression(expression.object, context);

        default:
            return false;
    }
}

function hasObservableMutationTarget(
    node: TSESTree.Node,
    context: InspectionContext,
): boolean {
    return collectMutationTargets(node).some((target) => {
        if (target.type === AST_NODE_TYPES.Identifier) {
            return !isLocalIdentifier(target, context);
        }

        return !isLocallyCreatedExpression(target.object, context);
    });
}

function reportSideEffect(
    node: TSESTree.Node,
    inspectionContext: InspectionContext,
    report: (node: TSESTree.Node) => void,
): void {
    const key = String(node.range);

    if (inspectionContext.reported.has(key)) {
        return;
    }

    inspectionContext.reported.add(key);
    report(node);
}

function inspectComputedBody(
    root: TSESTree.Node,
    inspectionContext: InspectionContext,
    report: (node: TSESTree.Node) => void,
): void {
    walkSynchronousAst(root, (node) => {
        if (node.type === AST_NODE_TYPES.CallExpression) {
            if (
                isWritableSignalWrite(
                    node,
                    inspectionContext.checker,
                    inspectionContext.esTreeNodeToTSNodeMap,
                )
            ) {
                reportSideEffect(node, inspectionContext, report);
            }

            if (isAngularUntrackedCall(node, inspectionContext.program)) {
                const [arg] = node.arguments;

                if (isReactiveCallback(arg)) {
                    inspectComputedBody(arg, inspectionContext, report);
                }

                return false;
            }

            if (
                node.callee.type === AST_NODE_TYPES.ArrowFunctionExpression ||
                node.callee.type === AST_NODE_TYPES.FunctionExpression
            ) {
                inspectComputedBody(node.callee, inspectionContext, report);

                return false;
            }
        }

        if (
            node.type === AST_NODE_TYPES.AssignmentExpression &&
            hasObservableMutationTarget(node.left, inspectionContext)
        ) {
            reportSideEffect(node.left, inspectionContext, report);
        }

        if (
            node.type === AST_NODE_TYPES.UpdateExpression &&
            hasObservableMutationTarget(node.argument, inspectionContext)
        ) {
            reportSideEffect(node.argument, inspectionContext, report);
        }

        if (
            node.type === AST_NODE_TYPES.UnaryExpression &&
            node.operator === 'delete' &&
            hasObservableMutationTarget(node.argument, inspectionContext)
        ) {
            reportSideEffect(node.argument, inspectionContext, report);
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

                    const inspectionContext: InspectionContext = {
                        callback: scope.callback,
                        checker,
                        esTreeNodeToTSNodeMap,
                        program,
                        reported: new Set<string>(),
                        tsNodeToESTreeNodeMap,
                    };

                    inspectComputedBody(
                        scope.callback,
                        inspectionContext,
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
