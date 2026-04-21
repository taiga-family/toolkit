import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';

import {getParenthesizedInner, unwrapParenthesized} from '../utils/ast/parenthesized';
import {createRule} from '../utils/create-rule';

type Options = [];

type MessageId = 'preferCombinedIfControlFlow';

type IfGroup = TSESTree.IfStatement[];

type SupportedControlFlowStatement =
    | TSESTree.BreakStatement
    | TSESTree.ContinueStatement
    | TSESTree.ReturnStatement
    | TSESTree.ThrowStatement;

const EMPTY_ARGUMENT = '__EMPTY_ARGUMENT__';

function isSupportedControlFlowStatement(
    node: TSESTree.Statement,
): node is SupportedControlFlowStatement {
    return (
        node.type === AST_NODE_TYPES.BreakStatement ||
        node.type === AST_NODE_TYPES.ContinueStatement ||
        node.type === AST_NODE_TYPES.ReturnStatement ||
        node.type === AST_NODE_TYPES.ThrowStatement
    );
}

function getControlFlowStatement(
    node: TSESTree.Statement,
): SupportedControlFlowStatement | null {
    if (isSupportedControlFlowStatement(node)) {
        return node;
    }

    if (node.type === AST_NODE_TYPES.BlockStatement && node.body.length === 1) {
        const [onlyStatement] = node.body;

        if (onlyStatement && isSupportedControlFlowStatement(onlyStatement)) {
            return onlyStatement;
        }
    }

    return null;
}

function getControlFlowSignature(
    node: TSESTree.IfStatement,
    sourceCode: Readonly<TSESLint.SourceCode>,
): string | null {
    if (node.alternate) {
        return null;
    }

    const controlFlowStatement = getControlFlowStatement(node.consequent);

    if (!controlFlowStatement) {
        return null;
    }

    switch (controlFlowStatement.type) {
        case AST_NODE_TYPES.BreakStatement:
            return controlFlowStatement.label
                ? `break:${sourceCode.getText(controlFlowStatement.label)}`
                : `break:${EMPTY_ARGUMENT}`;
        case AST_NODE_TYPES.ContinueStatement:
            return controlFlowStatement.label
                ? `continue:${sourceCode.getText(controlFlowStatement.label)}`
                : `continue:${EMPTY_ARGUMENT}`;
        case AST_NODE_TYPES.ReturnStatement:
            return controlFlowStatement.argument
                ? `return:${sourceCode.getText(unwrapParenthesized(controlFlowStatement.argument))}`
                : `return:${EMPTY_ARGUMENT}`;
        case AST_NODE_TYPES.ThrowStatement:
            return `throw:${sourceCode.getText(unwrapParenthesized(controlFlowStatement.argument))}`;
    }
}

function hasNonWhitespaceBetween(
    sourceCode: Readonly<TSESLint.SourceCode>,
    left: TSESTree.Node,
    right: TSESTree.Node,
): boolean {
    return sourceCode.text.slice(left.range[1], right.range[0]).trim() !== '';
}

function needsParenthesesInOrChain(node: TSESTree.Expression): boolean {
    if (getParenthesizedInner(node)) {
        return false;
    }

    switch (node.type) {
        case AST_NODE_TYPES.AssignmentExpression:
        case AST_NODE_TYPES.ConditionalExpression:
        case AST_NODE_TYPES.SequenceExpression:
        case AST_NODE_TYPES.TSAsExpression:
        case AST_NODE_TYPES.TSSatisfiesExpression:
        case AST_NODE_TYPES.YieldExpression:
            return true;
        case AST_NODE_TYPES.LogicalExpression:
            return node.operator !== '||';
        default:
            return false;
    }
}

function renderTest(
    node: TSESTree.Expression,
    sourceCode: Readonly<TSESLint.SourceCode>,
): string {
    const text = sourceCode.getText(node);

    return needsParenthesesInOrChain(node) ? `(${text})` : text;
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const {sourceCode} = context;

        function checkBody(statements: readonly TSESTree.Node[]): void {
            let i = 0;

            while (i < statements.length) {
                const statement = statements[i];

                if (!statement) {
                    break;
                }

                if (statement.type !== AST_NODE_TYPES.IfStatement) {
                    i++;
                    continue;
                }

                const signature = getControlFlowSignature(statement, sourceCode);

                if (!signature) {
                    i++;
                    continue;
                }

                const group: IfGroup = [statement];
                let j = i + 1;

                while (j < statements.length) {
                    const nextStatement = statements[j];

                    if (!nextStatement) {
                        break;
                    }

                    const previousStatement = group[group.length - 1];

                    if (nextStatement.type !== AST_NODE_TYPES.IfStatement) {
                        break;
                    }

                    if (
                        previousStatement &&
                        !hasNonWhitespaceBetween(
                            sourceCode,
                            previousStatement,
                            nextStatement,
                        ) &&
                        sourceCode.getCommentsInside(nextStatement).length === 0 &&
                        getControlFlowSignature(nextStatement, sourceCode) === signature
                    ) {
                        group.push(nextStatement);
                        j++;
                        continue;
                    }

                    break;
                }

                if (group.length > 1) {
                    for (const [index, ifStatement] of group.entries()) {
                        context.report({
                            ...(index === 0
                                ? {
                                      fix(fixer) {
                                          const [firstIf] = group;
                                          const lastIf = group[group.length - 1];

                                          if (!firstIf || !lastIf) {
                                              return null;
                                          }

                                          const condition = group
                                              .map((item) =>
                                                  renderTest(item.test, sourceCode),
                                              )
                                              .join(' || ');

                                          return fixer.replaceTextRange(
                                              [firstIf.range[0], lastIf.range[1]],
                                              `if (${condition}) ${sourceCode.getText(firstIf.consequent)}`,
                                          );
                                      },
                                  }
                                : {}),
                            messageId: 'preferCombinedIfControlFlow',
                            node: ifStatement,
                        });
                    }
                }

                i = j;
            }
        }

        return {
            BlockStatement(node) {
                checkBody(node.body);
            },
            Program(node) {
                checkBody(node.body);
            },
        };
    },
    meta: {
        docs: {
            description:
                'Combine consecutive if statements that use the same return, break, continue, or throw statement into a single if statement.',
        },
        fixable: 'code',
        messages: {
            preferCombinedIfControlFlow:
                'Combine consecutive if statements with identical return, break, continue, or throw statements.',
        },
        schema: [],
        type: 'suggestion',
    },
    name: 'prefer-combined-if-control-flow',
});

export default rule;
