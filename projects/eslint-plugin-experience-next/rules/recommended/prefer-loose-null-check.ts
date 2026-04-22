import {AST_NODE_TYPES, type TSESTree} from '@typescript-eslint/utils';

import {createRule} from '../utils/create-rule';

type Options = [];

type MessageId = 'preferLooseNullCheck';

type NullKind = 'null' | 'undefined';

type StrictOp = '!==' | '===';

interface ParsedNullCheck {
    kind: NullKind;
    operand: string;
    strictOp: StrictOp;
}

/**
 * If `node` is a strict `!==` or `===` comparison against `null` or `undefined`
 * (in either operand order), returns the checked kind, the text of the non-null
 * operand, and the original operator. Otherwise returns null.
 */
function parseStrictNullCheck(
    node: TSESTree.BinaryExpression,
    getText: (n: TSESTree.Node) => string,
): ParsedNullCheck | null {
    const {left, operator, right} = node;

    if (operator !== '!==' && operator !== '===') {
        return null;
    }

    if (right.type === AST_NODE_TYPES.Literal && right.value == null) {
        return {kind: 'null', operand: getText(left), strictOp: operator};
    }

    if (right.type === AST_NODE_TYPES.Identifier && right.name === 'undefined') {
        return {kind: 'undefined', operand: getText(left), strictOp: operator};
    }

    if (left.type === AST_NODE_TYPES.Literal && left.value == null) {
        return {kind: 'null', operand: getText(right), strictOp: operator};
    }

    if (left.type === AST_NODE_TYPES.Identifier && left.name === 'undefined') {
        return {kind: 'undefined', operand: getText(right), strictOp: operator};
    }

    return null;
}

/** Collects all non-`&&` leaves from a chain of `&&` LogicalExpressions. */
function collectAndLeaves(node: TSESTree.Node): TSESTree.Node[] {
    if (node.type === AST_NODE_TYPES.LogicalExpression && node.operator === '&&') {
        return [...collectAndLeaves(node.left), ...collectAndLeaves(node.right)];
    }

    return [node];
}

/** True when this `&&` node is not itself the right/left child of another `&&`. */
function isAndChainRoot(node: TSESTree.LogicalExpression): boolean {
    return (
        node.parent.type !== AST_NODE_TYPES.LogicalExpression ||
        node.parent.operator !== '&&'
    );
}

/** Maps a strict operator to its loose equivalent. */
function toLooseCheck(strictOp: StrictOp, operand: string): string {
    return strictOp === '!==' ? `${operand} != null` : `${operand} == null`;
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const getText = (n: TSESTree.Node): string => context.sourceCode.getText(n);

        return {
            /**
             * Handles `&&` chains of any length at their root.
             *
             * Every `x !== null`, `x !== undefined`, `x === null`, or `x === undefined`
             * leaf is replaced with the appropriate loose check (`x != null` or
             * `x == null`). When multiple checks for the same operand produce the same
             * loose form, only the first is kept — the rest are removed to avoid
             * redundant expressions like `x != null && x != null`.
             */
            LogicalExpression(node) {
                if (node.operator !== '&&' || !isAndChainRoot(node)) {
                    return;
                }

                const leaves = collectAndLeaves(node);

                const parsed = leaves.map((leaf) => {
                    if (leaf.type !== AST_NODE_TYPES.BinaryExpression) {
                        return null;
                    }

                    return parseStrictNullCheck(leaf, getText);
                });

                const hasChanges = parsed.some((d) => d != null);

                if (!hasChanges) {
                    return;
                }

                context.report({
                    fix(fixer) {
                        // Track which loose expressions have already been emitted to
                        // avoid `x != null && x != null` from paired checks.
                        const emitted = new Set<string>();
                        const newLeaves: string[] = [];

                        for (const [i, leaf] of leaves.entries()) {
                            const data = parsed[i];

                            if (data == null) {
                                newLeaves.push(getText(leaf));
                            } else {
                                const loose = toLooseCheck(data.strictOp, data.operand);

                                if (!emitted.has(loose)) {
                                    emitted.add(loose);
                                    newLeaves.push(loose);
                                }
                                // Duplicate loose check for the same operand — drop it.
                            }
                        }

                        return fixer.replaceText(node, newLeaves.join(' && '));
                    },
                    messageId: 'preferLooseNullCheck',
                    node,
                });
            },

            /**
             * Handles standalone `x !== null`, `x !== undefined`, `x === null`, or
             * `x === undefined` that is not part of any `&&` chain. Nodes inside a
             * `&&` chain are fully handled by the LogicalExpression visitor above.
             */
            BinaryExpression(node) {
                if (
                    node.parent.type === AST_NODE_TYPES.LogicalExpression &&
                    node.parent.operator === '&&'
                ) {
                    return;
                }

                const parsed = parseStrictNullCheck(node, getText);

                if (parsed == null) {
                    return;
                }

                context.report({
                    fix: (fixer) =>
                        fixer.replaceText(
                            node,
                            toLooseCheck(parsed.strictOp, parsed.operand),
                        ),
                    messageId: 'preferLooseNullCheck',
                    node,
                });
            },
        };
    },

    meta: {
        docs: {
            description:
                'Prefer `x != null` / `x == null` over explicit strict comparisons against `null` or `undefined`.',
        },
        fixable: 'code',
        messages: {
            preferLooseNullCheck:
                'Prefer loose null check (`!= null` or `== null`) over explicit strict comparisons against `null` or `undefined`.',
        },
        schema: [],
        type: 'suggestion',
    },

    name: 'prefer-loose-null-check',
});

export default rule;
