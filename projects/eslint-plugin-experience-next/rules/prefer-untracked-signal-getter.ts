import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

import {
    isAngularUntrackedCall,
    isGetterMemberAccess,
    isSignalReadCall,
    isSignalType,
    type NodeMap,
} from './utils/angular-signals';
import {unwrapExpression} from './utils/ast-expressions';
import {
    ANGULAR_SIGNALS_UNTRACKED_GUIDE_URL,
    createUntrackedRule,
} from './utils/untracked-docs';

type MessageId = 'preferGetterForm';

function getReturnedExpression(
    node: TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression,
): TSESTree.Expression | null {
    if (node.body.type !== AST_NODE_TYPES.BlockStatement) {
        return unwrapExpression(node.body);
    }

    if (node.body.body.length !== 1) {
        return null;
    }

    const statement = node.body.body[0];

    if (statement?.type !== AST_NODE_TYPES.ReturnStatement || !statement.argument) {
        return null;
    }

    return unwrapExpression(statement.argument);
}

function getWrappedSignalGetter(
    node: TSESTree.CallExpression,
    checker: import('typescript').TypeChecker,
    esTreeNodeToTSNodeMap: NodeMap,
): TSESTree.Expression | null {
    const [arg] = node.arguments;

    if (
        !arg ||
        arg.type === AST_NODE_TYPES.SpreadElement ||
        (arg.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
            arg.type !== AST_NODE_TYPES.FunctionExpression)
    ) {
        return null;
    }

    const body = getReturnedExpression(arg);

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
        const parserServices = ESLintUtils.getParserServices(context);
        const checker = parserServices.program.getTypeChecker();
        const esTreeNodeToTSNodeMap =
            parserServices.esTreeNodeToTSNodeMap as unknown as NodeMap;
        const {sourceCode} = context;
        const program = sourceCode.ast as TSESTree.Program;

        return {
            CallExpression(node: TSESTree.CallExpression) {
                if (!isAngularUntrackedCall(node, program)) {
                    return;
                }

                const getter = getWrappedSignalGetter(
                    node,
                    checker,
                    esTreeNodeToTSNodeMap,
                );

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
