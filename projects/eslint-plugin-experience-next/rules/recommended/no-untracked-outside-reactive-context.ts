import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';
import {type SourceCode} from '@typescript-eslint/utils/ts-eslint';
import type ts from 'typescript';

import {
    findEnclosingReactiveScope,
    findEnclosingReactiveScopeAfterAsyncBoundary,
    getReactiveCallbackArgument,
    getReturnedReactiveOwnerCall,
    isAngularUntrackedCall,
    walkAst,
} from '../utils/angular/angular-signals';
import {
    buildImportRemovalFixes,
    findUntrackedAlias,
} from '../utils/angular/import-fix-helpers';
import {isPipeTransformMember} from '../utils/angular/pipes';
import {
    isAngularInjectionTokenFactoryFunction,
    isAngularUseFactoryFunction,
} from '../utils/angular/providers';
import {
    ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL,
    createUntrackedRule,
} from '../utils/angular/untracked-docs';
import {getEnclosingClassMember, getEnclosingFunction} from '../utils/ast/ancestors';
import {
    getClassMemberName,
    getMemberExpressionPropertyName,
} from '../utils/ast/property-names';
import {dedent} from '../utils/text/dedent';
import {
    isDirectCallOrNewArgument,
    isStoredFunctionUsedAsCallOrNewArgument,
} from '../utils/typescript/function-usage';
import {type NodeMap} from '../utils/typescript/node-map';
import {getTypeAwareRuleContext} from '../utils/typescript/type-aware-context';

type MessageId = 'outsideReactiveContext';

const IMPERATIVE_UNTRACKED_METHODS = new Set(['registerOnChange', 'writeValue']);

function hasAllowedImperativeAssignment(node: TSESTree.Node): boolean {
    for (let current = node.parent; current; current = current.parent) {
        if (
            current.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
            current.type !== AST_NODE_TYPES.FunctionDeclaration &&
            current.type !== AST_NODE_TYPES.FunctionExpression
        ) {
            continue;
        }

        const parent = current.parent;

        if (
            parent.type === AST_NODE_TYPES.AssignmentExpression &&
            parent.right === current &&
            parent.left.type === AST_NODE_TYPES.MemberExpression
        ) {
            const memberName = getMemberExpressionPropertyName(parent.left);

            if (memberName && IMPERATIVE_UNTRACKED_METHODS.has(memberName)) {
                return true;
            }
        }
    }

    return false;
}

function isAllowedImperativeAngularContext(node: TSESTree.Node): boolean {
    const member = getEnclosingClassMember(node);
    const memberName = member ? getClassMemberName(member) : null;

    return (
        (!!member &&
            !!memberName &&
            (IMPERATIVE_UNTRACKED_METHODS.has(memberName) ||
                isPipeTransformMember(member))) ||
        hasAllowedImperativeAssignment(node)
    );
}

function isAllowedDeferredCallbackContext(
    node: TSESTree.CallExpression,
    checker: ts.TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
): boolean {
    if (!getReactiveCallbackArgument(node)) {
        return false;
    }

    const fn = getEnclosingFunction(node);

    return fn
        ? isDirectCallOrNewArgument(fn) ||
              isStoredFunctionUsedAsCallOrNewArgument(fn, checker, esTreeNodeToTSNodeMap)
        : false;
}

function isAllowedLazyAngularFactoryContext(
    node: TSESTree.CallExpression,
    program: TSESTree.Program,
): boolean {
    const fn = getEnclosingFunction(node);

    return !fn || !getReturnedReactiveOwnerCall(node, program)
        ? false
        : isAngularInjectionTokenFactoryFunction(fn, program) ||
              isAngularUseFactoryFunction(fn);
}

function buildReactiveCallReplacement(
    outerUntrackedCall: TSESTree.CallExpression,
    reactiveCall: TSESTree.CallExpression,
    sourceCode: SourceCode,
): string {
    const text = sourceCode.getText(reactiveCall);

    return reactiveCall.parent.type !== AST_NODE_TYPES.ExpressionStatement ||
        outerUntrackedCall.parent.type !== AST_NODE_TYPES.ExpressionStatement
        ? text
        : dedent(
              text,
              reactiveCall.loc.start.column - outerUntrackedCall.parent.loc.start.column,
          );
}

export const rule = createUntrackedRule<[], MessageId>({
    create(context) {
        const {checker, esTreeNodeToTSNodeMap, program, sourceCode} =
            getTypeAwareRuleContext(context);

        const signalNodeMap = esTreeNodeToTSNodeMap as unknown as NodeMap;

        function isUntrackedUsedElsewhere(
            localName: string,
            excludeNode: TSESTree.CallExpression,
        ): boolean {
            let found = false;

            walkAst(program, (node) => {
                if (
                    node.type === AST_NODE_TYPES.CallExpression &&
                    node !== excludeNode &&
                    node.callee.type === AST_NODE_TYPES.Identifier &&
                    node.callee.name === localName
                ) {
                    found = true;

                    return false;
                }

                return;
            });

            return found;
        }

        return {
            CallExpression(node: TSESTree.CallExpression) {
                if (
                    !isAngularUntrackedCall(node, program) ||
                    findEnclosingReactiveScope(node, program) ||
                    findEnclosingReactiveScopeAfterAsyncBoundary(node, program) ||
                    isAllowedImperativeAngularContext(node) ||
                    isAllowedDeferredCallbackContext(node, checker, signalNodeMap) ||
                    isAllowedLazyAngularFactoryContext(node, program)
                ) {
                    return;
                }

                const reactiveCall = getReturnedReactiveOwnerCall(node, program);

                context.report({
                    fix: reactiveCall
                        ? (fixer) => {
                              const fixes = [
                                  fixer.replaceText(
                                      node,
                                      buildReactiveCallReplacement(
                                          node,
                                          reactiveCall,
                                          sourceCode,
                                      ),
                                  ),
                              ];

                              const untrackedLocalName = findUntrackedAlias(program);

                              const stillUsed =
                                  untrackedLocalName != null &&
                                  isUntrackedUsedElsewhere(untrackedLocalName, node);

                              if (!stillUsed) {
                                  fixes.push(
                                      ...buildImportRemovalFixes(
                                          program,
                                          fixer,
                                          sourceCode,
                                      ),
                                  );
                              }

                              return fixes;
                          }
                        : undefined,
                    messageId: 'outsideReactiveContext',
                    node:
                        node.callee.type === AST_NODE_TYPES.Identifier
                            ? node.callee
                            : node,
                });
            },
        };
    },
    meta: {
        docs: {
            description:
                'Disallow `untracked()` outside reactive callbacks, except for synchronous reactive reads, explicit post-`await` snapshot reads, and supported imperative/deferred/lazy-factory Angular escape hatches',
            url: ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL,
        },
        fixable: 'code',
        messages: {
            outsideReactiveContext:
                '`untracked()` is used outside a reactive callback and outside the supported post-`await` / imperative / deferred / lazy-factory exceptions, so it does not prevent dependency tracking and only adds noise. Remove it. See Angular guide: https://angular.dev/guide/signals#reading-without-tracking-dependencies',
        },
        schema: [],
        type: 'problem',
    },
    name: 'no-untracked-outside-reactive-context',
});

export default rule;
