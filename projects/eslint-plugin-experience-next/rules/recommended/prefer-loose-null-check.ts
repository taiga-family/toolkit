import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {createRule} from '../utils/create-rule';

type Options = [];

type MessageId = 'preferLooseNullCheck';

type NullKind = 'null' | 'undefined';

type StrictOp = '!==' | '===';

interface ParsedNullCheck {
    comparedWith: NullKind;
    operand: string;
    strictOp: StrictOp;
}

interface LooseNullCheckMatch {
    replacement: string;
    firstCheckIndex: number;
    secondCheckIndex: number;
}

function parseStrictNullCheck(
    node: TSESTree.Node,
    getText: (n: TSESTree.Node) => string,
): ParsedNullCheck | null {
    if (node.type !== AST_NODE_TYPES.BinaryExpression) {
        return null;
    }

    const {left, operator, right} = node;

    if (operator !== '!==' && operator !== '===') {
        return null;
    }

    if (right.type === AST_NODE_TYPES.Literal && right.value === null) {
        return {comparedWith: 'null', operand: getText(left), strictOp: operator};
    }

    if (right.type === AST_NODE_TYPES.Identifier && right.name === 'undefined') {
        return {comparedWith: 'undefined', operand: getText(left), strictOp: operator};
    }

    if (left.type === AST_NODE_TYPES.Literal && left.value === null) {
        return {comparedWith: 'null', operand: getText(right), strictOp: operator};
    }

    return left.type === AST_NODE_TYPES.Identifier && left.name === 'undefined'
        ? {comparedWith: 'undefined', operand: getText(right), strictOp: operator}
        : null;
}

function isParsedNullCheck(value: ParsedNullCheck | null): value is ParsedNullCheck {
    return value !== null;
}

function getLooseNullCheck(
    left: ParsedNullCheck | null,
    right: ParsedNullCheck | null,
): string | null {
    return !isParsedNullCheck(left) ||
        !isParsedNullCheck(right) ||
        left.strictOp !== right.strictOp ||
        left.operand !== right.operand ||
        left.comparedWith === right.comparedWith
        ? null
        : `${left.operand} ${left.strictOp === '!==' ? '!=' : '=='} null`;
}

function collectAndLeaves(node: TSESTree.Node): TSESTree.Node[] {
    return node.type === AST_NODE_TYPES.LogicalExpression && node.operator === '&&'
        ? [...collectAndLeaves(node.left), ...collectAndLeaves(node.right)]
        : [node];
}

function isAndChainRoot(node: TSESTree.LogicalExpression): boolean {
    return (
        node.parent.type !== AST_NODE_TYPES.LogicalExpression ||
        node.parent.operator !== '&&'
    );
}

function findLooseNullCheckMatch(
    parsedChecks: ReadonlyArray<ParsedNullCheck | null>,
): LooseNullCheckMatch | null {
    for (const [firstCheckIndex, firstCheck] of parsedChecks.entries()) {
        if (!isParsedNullCheck(firstCheck)) {
            continue;
        }

        for (
            let secondCheckIndex = firstCheckIndex + 1;
            secondCheckIndex < parsedChecks.length;
            secondCheckIndex++
        ) {
            const replacement = getLooseNullCheck(
                firstCheck,
                parsedChecks[secondCheckIndex] ?? null,
            );

            if (replacement !== null) {
                return {firstCheckIndex, replacement, secondCheckIndex};
            }
        }
    }

    return null;
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const getText = (n: TSESTree.Node): string => context.sourceCode.getText(n);

        return {
            /**
             * Handles only paired null/undefined checks in the same `&&` chain.
             */
            LogicalExpression(node) {
                if (node.operator !== '&&' || !isAndChainRoot(node)) {
                    return;
                }

                const leaves = collectAndLeaves(node);

                const parsedChecks = leaves.map((leaf) =>
                    parseStrictNullCheck(leaf, getText),
                );

                const match = findLooseNullCheckMatch(parsedChecks);

                if (match === null) {
                    return;
                }

                const replacement = leaves
                    .filter((_, index) => index !== match.secondCheckIndex)
                    .map((leaf, index) =>
                        index === match.firstCheckIndex
                            ? match.replacement
                            : getText(leaf),
                    )
                    .join(' && ');

                context.report({
                    fix: (fixer) => fixer.replaceText(node, replacement),
                    messageId: 'preferLooseNullCheck',
                    node,
                });
            },
        };
    },

    meta: {
        docs: {
            description:
                'Prefer loose null checks over paired strict comparisons against `null` and `undefined`.',
        },
        fixable: 'code',
        messages: {
            preferLooseNullCheck:
                'Prefer loose null check over paired strict comparisons against `null` and `undefined`.',
        },
        schema: [],
        type: 'suggestion',
    },

    name: 'prefer-loose-null-check',
});

export default rule;
