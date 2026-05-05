import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {unwrapParenthesized} from '../utils/ast/parenthesized';
import {createRule} from '../utils/create-rule';

type MessageId = 'doWhileLoop' | 'forLoop' | 'whileLoop';

function isInfiniteLoopLiteral(node: TSESTree.Node): boolean {
    const unwrapped = unwrapParenthesized(node);

    return unwrapped.type === AST_NODE_TYPES.Literal
        ? unwrapped.value === true || unwrapped.value === 1
        : false;
}

function isInfiniteLoopTest(test: TSESTree.Expression | null): boolean {
    return test == null || isInfiniteLoopLiteral(test);
}

export const rule = createRule<[], MessageId>({
    create(context) {
        return {
            DoWhileStatement(node) {
                if (isInfiniteLoopTest(node.test)) {
                    context.report({
                        messageId: 'doWhileLoop',
                        node: node.test,
                    });
                }
            },
            ForStatement(node) {
                if (isInfiniteLoopTest(node.test)) {
                    context.report({
                        messageId: 'forLoop',
                        node,
                    });
                }
            },
            WhileStatement(node) {
                if (isInfiniteLoopTest(node.test)) {
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
                'Disallow `for (;;)` / conditionals `for`, `while (true)`, and `do ... while (true)`. Prefer loops with meaningful exit conditions.',
        },
        messages: {
            doWhileLoop:
                'Use an explicit exit condition instead of `do ... while (true)`.',
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
