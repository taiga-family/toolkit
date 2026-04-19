import {AST_NODE_TYPES, ESLintUtils, type TSESTree} from '@typescript-eslint/utils';

import {unwrapParenthesized} from './utils/ast/parenthesized';

const createRule = ESLintUtils.RuleCreator((name) => name);

type MessageId = 'forLoop' | 'whileLoop';

function isBooleanTrue(node: TSESTree.Expression): boolean {
    const unwrapped = unwrapParenthesized(node);

    return unwrapped.type === AST_NODE_TYPES.Literal && unwrapped.value === true;
}

export const rule = createRule<[], MessageId>({
    create(context) {
        return {
            ForStatement(node) {
                if (!node.test) {
                    context.report({
                        messageId: 'forLoop',
                        node,
                    });
                }
            },
            WhileStatement(node) {
                if (isBooleanTrue(node.test)) {
                    context.report({
                        messageId: 'whileLoop',
                        node: node.test,
                    });
                }
            },
        };
    },
    meta: {
        docs: {
            description:
                'Disallow `while (true)` and `for` loops without an explicit condition. Prefer loops with meaningful exit conditions.',
        },
        messages: {
            forLoop:
                'Use an explicit exit condition instead of a `for` loop without a condition.',
            whileLoop: 'Use an explicit exit condition instead of `while (true)`.',
        },
        schema: [],
        type: 'suggestion',
    },
    name: 'no-infinite-loop',
});

export default rule;
