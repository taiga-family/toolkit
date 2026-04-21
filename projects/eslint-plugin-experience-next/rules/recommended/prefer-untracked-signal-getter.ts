import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {
    getReactiveCallbackArgument,
    isAngularUntrackedCall,
    isGetterMemberAccess,
    isSignalReadCall,
    isSignalType,
} from '../utils/angular/angular-signals';
import {
    ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL,
    createUntrackedRule,
} from '../utils/angular/untracked-docs';
import {unwrapExpression} from '../utils/ast/ast-expressions';
import {getReturnedExpression} from '../utils/ast/returned-expression';
import {type NodeMap} from '../utils/typescript/node-map';
import {getTypeAwareRuleContext} from '../utils/typescript/type-aware-context';

type MessageId = 'preferGetterForm';

function getWrappedSignalGetter(
    node: TSESTree.CallExpression,
    checker: import('typescript').TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
): TSESTree.Expression | null {
    const callback = getReactiveCallbackArgument(node);

    if (!callback) {
        return null;
    }

    const returnedExpression = getReturnedExpression(callback);
    const body = returnedExpression ? unwrapExpression(returnedExpression) : null;

    if (
        body?.type !== AST_NODE_TYPES.CallExpression ||
        !isSignalReadCall(body, checker, esTreeNodeToTSNodeMap)
    ) {
        return null;
    }

    const getter = unwrapExpression(body.callee);

    if (
        getter.type === AST_NODE_TYPES.MemberExpression &&
        isGetterMemberAccess(getter, checker, esTreeNodeToTSNodeMap)
    ) {
        return null;
    }

    return isSignalType(getter, checker, esTreeNodeToTSNodeMap) ? body.callee : null;
}

export const rule = createUntrackedRule<[], MessageId>({
    create(context) {
        const {checker, esTreeNodeToTSNodeMap, program, sourceCode} =
            getTypeAwareRuleContext(context);
        const signalNodeMap = esTreeNodeToTSNodeMap as unknown as NodeMap;

        return {
            CallExpression(node: TSESTree.CallExpression) {
                if (!isAngularUntrackedCall(node, program)) {
                    return;
                }

                const getter = getWrappedSignalGetter(node, checker, signalNodeMap);

                if (!getter) {
                    return;
                }

                context.report({
                    fix: (fixer) =>
                        fixer.replaceText(
                            node,
                            `${sourceCode.getText(node.callee)}(${sourceCode.getText(getter)})`,
                        ),
                    messageId: 'preferGetterForm',
                    node,
                });
            },
        };
    },
    meta: {
        docs: {
            description:
                'Prefer `untracked(signalGetter)` over `untracked(() => signalGetter())` for a single signal getter',
            url: ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL,
        },
        fixable: 'code',
        messages: {
            preferGetterForm:
                'Pass single signal getters directly as `untracked(signalGetter)` instead of wrapping them in `untracked(() => signalGetter())`. See Angular guide: https://angular.dev/guide/signals#reading-without-tracking-dependencies',
        },
        schema: [],
        type: 'suggestion',
    },
    name: 'prefer-untracked-signal-getter',
});

export default rule;
