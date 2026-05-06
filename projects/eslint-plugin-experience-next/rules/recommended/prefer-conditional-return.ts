import {
    AST_NODE_TYPES,
    ESLintUtils,
    type TSESLint,
    type TSESTree,
} from '@typescript-eslint/utils';
import ts from 'typescript';

import {getParenthesizedInner, unwrapParenthesized} from '../utils/ast/parenthesized';
import {createRule} from '../utils/create-rule';

type Options = [];

type MessageId = 'preferConditionalReturn';

type BooleanTestReturnStrategy = 'coerce' | 'direct' | 'negate' | 'skip';

const MAX_INLINE_CONDITIONAL_RETURN_LENGTH = 90;

const BOOLEAN_BINARY_OPERATORS = new Set([
    '!=',
    '!==',
    '<',
    '<=',
    '==',
    '===',
    '>',
    '>=',
    'in',
    'instanceof',
]);

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

function isBooleanLiteral(node: TSESTree.Expression): node is TSESTree.BooleanLiteral {
    return node.type === AST_NODE_TYPES.Literal && typeof node.value === 'boolean';
}

function getBooleanLiteralValue(node: TSESTree.Expression): boolean | null {
    return isBooleanLiteral(node) ? node.value : null;
}

function isKnownBooleanExpression(node: TSESTree.Expression): boolean {
    const unwrapped = unwrapTypeAndParentheses(node);

    switch (unwrapped.type) {
        case AST_NODE_TYPES.BinaryExpression:
            return BOOLEAN_BINARY_OPERATORS.has(unwrapped.operator);

        case AST_NODE_TYPES.Literal:
            return typeof unwrapped.value === 'boolean';

        case AST_NODE_TYPES.LogicalExpression:
            return (
                isKnownBooleanExpression(unwrapped.left) &&
                isKnownBooleanExpression(unwrapped.right)
            );

        case AST_NODE_TYPES.UnaryExpression:
            return unwrapped.operator === '!';

        default:
            return false;
    }
}

function isBooleanType(type: ts.Type): boolean {
    const types = type.isUnion() ? type.types : [type];

    return types.every((part) => !!(part.flags & ts.TypeFlags.BooleanLike));
}

function getBooleanTestReturnStrategy(
    test: TSESTree.Expression,
    consequentExpression: TSESTree.Expression,
    alternateExpression: TSESTree.Expression,
    isTypeCheckedBooleanExpression: (node: TSESTree.Expression) => boolean,
): BooleanTestReturnStrategy {
    const consequentValue = getBooleanLiteralValue(consequentExpression);
    const alternateValue = getBooleanLiteralValue(alternateExpression);

    if (consequentValue === false && alternateValue === true) {
        return unwrapTypeAndParentheses(test).type === AST_NODE_TYPES.LogicalExpression
            ? 'skip'
            : 'negate';
    }

    if (consequentValue !== true || alternateValue !== false) {
        return 'skip';
    }

    return isKnownBooleanExpression(test) || isTypeCheckedBooleanExpression(test)
        ? 'direct'
        : 'coerce';
}

function shouldSkipBooleanReturn(
    test: TSESTree.Expression,
    consequentExpression: TSESTree.Expression,
    alternateExpression: TSESTree.Expression,
): boolean {
    return (
        getBooleanLiteralValue(consequentExpression) === false &&
        getBooleanLiteralValue(alternateExpression) === true &&
        unwrapTypeAndParentheses(test).type === AST_NODE_TYPES.LogicalExpression
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

function needsParenthesesInBooleanCoercion(node: TSESTree.Expression): boolean {
    if (getParenthesizedInner(node)) {
        return false;
    }

    switch (node.type) {
        case AST_NODE_TYPES.ArrowFunctionExpression:
        case AST_NODE_TYPES.AssignmentExpression:
        case AST_NODE_TYPES.BinaryExpression:
        case AST_NODE_TYPES.ConditionalExpression:
        case AST_NODE_TYPES.LogicalExpression:
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

function renderBooleanTestReturn(
    ifStatement: TSESTree.IfStatement,
    sourceCode: Readonly<TSESLint.SourceCode>,
    strategy: Exclude<BooleanTestReturnStrategy, 'skip'>,
): string {
    const test = sourceCode.getText(ifStatement.test);

    if (strategy === 'negate') {
        if (!test.includes('\n')) {
            const renderedTest = needsParenthesesInBooleanCoercion(ifStatement.test)
                ? `(${test})`
                : test;

            return `return !${renderedTest};`;
        }

        const indent = getStatementIndent(ifStatement, sourceCode);

        return `return !(\n${indent}    ${test}\n${indent});`;
    }

    if (strategy === 'coerce') {
        if (!test.includes('\n')) {
            const renderedTest = needsParenthesesInBooleanCoercion(ifStatement.test)
                ? `(${test})`
                : test;

            return `return !!${renderedTest};`;
        }

        const indent = getStatementIndent(ifStatement, sourceCode);

        return `return !!(\n${indent}    ${test}\n${indent});`;
    }

    if (!test.includes('\n')) {
        return `return ${test};`;
    }

    const indent = getStatementIndent(ifStatement, sourceCode);

    return `return (\n${indent}    ${test}\n${indent});`;
}

export const rule = createRule<Options, MessageId>({
    create(context) {
        const {sourceCode} = context;

        let parserServices: ReturnType<typeof ESLintUtils.getParserServices> | null =
            null;

        let checker: ts.TypeChecker | null = null;

        try {
            parserServices = ESLintUtils.getParserServices(context);
            checker = parserServices.program.getTypeChecker();
        } catch {
            // Type checking is optional; syntactic boolean detection still works.
        }

        function isTypeCheckedBooleanExpression(node: TSESTree.Expression): boolean {
            if (!parserServices || !checker) {
                return false;
            }

            try {
                const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);

                return isBooleanType(checker.getTypeAtLocation(tsNode));
            } catch {
                return false;
            }
        }

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
                    shouldSkipBooleanReturn(
                        statement.test,
                        consequentArgument,
                        finalArgument,
                    ) ||
                    !hasOnlyWhitespaceBetween(sourceCode, statement, finalReturn) ||
                    sourceCode.getCommentsInside(statement).length > 0 ||
                    sourceCode.getCommentsInside(finalReturn).length > 0
                ) {
                    continue;
                }

                context.report({
                    fix(fixer) {
                        const booleanTestReturnStrategy = getBooleanTestReturnStrategy(
                            statement.test,
                            consequentArgument,
                            finalArgument,
                            isTypeCheckedBooleanExpression,
                        );

                        const replacement =
                            booleanTestReturnStrategy === 'skip'
                                ? renderConditionalReturn(
                                      statement,
                                      consequentArgument,
                                      finalArgument,
                                      sourceCode,
                                  )
                                : renderBooleanTestReturn(
                                      statement,
                                      sourceCode,
                                      booleanTestReturnStrategy,
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
