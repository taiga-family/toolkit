import {AST_NODE_TYPES, type TSESLint, type TSESTree} from '@typescript-eslint/utils';

import {getParenthesizedInner, unwrapParenthesized} from '../utils/ast/parenthesized';
import {createRule} from '../utils/create-rule';

type Options = [];

type MessageId = 'preferConditionalReturn';

const MAX_INLINE_CONDITIONAL_RETURN_LENGTH = 90;

function getReturnStatement(
    statement: TSESTree.Statement,
): TSESTree.ReturnStatement | null {
    if (statement.type === AST_NODE_TYPES.ReturnStatement) {
        return statement;
    }

    if (statement.type !== AST_NODE_TYPES.BlockStatement || statement.body.length !== 1) {
        return null;
    }

    const [onlyStatement] = statement.body;

    return onlyStatement?.type === AST_NODE_TYPES.ReturnStatement ? onlyStatement : null;
}

function hasOnlyWhitespaceBetween(
    sourceCode: Readonly<TSESLint.SourceCode>,
    left: TSESTree.Node,
    right: TSESTree.Node,
): boolean {
    return sourceCode.text.slice(left.range[1], right.range[0]).trim() === '';
}

function unwrapTypeAndParentheses(node: TSESTree.Expression): TSESTree.Node {
    let current: TSESTree.Node = node;
    let didUnwrap = true;

    while (didUnwrap) {
        didUnwrap = false;

        const parenthesized = unwrapParenthesized(current);

        if (parenthesized !== current) {
            current = parenthesized;
            didUnwrap = true;
            continue;
        }

        switch (current.type) {
            case AST_NODE_TYPES.TSAsExpression:
            case AST_NODE_TYPES.TSNonNullExpression:
            case AST_NODE_TYPES.TSSatisfiesExpression:
            case AST_NODE_TYPES.TSTypeAssertion:
                current = current.expression;
                didUnwrap = true;
                break;

            default:
                break;
        }
    }

    return current;
}

function isConditionalExpression(node: TSESTree.Expression | null): boolean {
    return (
        node !== null &&
        unwrapTypeAndParentheses(node).type === AST_NODE_TYPES.ConditionalExpression
    );
}

function needsParenthesesInConditionalTest(node: TSESTree.Expression): boolean {
    if (getParenthesizedInner(node)) {
        return false;
    }

    switch (node.type) {
        case AST_NODE_TYPES.ArrowFunctionExpression:
        case AST_NODE_TYPES.AssignmentExpression:
        case AST_NODE_TYPES.ConditionalExpression:
        case AST_NODE_TYPES.ObjectExpression:
        case AST_NODE_TYPES.SequenceExpression:
        case AST_NODE_TYPES.TSAsExpression:
        case AST_NODE_TYPES.TSSatisfiesExpression:
        case AST_NODE_TYPES.TSTypeAssertion:
        case AST_NODE_TYPES.YieldExpression:
            return true;

        default:
            return false;
    }
}

function needsParenthesesInConditionalBranch(node: TSESTree.Expression): boolean {
    if (getParenthesizedInner(node)) {
        return false;
    }

    switch (node.type) {
        case AST_NODE_TYPES.ArrowFunctionExpression:
        case AST_NODE_TYPES.AssignmentExpression:
        case AST_NODE_TYPES.ConditionalExpression:
        case AST_NODE_TYPES.SequenceExpression:
        case AST_NODE_TYPES.TSAsExpression:
        case AST_NODE_TYPES.TSSatisfiesExpression:
        case AST_NODE_TYPES.TSTypeAssertion:
        case AST_NODE_TYPES.YieldExpression:
            return true;

        default:
            return false;
    }
}

function renderExpression(
    node: TSESTree.Expression,
    sourceCode: Readonly<TSESLint.SourceCode>,
    needsParentheses: (node: TSESTree.Expression) => boolean,
): string {
    const text = sourceCode.getText(node);

    return needsParentheses(node) ? `(${text})` : text;
}

function getStatementIndent(
    node: TSESTree.Statement,
    sourceCode: Readonly<TSESLint.SourceCode>,
): string {
    const lineStart = sourceCode.getIndexFromLoc({
        column: 0,
        line: node.loc.start.line,
    });

    return sourceCode.text.slice(lineStart, node.range[0]);
}

function renderConditionalReturn(
    ifStatement: TSESTree.IfStatement,
    consequentExpression: TSESTree.Expression,
    alternateExpression: TSESTree.Expression,
    sourceCode: Readonly<TSESLint.SourceCode>,
): string {
    const test = renderExpression(
        ifStatement.test,
        sourceCode,
        needsParenthesesInConditionalTest,
    );

    const consequent = renderExpression(
        consequentExpression,
        sourceCode,
        needsParenthesesInConditionalBranch,
    );

    const alternate = renderExpression(
        alternateExpression,
        sourceCode,
        needsParenthesesInConditionalBranch,
    );

    const inlineReturn = `return ${test} ? ${consequent} : ${alternate};`;
    const indent = getStatementIndent(ifStatement, sourceCode);

    if (indent.length + inlineReturn.length <= MAX_INLINE_CONDITIONAL_RETURN_LENGTH) {
        return inlineReturn;
    }

    const branchIndent = `${indent}    `;

    return `return ${test}\n${branchIndent}? ${consequent}\n${branchIndent}: ${alternate};`;
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const {sourceCode} = context;

        function checkBody(statements: readonly TSESTree.Statement[]): void {
            for (const [index, statement] of statements.entries()) {
                if (statement.type !== AST_NODE_TYPES.IfStatement) {
                    continue;
                }

                const nextStatement = statements[index + 1];

                if (nextStatement?.type !== AST_NODE_TYPES.ReturnStatement) {
                    continue;
                }

                const consequentReturn = getReturnStatement(statement.consequent);
                const finalReturn = nextStatement;
                const consequentArgument = consequentReturn?.argument ?? null;
                const finalArgument = finalReturn.argument;

                if (
                    statement.alternate ||
                    !consequentArgument ||
                    !finalArgument ||
                    isConditionalExpression(consequentArgument) ||
                    isConditionalExpression(finalArgument) ||
                    !hasOnlyWhitespaceBetween(sourceCode, statement, finalReturn) ||
                    sourceCode.getCommentsInside(statement).length > 0 ||
                    sourceCode.getCommentsInside(finalReturn).length > 0
                ) {
                    continue;
                }

                context.report({
                    fix(fixer) {
                        const replacement = renderConditionalReturn(
                            statement,
                            consequentArgument,
                            finalArgument,
                            sourceCode,
                        );

                        return fixer.replaceTextRange(
                            [statement.range[0], finalReturn.range[1]],
                            replacement,
                        );
                    },
                    messageId: 'preferConditionalReturn',
                    node: statement,
                });
            }
        }

        return {
            BlockStatement(node) {
                checkBody(node.body);
            },
            Program(node) {
                checkBody(node.body);
            },
            SwitchCase(node) {
                checkBody(node.consequent);
            },
        };
    },
    meta: {
        docs: {
            description:
                'Prefer a single conditional return over an if statement followed by another return statement.',
        },
        fixable: 'code',
        messages: {
            preferConditionalReturn:
                'Replace this if/return pair with a single conditional return.',
        },
        schema: [],
        type: 'suggestion',
    },
    name: 'prefer-conditional-return',
});

export default rule;
